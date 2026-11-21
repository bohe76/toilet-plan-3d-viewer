// 여러 탭이 함께 쓰는 상식 보완 부품이다. 도면에 없다. 위치, 크기, 높이는 모두 가정이다. 모든 품목에 added: true 가 붙는다.
// 좌표 틀(벽 틀, 문 틀)과 rot의 뜻은 parts.ts 머리 주석에 있다.
import { COUNTER, locate, place } from './parts';
import type { Rot } from './parts';
import { box, cyl, dim, rbox, tube } from './shape_helpers';
import type { DimValue, Item } from './types';

const A = 'assumed' as const;
/** 위치 치수. 가정값이다. */
export const at = (x: number, y: number): DimValue => dim('위치 (X, Y)', `${x.toLocaleString('en-US')}, ${y.toLocaleString('en-US')}`, A);

/** 천장 매입등. ch는 천장고다. shadow는 그림자를 만드는 등에만 준다(탭마다 2개 안쪽). */
export const downlight = (id: string, name: string, x: number, y: number, ch: number, shadow = false): Item => ({
  id, layer: 'light', name, added: true, lamp: { power: 1, shadow },
  remark: '전체 조명용 매입등이다. 도면에 없다. 위치와 수량은 가정이다.',
  shapes: [cyl(x, y, 65, ch - 8, ch)],
  dims: [at(x, y), dim('지름', 130, A)],
});

/** 천장 환기구 300 x 300 */
export const vent = (id: string, name: string, x: number, y: number, ch: number): Item => ({
  id, layer: 'accessory', name, added: true, material: 'white',
  shapes: [box(x - 150, y - 150, x + 150, y + 150, ch - 8, ch)],
  dims: [at(x, y), dim('크기', '300 x 300', A)],
});

// 아래 2개는 양변기와 같은 벽 틀을 쓴다. (x, y)와 rot은 그 칸의 toilet()에 준 값이다.
// side는 변기 중심선에서 옆 벽면(칸막이 면)까지의 거리다. 벽을 등지고 실내를 볼 때 오른쪽이 +, 왼쪽이 -다.

/** 휴지걸이. 옆 벽면에 단다. */
export const paperHolder = (key: string | number, x: number, y: number, rot: Rot, side: number): Item => {
  const out = side - 62 * Math.sign(side);
  return {
    id: `paper-holder-${key}`, layer: 'accessory', name: `휴지걸이 ${key}`, added: true, material: 'brass',
    shapes: place([
      tube([[600, side, 700], [600, out, 700]], 5),
      tube([[760, out, 700], [600, out, 700]], 5),
      tube([[735, out, 700], [625, out, 700]], 52, 'white'),
    ], x, y, rot),
    dims: [at(...locate(x, y, rot, 680, out)), dim('설치 높이', 700, A)],
  };
};

/** 위생용품 수거함. 옆 벽면 앞 바닥에 둔다. 여자 화장실 칸에만 넣는다. */
export const sanitaryBin = (key: string | number, x: number, y: number, rot: Rot, side: number): Item => {
  const g = Math.sign(side);
  return {
    id: `sanitary-bin-${key}`, layer: 'accessory', name: `위생용품 수거함 ${key}`, added: true, material: 'black',
    shapes: place([
      rbox(400, side - 30 * g, 570, side - 200 * g, 0, 300, 20),
      rbox(396, side - 26 * g, 574, side - 204 * g, 300, 312, 5, 'metal'),
    ], x, y, rot),
    dims: [at(...locate(x, y, rot, 485, side - 115 * g)), dim('크기', '170 x 170 x 312', A)],
  };
};

// 아래 3개는 문 틀을 쓴다. (hx, hy)는 경첩이고 angleDeg는 문짝이 뻗는 방향이다.

/** 대변기 칸 문의 잠금 손잡이. 경첩에서 dist만큼 떨어진 곳에 문짝을 꿰어 단다. */
export const stallLatch = (key: string | number, hx: number, hy: number, angleDeg: Rot, dist = 540): Item => ({
  id: `stall-latch-${key}`, layer: 'door', name: `대변기 칸 ${key} 문 잠금 손잡이`, added: true, material: 'brass',
  shapes: place([tube([[dist, -24, 1000], [dist, 24, 1000]], 15)], hx, hy, angleDeg),
  dims: [dim('설치 높이', 1000, A)],
});

