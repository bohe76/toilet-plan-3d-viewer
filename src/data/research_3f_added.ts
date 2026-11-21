// 3층 연구동 화장실(여) — 상식 보완 품목
// 도면에 없지만 상식적으로 있어야 하는 것이다(보헤님 지시, 2026-11-21). 위치·크기·높이는 모두 가정이다.
// 도면에 근거가 있는 품목은 research_3f.ts 에 있다. 독립 검수는 이 파일의 품목을 도면과 대조하지 않는다.
import { CH, COUNTER, GAP, HEAD, SILL, STALLS } from './research_3f';
import { box, cyl, dim, rbox, tube } from './shape_helpers';
import type { DimValue, Item, Shape } from './types';

const A = 'assumed' as const;
const at = (x: number, y: number): DimValue => dim('위치 (X, Y)', `${x.toLocaleString('en-US')}, ${y.toLocaleString('en-US')}`, A);

/** +x 방향으로 열린 문짝의 레버 손잡이. 문짝의 두 면(yA < yB)에 단다. */
const lever = (x: number, yA: number, yB: number, z: number): Shape[] => [
  tube([[x, yA - 45, z], [x, yB + 45, z]], 9),
  tube([[x, yA - 8, z], [x, yA, z]], 26),
  tube([[x, yB, z], [x, yB + 8, z]], 26),
  tube([[x, yA - 45, z], [x - 110, yA - 45, z]], 8),
  tube([[x, yB + 45, z], [x - 110, yB + 45, z]], 8),
];

const downlight = (id: string, name: string, x: number, y: number, shadow = false): Item => ({
  id, layer: 'light', name, added: true, lamp: { power: 1, shadow },
  remark: '전체 조명용 매입등이다. 도면에 없다. 위치와 수량은 가정이다.',
  shapes: [cyl(x, y, 65, CH - 8, CH)],
  dims: [at(x, y), dim('지름', 130, A)],
});

const counter: Item[] = [
  // 세면대 상판(counter)은 도면에 앞 선이 그려져 있다. 도면 근거 품목(research_3f.ts)에 있다.
  {
    id: 'partition-under-basin-added', layer: 'partition', name: '세면대 하부 칸막이 (보완)', added: true,
    remark: '도면은 서쪽 끝의 점선 1개만 판독된다. 상판 아래 전면을 같은 높이의 패널로 막았다(보헤님 지시: 상식으로 정한다).',
    shapes: [box(622, 4880, 1122, 4892, 0, 800), box(1122, 4880, 1622, 4892, 0, 800), box(1622, 4880, 1904, 4892, 0, 800)],
    dims: [dim('패널 폭', '500, 500, 282', A), dim('높이', 800, A)],
  },
  ...[887, 1682].map((x, i): Item => ({
    id: `soap-${i + 1}`, layer: 'accessory', name: `물비누 ${i + 1}`, added: true, material: 'black',
    shapes: [
      { type: 'lathe', cx: x, cy: 5385, rx: 32, ry: 32, profile: [[0, COUNTER], [1, COUNTER], [1, COUNTER + 105], [0.8, COUNTER + 125], [0.35, COUNTER + 135], [0.35, COUNTER + 155], [0, COUNTER + 155]] },
      tube([[x, 5385, COUNTER + 155], [x, 5385, COUNTER + 182], [x, 5350, COUNTER + 182]], 5, 'brass'),
    ],
    dims: [at(x, 5385), dim('높이', 182, A)],
  })),
];

