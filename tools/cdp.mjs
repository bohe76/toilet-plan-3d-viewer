// Chrome DevTools Protocol 호출 스크립트. Chrome은 --headless=new --remote-debugging-port=9333 으로 떠 있어야 한다.
//   node cdp.mjs snap "<주소 인자>" <png 경로> [폭x높이] [기다림 ms]
//        예: node tools/cdp.mjs snap "sheet=research-5f&mode=plan&view=top&dim=1" work/verify/p8/top.png 2400x2400
//        주소를 열고, 화면이 준비되면 PNG로 저장한다. 결과를 JSON 한 줄로 출력한다.
//        여러 작성자가 같이 써도 된다. 잠금 폴더로 한 번에 한 명만 찍는다. 다른 사람이 찍는 동안은 기다린다.
//        절단 높이의 기본값은 탭의 최대값이다. 검수용 평면 캡처에는 cut=1200 을 붙인다.
//   node cdp.mjs act "<주소 인자>" <단계 json 파일 또는 json 문자열> [폭x높이]
//        예: node tools/cdp.mjs act "sheet=research-3f&view=eye" work/verify/ux/eye_drag.json
//        주소를 열고, 화면이 준비되면 단계를 차례로 실행한다. 한 연결 안에서 하므로 화면 크기가 유지된다. 잠금을 쓴다.
//        주소 인자가 - 이면 주소를 열지 않고 지금 화면에서 실행한다.
//        단계(배열의 원소, 좌표는 화면 px):
//          {"wait": ms}                       기다린다
//          {"ready": true}                    로딩 표시(.stage[data-loading])가 없어질 때까지 기다린다
//          {"move": [x, y]}                   마우스를 옮긴다(호버)
//          {"drag": [x1, y1, x2, y2], "button": "left|right|middle", "steps": 12}
//          {"click": [x, y]}  {"dblclick": [x, y]}
//          {"wheel": [x, y, deltaY]}          deltaY 100이 휠 한 칸이다. 양수가 아래로 굴리기다
//          {"key": "ArrowUp", "shift": true}  키를 한 번 누른다
//          {"eval": "<js 식>"}                결과를 results에 넣는다
//          {"shot": "<png 경로>"}             화면을 저장한다
//        결과를 JSON 한 줄로 출력한다: { url, size, results: [...], errors: [...] }
//   snap 과 act 는 처음 접속 때 뜨는 조작법 창을 미리 끈다. 그 창을 보려면 환경 변수 CDP_KEEP_HELP=1 을 준다.
//   node cdp.mjs eval "<js 식>"        식을 페이지에서 실행하고 결과를 JSON으로 출력
//   node cdp.mjs shot <png 경로>       화면을 PNG로 저장
//   node cdp.mjs nav <url>             주소 이동
//   node cdp.mjs console               지금까지 쌓인 콘솔 오류는 못 본다. 5초 동안 새 메시지만 출력
// eval, shot, nav, console 은 잠금을 쓰지 않는다. 혼자 쓸 때만 쓴다.
import { mkdirSync, readFileSync, rmdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 9333;
const BASE = 'http://localhost:5183/';
/** 뷰어가 「조작법 다시 보지 않기」를 적어 두는 로컬 스토리지 키. src/App.tsx 의 값과 같아야 한다. */
const HELP_KEY = 'toilet-plan-3d-viewer.help.v1';
const LOCK = join(dirname(fileURLToPath(import.meta.url)), '.cdp.lock');
const [, , cmd, arg, arg2, arg3, arg4] = process.argv;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 잠금 폴더를 만든다. 이미 있으면 기다린다. 3분 넘은 잠금은 죽은 것으로 보고 지운다. */
async function lock() {
  for (let i = 0; i < 600; i += 1) {
    try {
      mkdirSync(LOCK);
      return;
    } catch {
      try {
        if (Date.now() - statSync(LOCK).mtimeMs > 180_000) rmdirSync(LOCK);
      } catch { /* 방금 풀렸다 */ }
      await sleep(1000);
    }
  }
  throw new Error('잠금을 얻지 못했다 (10분)');
}

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = targets.find((t) => t.type === 'page');
if (!page) throw new Error('page target 없음');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});
let seq = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (cmd === 'console' && (msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Runtime.exceptionThrown')) {
    console.log(JSON.stringify(msg.params).slice(0, 600));
  } else if (msg.method === 'Runtime.exceptionThrown') {
    errors.push(String(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text).slice(0, 300));
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, (msg) => (msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

/**
 * 주소를 열고 화면이 준비될 때까지 0.5초마다 본다(최대 90초).
 * 준비 = 캔버스가 있고, 요청이 끝났고, 로딩 표시(.stage[data-loading])가 없다.
 */
async function open(url, width, height) {
  await send('Runtime.enable');
  // 처음 접속 때 뜨는 조작법 창이 캡처를 가리지 않게 「다시 보지 않기」 값을 미리 넣는다.
  // 조작법 창 자체를 볼 때는 환경 변수 CDP_KEEP_HELP=1 을 준다. 그때는 값을 지운다.
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { ${process.env.CDP_KEEP_HELP === '1' ? `localStorage.removeItem('${HELP_KEY}')` : `localStorage.setItem('${HELP_KEY}', '1')`}; } catch {}`,
  });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  if (url === null) return { canvas: true, overlay: null, loading: false };
  // 같은 주소면 navigate가 새로 읽지 않을 때가 있다. 빈 쪽을 거쳐 간다.
  await send('Page.navigate', { url: 'about:blank' });
  await send('Page.navigate', { url });
  let state = { canvas: false, overlay: null, loading: false };
  for (let i = 0; i < 180; i += 1) {
    await sleep(500);
    state = await evaluate(`({
      canvas: document.readyState === 'complete' && document.querySelector('canvas') !== null,
      overlay: document.querySelector('vite-error-overlay')?.shadowRoot?.querySelector('.message')?.textContent ?? null,
      loading: document.querySelector('.stage[data-loading]') !== null,
    })`);
    if ((state?.canvas && !state.loading) || state?.overlay) break;
  }
  return state;
}

const BUTTONS = { left: 1, right: 2, middle: 4 };
const KEY_CODES = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Escape: 27, Enter: 13, Tab: 9 };
const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: 'none', ...extra });

async function press(x, y, clickCount) {
  await mouse('mousePressed', x, y, { button: 'left', buttons: 1, clickCount });
  await mouse('mouseReleased', x, y, { button: 'left', clickCount });
}

/** 단계 하나를 실행한다. eval 단계의 결과는 results에 넣는다. */
async function runStep(step, results) {
  if ('wait' in step) {
    await sleep(step.wait);
  } else if ('ready' in step) {
    for (let i = 0; i < 180; i += 1) {
      if (!(await evaluate(`document.querySelector('.stage[data-loading]') !== null`))) break;
      await sleep(500);
    }
  } else if ('move' in step) {
    await mouse('mouseMoved', step.move[0], step.move[1]);
  } else if ('drag' in step) {
    const [x1, y1, x2, y2] = step.drag;
    const button = step.button ?? 'left';
    const buttons = BUTTONS[button];
    const count = step.steps ?? 12;
    await mouse('mouseMoved', x1, y1);
    await mouse('mousePressed', x1, y1, { button, buttons, clickCount: 1 });
    for (let i = 1; i <= count; i += 1) {
      await mouse('mouseMoved', x1 + ((x2 - x1) * i) / count, y1 + ((y2 - y1) * i) / count, { button, buttons });
      await sleep(16);
    }
    await mouse('mouseReleased', x2, y2, { button, clickCount: 1 });
  } else if ('click' in step) {
    await mouse('mouseMoved', step.click[0], step.click[1]);
    await press(step.click[0], step.click[1], 1);
  } else if ('dblclick' in step) {
    await mouse('mouseMoved', step.dblclick[0], step.dblclick[1]);
    await press(step.dblclick[0], step.dblclick[1], 1);
    await press(step.dblclick[0], step.dblclick[1], 2);
  } else if ('wheel' in step) {
    await mouse('mouseMoved', step.wheel[0], step.wheel[1]);
    await mouse('mouseWheel', step.wheel[0], step.wheel[1], { deltaX: 0, deltaY: step.wheel[2] });
  } else if ('key' in step) {
    const code = KEY_CODES[step.key] ?? step.key.toUpperCase().charCodeAt(0);
    // code는 키 자리다. 글자 키는 KeyW, 숫자 키는 Digit1, 그 밖은 key와 같다. step.code로 직접 줄 수 있다(한글 입력 상태 흉내: key "ㅈ", code "KeyW").
    const physical = step.code ?? (/^[a-z]$/i.test(step.key) ? `Key${step.key.toUpperCase()}` : /^\d$/.test(step.key) ? `Digit${step.key}` : step.key);
    const params = { key: step.key, code: physical, windowsVirtualKeyCode: code, modifiers: step.shift ? 8 : 0 };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...params });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  } else if ('eval' in step) {
    const r = await send('Runtime.evaluate', { expression: step.eval, returnByValue: true, awaitPromise: true });
    results.push(r.exceptionDetails ? { error: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text } : r.result.value);
  } else if ('shot' in step) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(step.shot, Buffer.from(shot.data, 'base64'));
  } else {
    throw new Error('모르는 단계: ' + JSON.stringify(step));
  }
}

if (cmd === 'snap') {
  const [width, height] = (arg3 ?? '1600x1000').split('x').map(Number);
  const settle = Number(arg4) || 4000;
  const url = arg.startsWith('http') ? arg : `${BASE}?${arg}`;
  await lock();
  try {
    const state = await open(url, width, height);
    await sleep(settle);
    const overlay = await evaluate(`document.querySelector('vite-error-overlay')?.shadowRoot?.querySelector('.message')?.textContent ?? null`);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(arg2, Buffer.from(shot.data, 'base64'));
    // overlay가 있으면 어느 파일의 문법 오류다. 화면은 믿을 수 없다. errors는 페이지의 콘솔 오류다.
    console.log(JSON.stringify({ saved: arg2, url, size: [width, height], canvas: state?.canvas ?? false, overlay, errors: errors.slice(0, 8) }));
  } finally {
    rmdirSync(LOCK);
  }
} else if (cmd === 'act') {
  const [width, height] = (arg3 ?? '1600x1000').split('x').map(Number);
  const url = arg === '-' ? null : arg.startsWith('http') ? arg : `${BASE}?${arg}`;
  const steps = JSON.parse(arg2.trimStart().startsWith('[') ? arg2 : readFileSync(arg2, 'utf8'));
  const results = [];
  await lock();
  try {
    const state = await open(url, width, height);
    if (state?.overlay) throw new Error('vite 오류 화면: ' + state.overlay);
    for (const step of steps) await runStep(step, results);
    console.log(JSON.stringify({ url, size: [width, height], results, errors: errors.slice(0, 8) }));
  } finally {
    rmdirSync(LOCK);
  }
} else if (cmd === 'eval') {
  const r = await send('Runtime.evaluate', { expression: arg, returnByValue: true, awaitPromise: true });
  console.log(JSON.stringify(r.exceptionDetails ? { error: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text } : r.result.value));
} else if (cmd === 'shot') {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(arg, Buffer.from(r.data, 'base64'));
  console.log('saved ' + arg);
} else if (cmd === 'nav') {
  await send('Page.navigate', { url: arg });
  console.log('navigated');
} else if (cmd === 'console') {
  await send('Runtime.enable');
  await new Promise((resolve) => setTimeout(resolve, 5000));
} else {
  console.log('unknown command');
}
ws.close();
