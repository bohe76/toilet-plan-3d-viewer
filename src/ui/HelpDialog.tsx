import { useEffect, useRef, useState } from 'react';

/** 「다시 보지 않기」 저장 키. 값 '1'이면 처음 접속 때 띄우지 않는다. 검사 도구(work/tools/cdp.mjs)의 HELP_KEY와 같아야 한다. */
const HELP_KEY = 'toilet-plan-3d-viewer.help.v1';

/** 저장소를 못 쓰면(사생활 보호 창, 막힌 사이트 데이터) 저장하지 않은 것으로 본다. 그러면 매번 뜬다. */
export function readHelpHidden(): boolean {
  try {
    return localStorage.getItem(HELP_KEY) === '1';
  } catch {
    return false;
  }
}

function writeHelpHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(HELP_KEY, '1');
    else localStorage.removeItem(HELP_KEY);
  } catch {
    // 저장하지 못했다. 다음 접속에도 뜬다.
  }
}

const ROWS: [string, string, string, string][] = [
  ['왼쪽 드래그', '이동', '회전', '둘러보기'],
  ['오른쪽 드래그', '이동', '이동', '–'],
  ['휠', '확대·축소', '확대·축소', '앞뒤 이동'],
  ['클릭', '품목 선택', '품목 선택', '품목 선택'],
  ['더블클릭', '품목: 초점 이동 · 바닥: 맞춤', '품목: 초점 이동 · 바닥: 맞춤', '그 지점으로 이동'],
];

/**
 * 조작법 창. 네이티브 dialog의 showModal()이 초점 가두기, Esc, 바깥 비활성을 맡는다.
 * 닫는 방법(닫기, Esc, 바깥 클릭)은 모두 dialog의 close 이벤트로 모인다. 그때 「다시 보지 않기」를 저장한다.
 */
export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  // 체크의 처음 값은 열 때마다 아래 effect가 저장값으로 덮어쓴다.
  const [hidden, setHidden] = useState(false);
  // 막 위에서 눌렀는지. 창 안에서 누르고 막 위에서 떼면(글자를 끌어 선택하다가) click의 대상이 dialog가 되어도 닫지 않는다.
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    // 부모가 open을 false로 바꾸면 닫는다. 저장은 close 이벤트에서 한다.
    if (!open) {
      if (el.open) el.close();
      return;
    }
    if (el.open) return;
    // 열 때마다 체크는 저장값을 따른다.
    setHidden(readHelpHidden());
    el.showModal();
    closeButton.current?.focus();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="help"
      aria-labelledby="help-title"
      onClose={() => {
        writeHelpHidden(hidden);
        onClose();
      }}
      // 막(::backdrop)을 누르면 dialog 자체가 대상이다. 막 위에서 누르고 막 위에서 뗐을 때만 닫는다.
      // click의 대상은 누른 곳과 뗀 곳의 공통 조상이라, 뗀 곳은 좌표가 창 밖인지로 본다(dialog의 여백이 0이다).
      onPointerDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const releasedOutside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (pressedOnBackdrop.current && releasedOutside) e.currentTarget.close();
        pressedOnBackdrop.current = false;
      }}
    >
      <div className="help-body">
        <h2 id="help-title">조작법</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">입력</th>
              <th scope="col">평면</th>
              <th scope="col">아이소</th>
              <th scope="col">눈높이</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([input, ...actions]) => (
              <tr key={input}>
                <th scope="row">{input}</th>
                {actions.map((action, i) => (
                  <td key={i}>{action}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="help-keys">화살표: 이동 (Shift: 빠르게) · 1~8: 탭 · F: 맞춤 · Esc: 선택 해제</p>
        <div className="help-foot">
          <label className="help-check">
            <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
            다시 보지 않기
          </label>
          <button ref={closeButton} onClick={() => dialog.current?.close()}>
            닫기
          </button>
        </div>
      </div>
    </dialog>
  );
}