const stallItems: Item[] = STALLS.flatMap((s): Item[] => [
  {
    id: `paper-holder-${s.n}`, layer: 'accessory', name: `휴지걸이 ${s.n}`, added: true, material: 'brass',
    shapes: [
      tube([[3300, s.north, 700], [3300, s.north + 62, 700]], 5),
      tube([[3140, s.north + 62, 700], [3300, s.north + 62, 700]], 5),
      tube([[3165, s.north + 62, 700], [3275, s.north + 62, 700]], 52, 'white'),
    ],
    dims: [at(3220, s.north + 62), dim('설치 높이', 700, A)],
  },
  {
    id: `sanitary-bin-${s.n}`, layer: 'accessory', name: `위생용품 수거함 ${s.n}`, added: true, material: 'black',
    shapes: [
      rbox(3330, s.north + 30, 3500, s.north + 200, 0, 300, 20),
      rbox(3326, s.north + 26, 3504, s.north + 204, 300, 312, 5, 'metal'),
    ],
    dims: [at(3415, s.north + 115), dim('크기', '170 x 170 x 312', A)],
  },
  {
    id: `stall-latch-${s.n}`, layer: 'door', name: `대변기 칸 ${s.n} 문 잠금 손잡이`, added: true, material: 'brass',
    shapes: [tube([[3036, s.hinge - 24, 1000], [3036, s.hinge + 24, 1000]], 15)],
    dims: [dim('설치 높이', 1000, A)],
  },
  {
    id: `vent-${s.n}`, layer: 'accessory', name: `환기구 ${s.n}`, added: true, material: 'white',
    shapes: [box(3400, s.cy - 150, 3700, s.cy + 150, CH - 8, CH)],
    dims: [at(3550, s.cy), dim('크기', '300 x 300', A)],
  },
  downlight(`downlight-stall-${s.n}`, `매입등 (대변기 칸 ${s.n})`, 3000, s.cy),
]);

