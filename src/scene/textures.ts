// 실사 모드의 질감. 외부 이미지를 받지 않고 캔버스에 그려서 만든다.
// 색과 무늬는 도면에 없다. 호텔 화장실 느낌(따뜻한 베이지·그레이지 타일, 짙은 우드)에 맞춘 작성자 제안이다.
import * as THREE from 'three';

type RGB = [number, number, number];

const SIZE = 1024;

/** 같은 씨앗이면 같은 무늬가 나오는 난수 */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w = SIZE, h = SIZE): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')!];
}

const rgb = (c: RGB, k = 1, a = 1) => `rgba(${Math.round(c[0] * k)}, ${Math.round(c[1] * k)}, ${Math.round(c[2] * k)}, ${a})`;
const gray = (v: number) => rgb([255, 255, 255], v);

/** period는 질감 한 장이 덮는 실제 크기(m)다. origin은 무늬가 시작하는 장면 좌표(m)다. */
function toTexture(canvas: HTMLCanvasElement, period: [number, number], color: boolean, origin: [number, number] = [0, 0]): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / period[0], 1 / period[1]);
  t.offset.set(-origin[0] / period[0], -origin[1] / period[1]);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface SurfaceMaps {
  map: THREE.Texture;
  roughnessMap?: THREE.Texture;
}

interface TileOptions {
  /** 타일 한 장의 크기 mm */
  tile: number;
  /** 질감 한 장에 들어가는 타일 수(가로와 세로 각각) */
  count: number;
  base: RGB;
  /** 타일마다 밝기가 달라지는 폭 */
  vary: number;
  /** 구름 무늬의 세기 */
  cloud: number;
  /** 타일 한 장의 결(선) 수 */
  veins: number;
  grout: RGB;
  groutMm: number;
  /** 타일 면의 거칠기 0~1 */
  rough: number;
  seed: number;
  /** 줄눈이 지나는 장면 좌표(m) */
  origin?: [number, number];
}

