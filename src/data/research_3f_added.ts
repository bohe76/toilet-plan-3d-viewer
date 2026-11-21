// 3층 연구동 화장실(여) — 상식 보완 품목
// 도면에 없지만 상식적으로 있어야 하는 것이다(보헤님 지시, 2026-11-21). 위치·크기·높이는 모두 가정이다.
// 도면에 근거가 있는 품목은 research_3f.ts 에 있다. 독립 검수는 이 파일의 품목을 도면과 대조하지 않는다.
// 칸 부속, 문 손잡이, 매입등, 환기구, 물비누, 핸드드라이어, 휴지통의 형상은 parts_added.ts 에 있다.
import { GAP, HEAD, SILL } from './parts';
import { at, doorLever, downlight, handDryer, paperHolder, pullHandle, sanitaryBin, soap, stallLatch, vent, wasteBin } from './parts_added';
import { CH, STALLS } from './research_3f';
import { box, cyl, dim, tube } from './shape_helpers';
import type { Item } from './types';

const A = 'assumed' as const;

const counter: Item[] = [
  // 세면대 상판(counter)은 도면에 앞 선이 그려져 있다. 도면 근거 품목(research_3f.ts)에 있다.
  {
    id: 'partition-under-basin-added', layer: 'partition', name: '세면대 하부 칸막이 (보완)', added: true,
    remark: '도면은 서쪽 끝의 점선 1개만 판독된다. 상판 아래 전면을 같은 높이의 패널로 막았다(보헤님 지시: 상식으로 정한다).',
    shapes: [box(622, 4880, 1122, 4892, 0, 800), box(1122, 4880, 1622, 4892, 0, 800), box(1622, 4880, 1904, 4892, 0, 800)],
    dims: [dim('패널 폭', '500, 500, 282', A), dim('높이', 800, A)],
  },
  // 남측 벽(Y 5,475) 앞 상판 위
  soap(1, 887, 5475, 270),
  soap(2, 1682, 5475, 270),
];

// 칸마다 양변기와 같은 벽 틀(동측 벽 X 3,900, 서쪽을 본다)을 쓴다. 휴지걸이와 수거함은 칸의 북쪽 면에 둔다.
const stallItems: Item[] = STALLS.flatMap((s): Item[] => [
  paperHolder(s.n, 3900, s.cy, 180, s.cy - s.north),
  sanitaryBin(s.n, 3900, s.cy, 180, s.cy - s.north),
  stallLatch(s.n, 2496, s.hinge, 0),
  vent(`vent-${s.n}`, `환기구 ${s.n}`, 3550, s.cy, CH),
  downlight(`downlight-stall-${s.n}`, `매입등 (대변기 칸 ${s.n})`, 3000, s.cy, CH),
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
  // 경첩, 방향, 문짝 폭은 research_3f.ts 의 문과 같다.
  pullHandle('handle-entrance', '출입문 손잡이', 3830, 5618, 90, 1000),
  doorLever('handle-closet', '수채기실 문 손잡이', 2667, 5885, 0, 645, 55),
  doorLever('handle-inner', '하부 두 실 사이 문 손잡이', 1465, 6348, 0, 540),
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
  handDryer('hand-dryer', 2420, 5475, 270),
  wasteBin('waste-bin', 2110, 5300),
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
  vent('vent-west-room', '환기구 (하부 서측 실)', 500, 6200, CH),
  vent('vent-closet', '환기구 (수채기실)', 1900, 6050, CH),
];

const lighting: Item[] = [
  downlight('downlight-main-1', '매입등 (화장실 중앙 북)', 1500, 2600, CH, true),
  downlight('downlight-main-2', '매입등 (화장실 중앙 남)', 1500, 4000, CH),
  downlight('downlight-entrance', '매입등 (출입구)', 3000, 4300, CH),
  downlight('downlight-basin', '매입등 (세면대)', 1020, 5050, CH, true),
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