const stallFrame: Item[] = [
  {
    id: 'partition-legs', layer: 'partition', name: '칸막이 다리', added: true, material: 'metal',
    remark: '칸막이 하부 틈을 받치는 다리다. 위치와 수량은 가정이다.',
    shapes: [
      ...STALLS.map((s) => cyl(2540, s.south, 13, 0, GAP)),
      ...[150, 770, 1190, 1775, 2150, 2776].map((y) => cyl(2490, y, 13, 0, GAP)),
    ],
    dims: [dim('높이', GAP, A), dim('지름', 26, A)],
  },
  {
    id: 'partition-headrail', layer: 'partition', name: '칸막이 상부 보강대', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(2470, -55, 2510, 2969, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', 3024, A)],
  },
];

const doorHardware: Item[] = [
  {
    id: 'handle-entrance', layer: 'door', name: '출입문 손잡이', added: true, material: 'brass',
    shapes: [
      tube([[3770, 6560, 850], [3770, 6560, 1250]], 11),
      tube([[3810, 6560, 900], [3770, 6560, 900]], 6),
      tube([[3810, 6560, 1200], [3770, 6560, 1200]], 6),
      tube([[3868, 6560, 850], [3868, 6560, 1250]], 8),
      tube([[3850, 6560, 900], [3868, 6560, 900]], 5),
      tube([[3850, 6560, 1200], [3868, 6560, 1200]], 5),
    ],
    dims: [dim('길이', 400, A), dim('중심 높이', 1050, A)],
  },
  {
    id: 'handle-closet', layer: 'door', name: '수채기실 문 손잡이', added: true, material: 'brass',
    shapes: lever(3257, 5865, 5905, 1000),
    dims: [dim('설치 높이', 1000, A)],
  },
  {
    id: 'handle-inner', layer: 'door', name: '하부 두 실 사이 문 손잡이', added: true, material: 'brass',
    shapes: lever(1955, 6328, 6368, 1000),
    dims: [dim('설치 높이', 1000, A)],
  },
];

const roomItems: Item[] = [
  {
    id: 'window-frame', layer: 'wall', name: '창틀', added: true, material: 'bronze',
    shapes: [
      box(297, -290, 1792, -220, SILL, SILL + 45), box(297, -290, 1792, -220, HEAD - 45, HEAD),
      box(297, -290, 342, -220, SILL + 45, HEAD - 45), box(1747, -290, 1792, -220, SILL + 45, HEAD - 45),
      box(1022, -290, 1067, -220, SILL + 45, HEAD - 45),
    ],
    dims: [dim('틀 폭', 45, A), dim('틀 깊이', 70, A)],
  },
  {
    id: 'hand-dryer', layer: 'accessory', name: '핸드드라이어', added: true, material: 'metal',
    shapes: [rbox(2290, 5345, 2550, 5475, 1050, 1350, 35), box(2350, 5341, 2490, 5347, 1075, 1095, 'black')],
    dims: [at(2420, 5410), dim('크기', '260 x 130 x 300', A), dim('하단 높이', 1050, A)],
  },
  {
    id: 'waste-bin', layer: 'accessory', name: '휴지통', added: true, material: 'metal',
    shapes: [{ type: 'lathe', cx: 2110, cy: 5300, rx: 140, ry: 140, profile: [[0, 0], [0.92, 0], [1, 25], [1, 600], [0.94, 600], [0.94, 40], [0, 40]] }],
    dims: [at(2110, 5300), dim('지름', 280, A), dim('높이', 600, A)],
  },
  {
    id: 'fd-west-room', layer: 'fixture', name: '바닥 배수구 (하부 서측 실)', added: true, material: 'metal',
    remark: 'X 표시(바닥 구배)가 모이는 중앙에 넣었다(보헤님 확인). 관경은 도면의 다른 배수구와 같게 가정했다.',
    // 구배 바닥의 중앙은 -15다. 배수구 윗면을 가장자리 바닥 높이(-13)에 맞춘다.
    shapes: [box(658, 6525, 808, 6675, -19, -13)],
    dims: [at(733, 6600), dim('관경', 'Ø75', A)],
  },
  {
    id: 'mop-tap', layer: 'fixture', name: '수채기 수전', added: true, material: 'metal',
    shapes: [
      tube([[1977, 7494, 720], [1977, 7400, 720], [1977, 7378, 690]], 10),
      tube([[1977, 7440, 730], [1977, 7440, 770]], 7),
      tube([[1947, 7440, 770], [2007, 7440, 770]], 6),
    ],
    dims: [at(1977, 7440), dim('설치 높이', 720, A)],
  },
  ...[{ id: 'vent-west-room', name: '환기구 (하부 서측 실)', x: 500, y: 6200 }, { id: 'vent-closet', name: '환기구 (수채기실)', x: 1900, y: 6050 }].map((v): Item => ({
    id: v.id, layer: 'accessory', name: v.name, added: true, material: 'white',
    shapes: [box(v.x - 150, v.y - 150, v.x + 150, v.y + 150, CH - 8, CH)],
    dims: [at(v.x, v.y), dim('크기', '300 x 300', A)],
  })),
];

const lighting: Item[] = [
  downlight('downlight-main-1', '매입등 (화장실 중앙 북)', 1500, 2600, true),
  downlight('downlight-main-2', '매입등 (화장실 중앙 남)', 1500, 4000),
  downlight('downlight-entrance', '매입등 (출입구)', 3000, 4300),
  downlight('downlight-basin', '매입등 (세면대)', 1020, 5050, true),
  {
    id: 'led-shelf', layer: 'light', name: '선반 하부 간접 조명', added: true, material: 'led', lamp: { power: 0.25 },
    remark: '호텔 화장실 느낌을 위한 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(125, 520, 145, 2010, 822, 830)],
    dims: [dim('길이', 1490, A)],
  },
  {
    id: 'led-mirror', layer: 'light', name: '세면대 거울 간접 조명', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '호텔 화장실 느낌을 위한 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(110, 5462, 1904, 5475, 988, 1000), box(110, 5462, 1904, 5475, 2000, 2012)],
    dims: [dim('길이', 1794, A)],
  },
];

export const research3fAdded: Item[] = [...counter, ...stallItems, ...stallFrame, ...doorHardware, ...roomItems, ...lighting];