function tileMaps(o: TileOptions): SurfaceMaps {
  const rand = seeded(o.seed);
  const [canvas, ctx] = makeCanvas();
  const [roughCanvas, rctx] = makeCanvas();
  const cell = SIZE / o.count;
  for (let i = 0; i < o.count; i++) {
    for (let j = 0; j < o.count; j++) {
      const x = i * cell;
      const y = j * cell;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cell, cell);
      ctx.clip();
      ctx.fillStyle = rgb(o.base, 1 + (rand() - 0.5) * 2 * o.vary);
      ctx.fillRect(x, y, cell, cell);
      for (let k = 0; k < 7; k++) {
        const cx = x + rand() * cell;
        const cy = y + rand() * cell;
        const r = cell * (0.25 + rand() * 0.6);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const tone = rand() < 0.5 ? '255, 255, 255' : '60, 50, 40';
        g.addColorStop(0, `rgba(${tone}, ${o.cloud * (0.4 + rand() * 0.6)})`);
        g.addColorStop(1, `rgba(${tone}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x, y, cell, cell);
      }
      for (let k = 0; k < o.veins; k++) {
        ctx.beginPath();
        let px = x + rand() * cell;
        let py = y;
        ctx.moveTo(px, py);
        while (py < y + cell) {
          px += (rand() - 0.5) * cell * 0.1;
          py += cell * (0.06 + rand() * 0.12);
          ctx.lineTo(px, py);
        }
        ctx.strokeStyle = rand() < 0.6 ? `rgba(255, 255, 255, ${0.05 + rand() * 0.08})` : `rgba(70, 60, 50, ${0.03 + rand() * 0.05})`;
        ctx.lineWidth = 0.6 + rand() * 1.4;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  rctx.fillStyle = gray(o.rough);
  rctx.fillRect(0, 0, SIZE, SIZE);
  // 줄눈. 가장자리 선은 반씩 걸쳐서 반복할 때 이어진다.
  const groutPx = Math.max(2, (o.groutMm / o.tile) * cell);
  for (const [c, style] of [[ctx, rgb(o.grout)], [rctx, gray(0.92)]] as const) {
    c.strokeStyle = style;
    c.lineWidth = groutPx;
    for (let i = 0; i <= o.count; i++) {
      c.beginPath();
      c.moveTo(i * cell, 0);
      c.lineTo(i * cell, SIZE);
      c.moveTo(0, i * cell);
      c.lineTo(SIZE, i * cell);
      c.stroke();
    }
  }
  const period = (o.tile * o.count) / 1000;
  return {
    map: toTexture(canvas, [period, period], true, o.origin),
    roughnessMap: toTexture(roughCanvas, [period, period], false, o.origin),
  };
}

function woodMaps(): SurfaceMaps {
  const rand = seeded(11);
  const w = 512;
  const [canvas, ctx] = makeCanvas(w, SIZE);
  const base: RGB = [66, 46, 34];
  ctx.fillStyle = rgb(base);
  ctx.fillRect(0, 0, w, SIZE);
  // 넓은 띠로 판재의 색 차이를 만든다.
  for (let x = 0; x < w; ) {
    const band = 30 + rand() * 90;
    ctx.fillStyle = rgb(base, 0.88 + rand() * 0.24, 0.5);
    ctx.fillRect(x, 0, band, SIZE);
    x += band;
  }
  // 세로 나뭇결
  for (let k = 0; k < 420; k++) {
    let x = rand() * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= SIZE; y += 32) {
      x += (rand() - 0.5) * 2.4;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rand() < 0.6 ? `rgba(30, 18, 10, ${0.06 + rand() * 0.16})` : `rgba(128, 98, 70, ${0.04 + rand() * 0.09})`;
    ctx.lineWidth = 0.5 + rand() * 2.2;
    ctx.stroke();
  }
  return { map: toTexture(canvas, [0.6, 2.4], true) };
}

function marbleMaps(): SurfaceMaps {
  const rand = seeded(23);
  const [canvas, ctx] = makeCanvas();
  ctx.fillStyle = 'rgb(241, 238, 232)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  // 반복할 때 이어지도록 같은 무늬를 9번(3 x 3) 그린다.
  const tiled = (draw: (dx: number, dy: number) => void) => {
    for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) draw(dx, dy);
  };
  for (let k = 0; k < 16; k++) {
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const r = SIZE * (0.12 + rand() * 0.28);
    const alpha = 0.05 + rand() * 0.07;
    tiled((dx, dy) => {
      const g = ctx.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, r);
      g.addColorStop(0, `rgba(150, 142, 130, ${alpha})`);
      g.addColorStop(1, 'rgba(150, 142, 130, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SIZE, SIZE);
    });
  }
  for (let k = 0; k < 26; k++) {
    const pts: [number, number][] = [[rand() * SIZE, rand() * SIZE]];
    const angle = rand() * Math.PI * 2;
    for (let i = 0; i < 9; i++) {
      const [x, y] = pts[pts.length - 1];
      const a = angle + (rand() - 0.5) * 1.3;
      const step = 40 + rand() * 70;
      pts.push([x + Math.cos(a) * step, y + Math.sin(a) * step]);
    }
    const alpha = 0.1 + rand() * 0.28;
    const width = 0.6 + rand() * 2.4;
    tiled((dx, dy) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x + dx, y + dy) : ctx.lineTo(x + dx, y + dy)));
      ctx.strokeStyle = `rgba(120, 112, 100, ${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();
    });
  }
  return { map: toTexture(canvas, [1.6, 1.6], true) };
}

function graniteMaps(): SurfaceMaps {
  const rand = seeded(37);
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = 'rgb(86, 82, 78)';
  ctx.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 9000; k++) {
    const v = rand();
    ctx.fillStyle = v < 0.45 ? `rgba(30, 28, 26, ${0.3 + rand() * 0.5})` : `rgba(190, 184, 176, ${0.2 + rand() * 0.5})`;
    ctx.fillRect(rand() * 512, rand() * 512, 1 + rand() * 2.2, 1 + rand() * 2.2);
  }
  return { map: toTexture(canvas, [0.5, 0.5], true) };
}

/** 금속재 흡음천장 (AL. 600각). 패널 줄눈과 타공 무늬 */
function ceilingMaps(): SurfaceMaps {
  const [canvas, ctx] = makeCanvas();
  ctx.fillStyle = 'rgb(243, 242, 238)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const cell = SIZE / 2;
  ctx.fillStyle = 'rgba(150, 148, 142, 0.5)';
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let x = 40; x < cell - 30; x += 16) {
        for (let y = 40; y < cell - 30; y += 16) {
          ctx.beginPath();
          ctx.arc(i * cell + x, j * cell + y, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  ctx.strokeStyle = 'rgb(176, 174, 168)';
  ctx.lineWidth = 5;
  for (let i = 0; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, SIZE);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(SIZE, i * cell);
    ctx.stroke();
  }
  return { map: toTexture(canvas, [1.2, 1.2], true) };
}

type SurfaceId = 'floorTile' | 'wallTile' | 'smallTile' | 'wainscotTile' | 'wood' | 'marble' | 'granite' | 'ceiling';

const BUILDERS: Record<SurfaceId, () => SurfaceMaps> = {
  // 바닥 포세린타일 600 x 600. 줄눈 시작점은 탭마다 다르다. setTileOrigin 이 맞춘다.
  floorTile: () =>
    tileMaps({ tile: 600, count: 4, base: [150, 142, 130], vary: 0.025, cloud: 0.09, veins: 2, grout: [108, 102, 93], groutMm: 3, rough: 0.34, seed: 3 }),
  // 벽 포세린타일 600 x 600
  wallTile: () =>
    tileMaps({ tile: 600, count: 4, base: [222, 213, 198], vary: 0.012, cloud: 0.07, veins: 2, grout: [192, 184, 170], groutMm: 2.5, rough: 0.3, seed: 5 }),
  // 수채기실 바닥 자기질 타일 200 x 200
  smallTile: () =>
    tileMaps({ tile: 200, count: 4, base: [140, 134, 124], vary: 0.05, cloud: 0.05, veins: 0, grout: [98, 93, 86], groutMm: 4, rough: 0.7, seed: 7 }),
  // 수채기실 벽 도기질 타일
  wainscotTile: () =>
    tileMaps({ tile: 200, count: 4, base: [232, 229, 221], vary: 0.015, cloud: 0.03, veins: 0, grout: [196, 192, 184], groutMm: 3, rough: 0.22, seed: 9 }),
  wood: woodMaps,
  marble: marbleMaps,
  granite: graniteMaps,
  ceiling: ceilingMaps,
};

const cache = new Map<SurfaceId, SurfaceMaps>();

export function surfaceMaps(id: SurfaceId): SurfaceMaps {
  let maps = cache.get(id);
  if (!maps) {
    maps = BUILDERS[id]();
    cache.set(id, maps);
  }
  return maps;
}

/**
 * 바닥 타일의 줄눈 시작점을 맞춘다. originMm은 도면의 타일 나누기 선 교점 [x, y] mm다.
 * 질감은 모든 탭이 함께 쓴다. 화면에는 탭이 1개만 나오므로 탭을 바꿀 때 시작점만 다시 맞춘다.
 */
export function setTileOrigin(id: 'floorTile' | 'smallTile', originMm: [number, number] = [0, 0]): void {
  const { map, roughnessMap } = surfaceMaps(id);
  for (const t of [map, roughnessMap]) {
    t?.offset.set((-originMm[0] / 1000) * t.repeat.x, (-originMm[1] / 1000) * t.repeat.y);
  }
}
