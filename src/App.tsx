import { useCallback, useEffect, useRef, useState } from 'react';
import { sheets } from './data/sheets';
import type { LayerId } from './data/types';
import type { PathTraceStatus } from './scene/PathTracer';
import { Viewport, type PanRequest, type RenderMode, type ViewMode } from './scene/Viewport';
import { HelpDialog, readHelpHidden } from './ui/HelpDialog';
import { EyeToggle } from './ui/EyeToggle';
import { ItemInfo, SheetInfo } from './ui/InfoPanel';
import { LAYERS } from './ui/labels';

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'top', label: '평면' },
  { id: 'iso', label: '아이소' },
  { id: 'eye', label: '눈높이' },
];

const MODES: { id: RenderMode; label: string; title: string }[] = [
  { id: 'real', label: '실사', title: '재질 · 조명 · 그림자 적용' },
  { id: 'plan', label: '도면', title: '스캔 도면 위에 모델 겹쳐 보기' },
];

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

const BUILDINGS = ['강의동', '연구동'] as const;
const DEFAULT_CEILING = 2550;
/** 화면이 멈춘 뒤 고품질 렌더를 시작할 때까지 기다리는 시간(ms) */
const HQ_DELAY_MS = 1500;
/** 로딩 스피너를 지우는 시간 제한(ms). 스캔 도면 이미지를 받지 못해도 스피너가 남지 않게 한다. */
const LOADING_TIMEOUT_MS = 30000;

// URL 인자로 처음 상태를 정한다. 예: ?sheet=research-3f&view=top&cut=1200&dim=1&mode=plan&added=0&hq=1
// sheet 인자가 없으면 첫 탭(강의동 2F 여)으로 시작한다(보헤님 지시, 2026-11-22).
// 처음 화면은 실사 모드다(보헤님 지시, 2026-11-21). mode=plan 은 도면 모드로 시작한다. 모델이 없는 탭은 도면 모드만 쓴다.
// hq=1 은 고품질 렌더 스위치를 켠 채로 시작한다.
// added 인자가 없으면 상식 보완 품목은 실사 모드에서만 보인다. added=0 은 두 모드 모두 숨기고, added=1 은 두 모드 모두 보인다.
const params = new URLSearchParams(window.location.search);
const initialSheet = sheets.find((s) => s.id === params.get('sheet')) ?? sheets[0];
const paramView = params.get('view');
const initialView: ViewMode = !initialSheet.model || paramView === 'top' ? 'top' : paramView === 'eye' ? 'eye' : 'iso';
// 절단 높이의 기본은 탭의 천장고(슬라이더의 최대값)다(보헤님 결정, 2026-11-22). Infinity는 effectiveCut에서 천장고가 된다.
const initialCut = Number(params.get('cut')) || Infinity;
const paramAdded = params.get('added');
// 도면 모드는 스캔 도면과 대조하는 화면이다. 도면에 없는 품목은 기본으로 숨긴다.
const initialAdded: Record<RenderMode, boolean> = {
  plan: paramAdded === '1',
  real: paramAdded !== '0',
};