/** 여닫이문의 레버 손잡이. 문짝의 두 면에 단다. width는 문짝 폭이다. 문 끝에서 fromEnd만큼 안쪽에 단다. */
export const doorLever = (id: string, name: string, hx: number, hy: number, angleDeg: Rot, width: number, fromEnd = 50, thickness = 40): Item => {
  const px = width - fromEnd;
  const face = thickness / 2;
  return {
    id, layer: 'door', name, added: true, material: 'brass',
    shapes: place([
      tube([[px, -face - 45, 1000], [px, face + 45, 1000]], 9),
      tube([[px, -face - 8, 1000], [px, -face, 1000]], 26),
      tube([[px, face, 1000], [px, face + 8, 1000]], 26),
      tube([[px, -face - 45, 1000], [px - 110, -face - 45, 1000]], 8),
      tube([[px, face + 45, 1000], [px - 110, face + 45, 1000]], 8),
    ], hx, hy, angleDeg),
    dims: [dim('설치 높이', 1000, A)],
  };
};

/** 출입문의 세로 봉 손잡이. 문짝의 두 면에 단다. width는 문짝 폭이다. 문짝 두께는 40으로 본다. */
export const pullHandle = (id: string, name: string, hx: number, hy: number, angleDeg: Rot, width: number): Item => {
  const px = width - 58;
  return {
    id, layer: 'door', name, added: true, material: 'brass',
    shapes: place([
      tube([[px, 60, 850], [px, 60, 1250]], 11),
      tube([[px, 20, 900], [px, 60, 900]], 6),
      tube([[px, 20, 1200], [px, 60, 1200]], 6),
      tube([[px, -38, 850], [px, -38, 1250]], 8),
      tube([[px, -20, 900], [px, -38, 900]], 5),
      tube([[px, -20, 1200], [px, -38, 1200]], 5),
    ], hx, hy, angleDeg),
    dims: [dim('길이', 400, A), dim('중심 높이', 1050, A)],
  };
};

// 아래 2개는 벽 틀을 쓴다. (x, y)는 벽면 위의 점이다.

/** 물비누. 세면대 상판 위, 벽에서 90 떨어진 곳에 둔다. */
export const soap = (key: string | number, x: number, y: number, rot: Rot): Item => ({
  id: `soap-${key}`, layer: 'accessory', name: `물비누 ${key}`, added: true, material: 'black',
  shapes: place([
    { type: 'lathe', cx: 90, cy: 0, rx: 32, ry: 32, profile: [[0, COUNTER], [1, COUNTER], [1, COUNTER + 105], [0.8, COUNTER + 125], [0.35, COUNTER + 135], [0.35, COUNTER + 155], [0, COUNTER + 155]] },
    tube([[90, 0, COUNTER + 155], [90, 0, COUNTER + 182], [125, 0, COUNTER + 182]], 5, 'brass'),
  ], x, y, rot),
  dims: [at(...locate(x, y, rot, 90, 0)), dim('높이', 182, A)],
});

/** 핸드드라이어. 벽에 단다. */
export const handDryer = (id: string, x: number, y: number, rot: Rot): Item => ({
  id, layer: 'accessory', name: '핸드드라이어', added: true, material: 'metal',
  shapes: place([rbox(0, -130, 130, 130, 1050, 1350, 35), box(128, -70, 134, 70, 1075, 1095, 'black')], x, y, rot),
  dims: [at(...locate(x, y, rot, 65, 0)), dim('크기', '260 x 130 x 300', A), dim('하단 높이', 1050, A)],
});

/** 휴지통. (x, y)는 중심이다. */
export const wasteBin = (id: string, x: number, y: number): Item => ({
  id, layer: 'accessory', name: '휴지통', added: true, material: 'metal',
  shapes: [{ type: 'lathe', cx: x, cy: y, rx: 140, ry: 140, profile: [[0, 0], [0.92, 0], [1, 25], [1, 600], [0.94, 600], [0.94, 40], [0, 40]] }],
  dims: [at(x, y), dim('지름', 280, A), dim('높이', 600, A)],
});
