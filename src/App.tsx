import { useCallback, useEffect, useRef, useState } from 'react';
import { sheets } from './data/sheets';
import type { LayerId } from './data/types';
import { Viewport, type ViewMode } from './scene/Viewport';
import { ItemInfo, SheetInfo } from './ui/InfoPanel';
import { LAYERS } from './ui/labels';

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'top', label: '평면' },
  { id: 'iso', label: '아이소' },
  { id: 'eye', label: '눈높이' },
];

const BUILDINGS = ['강의동', '연구동'] as const;
const DEFAULT_CEILING = 2550;
/** 아이소·평면 뷰의 기본 절단 높이. 벽에 가린 내부가 보이는 높이다. */
const DEFAULT_CUT = 1200;
const PILOT_ID = 'research-3f';

// URL 인자로 처음 상태를 정한다. 예: ?sheet=research-3f&view=top&cut=1200&dim=1
const params = new URLSearchParams(window.location.search);
const initialSheet = sheets.find((s) => s.id === (params.get('sheet') ?? PILOT_ID)) ?? sheets[0];
const paramView = params.get('view');
const initialView: ViewMode = !initialSheet.model || paramView === 'top' ? 'top' : paramView === 'eye' ? 'eye' : 'iso';
const initialCut = Number(params.get('cut')) || DEFAULT_CUT;

export function App() {
  const [activeId, setActiveId] = useState(initialSheet.id);
  const [view, setView] = useState<ViewMode>(initialView);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    wall: true, partition: true, door: true, fixture: true, accessory: true, light: true, dim: params.get('dim') === '1',
  });
  const [underlayVisible, setUnderlayVisible] = useState(true);
  const [underlayOpacity, setUnderlayOpacity] = useState(0.9);
  const [cutHeight, setCutHeight] = useState(initialCut);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitTick, setFitTick] = useState(0);
  const [originalOpen, setOriginalOpen] = useState(false);
  const [originalZoom, setOriginalZoom] = useState(1);
  const cursorText = useRef<HTMLSpanElement>(null);

  const sheet = sheets.find((s) => s.id === activeId) ?? sheets[0];
  const ceiling = sheet.model?.ceilingHeight ?? DEFAULT_CEILING;
  const selected = sheet.model?.items.find((item) => item.id === selectedId) ?? null;
  // 눈높이 뷰는 실내에서 보는 뷰다. 절단하지 않는다.
  const effectiveCut = view === 'eye' ? ceiling : Math.min(cutHeight, ceiling);

  const selectSheet = useCallback((id: string) => {
    const next = sheets.find((s) => s.id === id);
    if (!next) return;
    setActiveId(id);
    setSelectedId(null);
    setCutHeight(DEFAULT_CUT);
    setView((prev) => (next.model ? prev : 'top'));
  }, []);

  const fit = useCallback(() => setFitTick((t) => t + 1), []);

  const showCursor = useCallback((x: number, y: number) => {
    if (cursorText.current) {
      cursorText.current.textContent = `X ${Math.round(x).toLocaleString('en-US')} · Y ${Math.round(y).toLocaleString('en-US')} mm`;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key >= '1' && e.key <= '8') selectSheet(sheets[Number(e.key) - 1].id);
      else if (e.key === 'f' || e.key === 'F') fit();
      else if (e.key === 'Escape') {
        setOriginalOpen(false);
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectSheet, fit]);

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
                  className={`tab${s.id === activeId ? ' active' : ''}${s.model ? '' : ' pending'}`}
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
        <h3>레이어</h3>
        {LAYERS.map((layer) => (
          <label key={layer.id} className="check">
            <input
              type="checkbox"
              checked={layers[layer.id]}
              disabled={!sheet.model}
              onChange={(e) => setLayers((prev) => ({ ...prev, [layer.id]: e.target.checked }))}
            />
            {layer.label}
          </label>
        ))}
        <label className="check">
          <input type="checkbox" checked={underlayVisible} onChange={(e) => setUnderlayVisible(e.target.checked)} />
          바닥 도면
        </label>

        <h3>바닥 도면 불투명도</h3>
        <input
          type="range" min={0} max={1} step={0.05} value={underlayOpacity}
          onChange={(e) => setUnderlayOpacity(Number(e.target.value))}
        />
        <span className="value">{Math.round(underlayOpacity * 100)}%</span>

        <h3>절단 높이</h3>
        <input
          type="range" min={300} max={ceiling} step={50} value={effectiveCut} disabled={!sheet.model || view === 'eye'}
          onChange={(e) => setCutHeight(Number(e.target.value))}
        />
        <span className="value">{effectiveCut.toLocaleString('en-US')} mm</span>
      </aside>

      <main className="stage">
        <Viewport
          sheet={sheet}
          view={view}
          layers={layers}
          underlayVisible={underlayVisible}
          underlayOpacity={underlayOpacity}
          cutHeight={effectiveCut}
          selectedId={selectedId}
          fitTick={fitTick}
          onSelect={setSelectedId}
          onCursor={showCursor}
          onFit={fit}
        />
        <div className="toolbar">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={v.id === view ? 'active' : ''}
              disabled={v.id === 'eye' && !sheet.model}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
          <button onClick={fit}>맞춤</button>
        </div>
      </main>

      <aside className="panel right">
        {selected ? <ItemInfo item={selected} /> : <SheetInfo sheet={sheet} />}
        <h3>원본 도면</h3>
        <button className="thumb" onClick={() => setOriginalOpen(true)} title="원본 도면 보기">
          <img src={sheet.image} alt={sheet.title} />
        </button>
      </aside>

      <footer className="status">
        <span>{sheet.title}</span>
        <span>축척 1/50 (A3)</span>
        <span ref={cursorText}>X – · Y – mm</span>
        <span className="hint">
          {view === 'top' ? '왼쪽 드래그: 이동' : '왼쪽 드래그: 회전 · 오른쪽 드래그: 이동'} · 휠: 확대 · 클릭: 선택 · 더블클릭: 초점 · 1~8: 탭 · F: 맞춤
        </span>
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
    </div>
  );
}