export function App() {
  /** 장면에 그리는 탭 */
  const [activeId, setActiveId] = useState(initialSheet.id);
  /** 강조하는 탭. 누르면 바로 바뀐다. 장면(activeId)은 스피너를 그린 뒤에 바뀐다. */
  const [tabId, setTabId] = useState(initialSheet.id);
  /** 장면 전환 번호. 전환을 장면에 반영할 때 바뀐다. Viewport가 이 번호의 첫 화면을 그리면 onReady로 알린다. */
  const [sceneTick, setSceneTick] = useState(0);
  /** 첫 화면을 기다리는 장면 전환 번호. null이 아니면 로딩 스피너를 보인다. 처음 접속할 때도 보인다. */
  const [waitTick, setWaitTick] = useState<number | null>(0);
  const lastTick = useRef(0);
  /** 스피너를 그린 뒤에 반영할 전환. 두 프레임 안에 여러 번 누르면 차례로 모두 반영한다. 마지막에 누른 것이 이긴다. */
  const pendingSwitch = useRef<(() => void)[]>([]);
  const switchFrame = useRef(0);
  const [softwareGl, setSoftwareGl] = useState(false);
  const [view, setView] = useState<ViewMode>(initialView);
  const [mode, setMode] = useState<RenderMode>(params.get('mode') === 'plan' ? 'plan' : 'real');
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    wall: true, partition: true, door: true, fixture: true, accessory: true, light: true, finish: true, dim: params.get('dim') === '1',
  });
  const [addedByMode, setAddedByMode] = useState(initialAdded);
  const [underlayVisible, setUnderlayVisible] = useState(true);
  const [underlayOpacity, setUnderlayOpacity] = useState(0.9);
  const [cutHeight, setCutHeight] = useState(initialCut);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitTick, setFitTick] = useState(0);
  const [pan, setPan] = useState<PanRequest | null>(null);
  const [trace, setTrace] = useState<PathTraceStatus | null>(null);
  /** 고품질 렌더 스위치. 켜져 있으면 실사 모드의 화면이 멈춘 뒤에 경로 추적을 자동으로 시작한다. 기본은 꺼짐이다(보헤님 지시, 2026-11-21). */
  const [hq, setHq] = useState(params.get('hq') === '1');
  const [dragging, setDragging] = useState(false);
  /** 화면 구성이나 시점이 바뀐 횟수. 바뀔 때마다 고품질 렌더의 시작 대기를 처음부터 다시 센다. */
  const [activity, setActivity] = useState(0);
  const [originalOpen, setOriginalOpen] = useState(false);
  /** 조작법 창. 「다시 보지 않기」를 저장하지 않았으면 처음 접속 때 띄운다. */
  const [helpOpen, setHelpOpen] = useState(() => !readHelpHidden());
  const [originalZoom, setOriginalZoom] = useState(1);
  const cursorText = useRef<HTMLSpanElement>(null);

  const sheet = sheets.find((s) => s.id === activeId) ?? sheets[0];
  const real = mode === 'real' && sheet.model !== undefined;
  const tracing = real && trace !== null;
  const slowGl = softwareGl && real && hq;
  const showAdded = addedByMode[real ? 'real' : 'plan'];
  const ceiling = sheet.model?.ceilingHeight ?? DEFAULT_CEILING;
  const selected = sheet.model?.items.find((item) => item.id === selectedId) ?? null;
  // 눈높이 뷰는 실내에서 보는 뷰다. 절단하지 않는다.
  const effectiveCut = view === 'eye' ? ceiling : Math.min(cutHeight, ceiling);

  // 고품질 렌더는 정지 화면이다. 화면 구성이나 시점을 바꾸면 끝낸다. 스위치가 켜져 있으면 잠시 뒤에 새 화면으로 다시 시작한다.
  const stopTrace = useCallback(() => {
    setTrace(null);
    setActivity((n) => n + 1);
  }, []);

  const turnOffHq = useCallback(() => {
    setHq(false);
    setTrace(null);
  }, []);

  const onTrace = useCallback((status: PathTraceStatus) => {
    // 렌더를 끝낸 뒤에 늦게 온 진행 보고는 버린다. 받아 주면 끝낸 렌더가 되살아난다.
    setTrace((prev) => (prev === null && status.state !== 'preparing' ? prev : status));
    // 오류가 나면 스위치를 끈다. 켜 두면 화면을 움직일 때마다 같은 오류를 되풀이한다.
    if (status.state === 'error') setHq(false);
  }, []);

  /** 지금 고품질 렌더 중인지. 매 프레임 불리는 onCameraChange가 상태를 읽지 않고 확인하는 데 쓴다. */
  const tracingRef = useRef(false);
  useEffect(() => {
    tracingRef.current = trace !== null;
  }, [trace]);

  // 시점이나 캔버스 크기가 실제로 바뀌었을 때 불린다. 드래그하는 동안 매 프레임 불리므로 렌더 중일 때만 상태를 바꾼다.
  const onCameraChange = useCallback(() => {
    if (!tracingRef.current) return;
    tracingRef.current = false;
    stopTrace();
  }, [stopTrace]);

  const onDrag = useCallback((active: boolean) => {
    setDragging(active);
    // 손을 떼면 시작 대기를 다시 센다. 렌더는 건드리지 않는다. 움직임 없는 클릭이 완료된 렌더를 버리지 않게 한다.
    if (!active) setActivity((n) => n + 1);
  }, []);

  const select = useCallback(
    (id: string | null) => {
      // 품목을 선택한 동안에는 고품질 렌더를 쉰다. 선택 강조와 정보 패널을 보는 시간이다.
      if (id !== null) stopTrace();
      setSelectedId(id);
    },
    [stopTrace],
  );

  // 스위치가 켜져 있으면 화면이 멈추고 HQ_DELAY_MS 뒤에 고품질 렌더를 시작한다.
  // 평면 뷰, 품목을 선택한 동안, 원본 도면을 보는 동안, 시점을 움직이는 동안에는 시작하지 않는다.
  // 완료나 오류 상태에서는 다시 시작하지 않는다(trace가 남아 있다).
  // 로딩 스피너나 조작법 창이 떠 있는 동안에도 시작하지 않는다.
  const loading = waitTick !== null;
  const canTrace = real && hq && view !== 'top' && selectedId === null && !originalOpen && !helpOpen && !dragging && !loading;
  const idle = trace === null;
  useEffect(() => {
    if (!canTrace || !idle) return;
    const timer = window.setTimeout(() => setTrace({ state: 'preparing', samples: 0, target: 0, showAt: 0, seconds: 0 }), HQ_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [canTrace, idle, activity]);

  // 탭 전환과 모드 전환. 스피너를 먼저 그리고 그 다음 프레임에 장면을 바꾼다.
  // requestAnimationFrame 한 번은 그리기 전에 불린다. 두 번 겹쳐야 스피너가 그려진 뒤가 된다.
  const switchScene = useCallback((apply: () => void) => {
    const tick = ++lastTick.current;
    setWaitTick(tick);
    pendingSwitch.current.push(apply);
    if (switchFrame.current) return;
    switchFrame.current = requestAnimationFrame(() => {
      switchFrame.current = requestAnimationFrame(() => {
        switchFrame.current = 0;
        const applies = pendingSwitch.current;
        pendingSwitch.current = [];
        applies.forEach((run) => run());
        setSceneTick(lastTick.current);
      });
    });
  }, []);

  // 늦게 온 첫 화면 신호(앞선 전환의 것)는 버린다.
  const onReady = useCallback((tick: number) => setWaitTick((wait) => (wait === tick ? null : wait)), []);

  useEffect(() => {
    if (waitTick === null) return;
    const timer = window.setTimeout(() => setWaitTick((wait) => (wait === waitTick ? null : wait)), LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [waitTick]);

  const onSoftwareGl = useCallback(() => setSoftwareGl(true), []);

  const selectSheet = useCallback((id: string) => {
    const next = sheets.find((s) => s.id === id);
    if (!next) return;
    stopTrace();
    const apply = () => {
      // 탭이나 뷰를 바꾸면 카메라 조작기를 새로 만든다. 누르고 있던 드래그의 끝 신호가 오지 않는다.
      setDragging(false);
      setActiveId(id);
      setSelectedId(null);
      setCutHeight(Infinity);
      setView((prev) => (next.model ? prev : 'top'));
    };
    // 지금 탭을 다시 누르면 절단 높이와 선택만 초기화한다. 장면이 바뀌지 않으므로 스피너를 띄우지 않는다. 띄우면 지울 계기가 없다.
    // 다른 탭으로 바꾸는 중에 그 탭을 다시 누르면 아무것도 하지 않는다.
    if (id === tabId) {
      if (id === activeId) apply();
      return;
    }
    setTabId(id);
    switchScene(apply);
  }, [stopTrace, switchScene, tabId, activeId]);

  const fit = useCallback(() => {
    stopTrace();
    setFitTick((t) => t + 1);
  }, [stopTrace]);

  const move = useCallback(
    (dx: number, dy: number, fast: boolean) => {
      stopTrace();
      setPan((prev) => ({ dx, dy, fast, tick: (prev?.tick ?? 0) + 1 }));
    },
    [stopTrace],
  );

  const showCursor = useCallback((x: number, y: number) => {
    if (cursorText.current) {
      cursorText.current.textContent = `X ${Math.round(x).toLocaleString('en-US')} · Y ${Math.round(y).toLocaleString('en-US')} mm`;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Alt+←, Ctrl+F 같은 브라우저 단축키는 그대로 둔다.
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // 조작법 창이 떠 있으면 뷰어의 단축키를 쓰지 않는다. Esc는 창(dialog)이 받아서 창만 닫는다.
      if (helpOpen) return;
      const arrow = ARROWS[e.key];
      if (arrow) {
        // 원본 도면을 볼 때는 화면을 옮기지 않는다.
        // Tab 키로 슬라이더에 들어가 있으면 화살표는 슬라이더 값을 바꾼다.
        if (originalOpen) return;
        if (e.target instanceof HTMLInputElement && e.target.type === 'range') return;
        e.preventDefault();
        move(arrow[0], arrow[1], e.shiftKey);
      } else if (e.key >= '1' && e.key <= '8') {
        // 지금 탭의 번호를 누르면 아무것도 하지 않는다. 다시 고르면 절단 높이와 렌더가 초기화된다.
        const id = sheets[Number(e.key) - 1].id;
        if (id !== tabId) selectSheet(id);
      }
      else if (e.key === 'f' || e.key === 'F') fit();
      else if (e.key === 'Escape') {
        // 고품질 렌더 중의 Esc는 스위치를 끈다. 원본 도면이 열려 있으면 그것만 닫는다.
        if (tracing && !originalOpen) turnOffHq();
        setOriginalOpen(false);
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectSheet, fit, move, originalOpen, helpOpen, tracing, turnOffHq, tabId]);

  return (
    <div className="app">
      <header className="tabs">
        <strong className="brand">교육관 화장실</strong>
        {BUILDINGS.map((building) => (
          <div className="tab-group" key={building}>
            <span className="tab-group-name">{building}</span>
            {sheets
              .filter((s) => s.building === building)
              .map((s) => (
                <button
                  key={s.id}
                  className={`tab${s.id === tabId ? ' active' : ''}${s.model ? '' : ' pending'}`}
                  title={`${s.title} (단축키 ${s.page})`}
                  onClick={() => selectSheet(s.id)}
                >
                  {s.tab}
                </button>
              ))}
          </div>
        ))}
      </header>

      <aside className="panel left">
        <section className="card">
          <h3>표시 모드</h3>
          <div className="segmented">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={(real ? 'real' : 'plan') === m.id ? 'active' : ''}
                title={m.title}
                disabled={m.id === 'real' && !sheet.model}
                onClick={() => {
                  stopTrace();
                  const apply = () => {
                    // 모드마다 보이는 품목이 다르다. 숨는 품목이 선택된 채로 남지 않게 한다.
                    setSelectedId(null);
                    setMode(m.id);
                  };
                  // 보이는 모드가 그대로면(켜진 버튼, 모델 없는 탭) 장면이 바뀌지 않는다. 스피너를 띄우지 않는다.
                  if (m.id === (real ? 'real' : 'plan')) apply();
                  else switchScene(apply);
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>레이어</h3>
          {LAYERS.map((layer) => (
            <EyeToggle
              key={layer.id}
              checked={layers[layer.id]}
              // 마감은 실사 모드에서만, 치수는 도면 모드에서만 그린다.
              disabled={!sheet.model || (layer.id === 'finish' && !real) || (layer.id === 'dim' && real)}
              onChange={(e) => {
                stopTrace();
                setLayers((prev) => ({ ...prev, [layer.id]: e.target.checked }));
              }}
            >
              {layer.label}
            </EyeToggle>
          ))}
          <EyeToggle
            title="도면에 없지만 상식적으로 있어야 해서 넣은 품목 · 값은 모두 가정"
            checked={showAdded}
            disabled={!sheet.model}
            onChange={(e) => {
              stopTrace();
              setSelectedId(null);
              setAddedByMode((prev) => ({ ...prev, [real ? 'real' : 'plan']: e.target.checked }));
            }}
          >
            상식 보완 품목
          </EyeToggle>
          <EyeToggle checked={underlayVisible} disabled={real} onChange={(e) => setUnderlayVisible(e.target.checked)}>
            바닥 도면
          </EyeToggle>
        </section>

        <section className="card">
          <h3>바닥 도면 불투명도</h3>
          <input
            type="range" min={0} max={1} step={0.05} value={underlayOpacity} disabled={real}
            onChange={(e) => setUnderlayOpacity(Number(e.target.value))}
            onPointerUp={(e) => e.currentTarget.blur()}
          />
          <span className="value">{Math.round(underlayOpacity * 100)}%</span>
        </section>

        <section className="card">
          <h3>절단 높이</h3>
          <input
            type="range" min={300} max={ceiling} step={50} value={effectiveCut} disabled={!sheet.model || view === 'eye'}
            onChange={(e) => {
              stopTrace();
              setCutHeight(Number(e.target.value));
            }}
            onPointerUp={(e) => e.currentTarget.blur()}
          />
          <span className="value">{effectiveCut.toLocaleString('en-US')} mm</span>
        </section>
      </aside>

      {/* data-loading은 검사 도구(work/tools/cdp.mjs)가 로딩 끝을 기다리는 표시다. 지우면 도구가 깨진다. */}
      <main className="stage" data-loading={loading ? '' : undefined}>
        <Viewport
          sheet={sheet}
          view={view}
          mode={mode}
          layers={layers}
          showAdded={showAdded}
          underlayVisible={underlayVisible}
          underlayOpacity={underlayOpacity}
          cutHeight={effectiveCut}
          selectedId={selectedId}
          fitTick={fitTick}
          pan={pan}
          pathTrace={tracing}
          onPathTrace={onTrace}
          onInterrupt={onCameraChange}
          onDrag={onDrag}
          onSelect={select}
          onCursor={showCursor}
          onFit={fit}
          onMove={move}
          sceneTick={sceneTick}
          onReady={onReady}
          onSoftwareGl={onSoftwareGl}
        />
        <div className="toolbar">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={v.id === view ? 'active' : ''}
              disabled={v.id === 'eye' && !sheet.model}
              onClick={() => {
                stopTrace();
                setDragging(false);
                setView(v.id);
              }}
            >
              {v.label}
            </button>
          ))}
          <button onClick={fit}>맞춤</button>
          {real && (
            <button
              className={hq ? 'active' : ''}
              aria-pressed={hq}
              title="화면이 멈추면 경로 추적으로 다듬은 화면 생성 · 시점을 바꾸면 처음부터 · 평면 뷰와 품목 선택 중에는 쉼"
              onClick={() => {
                setHq(!hq);
                stopTrace();
              }}
            >
              고품질 렌더 {hq ? '켜짐' : '꺼짐'}
            </button>
          )}
          <button
            onClick={() => {
              // 조작법 창이 화면을 덮는 동안에는 고품질 렌더를 돌리지 않는다.
              stopTrace();
              setHelpOpen(true);
            }}
          >
            조작법
          </button>
        </div>
        {/* 소프트웨어 렌더링이면 고품질 렌더 스위치가 켜져 있는 동안 진행 막대 자리에 안내를 둔다. 렌더는 막지 않는다. */}
        {((tracing && trace) || slowGl) && (
          <div className={`trace-bar${slowGl ? ' wrap' : ''}`}>
            {slowGl && <span>브라우저의 그래픽 가속 꺼짐 · 고품질 렌더가 매우 느림 (Chrome 설정 → 시스템 → 그래픽 가속 사용)</span>}
            {tracing && trace && (
              <>
                {trace.state === 'error' ? (
                  <span>고품질 렌더 중단 · 스위치 꺼짐: {trace.message}</span>
                ) : trace.state === 'preparing' ? (
                  <span>고품질 렌더 준비 중…</span>
                ) : trace.state === 'compiling' ? (
                  <span>고품질 렌더 셰이더 준비 중 · {Math.round(trace.seconds)}초 (첫 실행은 몇 분 소요)</span>
                ) : trace.samples < trace.showAt ? (
                  <span>
                    고품질 렌더 계산 중 · 표본 {trace.samples} / {trace.showAt} · {Math.round(trace.seconds)}초 · {trace.showAt}개 모이면 화면 전환
                  </span>
                ) : (
                  <span>
                    고품질 렌더 {trace.state === 'done' ? '완료' : '진행 중'} · 표본 {trace.samples} / {trace.target} · {Math.round(trace.seconds)}초
                  </span>
                )}
                <button onClick={turnOffHq}>{trace.state === 'error' ? '닫기' : '끄기 (Esc)'}</button>
              </>
            )}
          </div>
        )}
        {loading && (
          <div className="loading" role="status" aria-label="화면 구성 중">
            <div className="spinner" />
          </div>
        )}
        <div className="pan-pad" title="화면 이동 (화살표 키와 같음 · Shift: 빠르게)">
          <button className="up" onClick={(e) => move(0, 1, e.shiftKey)} aria-label="앞으로 이동">▲</button>
          <button className="left" onClick={(e) => move(-1, 0, e.shiftKey)} aria-label="왼쪽으로 이동">◀</button>
          <button className="right" onClick={(e) => move(1, 0, e.shiftKey)} aria-label="오른쪽으로 이동">▶</button>
          <button className="down" onClick={(e) => move(0, -1, e.shiftKey)} aria-label="뒤로 이동">▼</button>
        </div>
      </main>

      <aside className="panel right">
        <section className="card">{selected ? <ItemInfo item={selected} /> : <SheetInfo sheet={sheet} />}</section>
        <section className="card">
          <h3>원본 도면</h3>
          <button
            className="thumb"
            title="원본 도면 보기"
            onClick={() => {
              // 원본 도면이 화면을 덮는 동안에는 고품질 렌더를 돌리지 않는다.
              stopTrace();
              setOriginalOpen(true);
            }}
          >
            <img src={sheet.image} alt={sheet.title} />
            <span className="thumb-badge" aria-hidden="true">⤢ 크게 보기</span>
          </button>
        </section>
      </aside>

      <footer className="status">
        <span className="status-center">
          <span>{sheet.title}</span>
          <span>축척 1/50 (A3)</span>
        </span>
        <span className="status-cursor" ref={cursorText}>X – · Y – mm</span>
      </footer>

      {originalOpen && (
        <div className="original">
          <div className="original-bar">
            <strong>{sheet.title}</strong>
            <button onClick={() => setOriginalZoom((z) => Math.max(0.5, z - 0.5))}>−</button>
            <span>{Math.round(originalZoom * 100)}%</span>
            <button onClick={() => setOriginalZoom((z) => Math.min(4, z + 0.5))}>+</button>
            <button onClick={() => setOriginalOpen(false)}>닫기 (Esc)</button>
          </div>
          <div className="original-scroll">
            <img src={sheet.image} alt={sheet.title} style={{ width: `${originalZoom * 100}%` }} />
          </div>
        </div>
      )}

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
