// 4층 연구동 화장실(남) — 상식 보완 품목
// 도면에 없지만 상식적으로 있어야 하는 것이다. 위치·크기·높이는 모두 가정이다.
// 도면에 근거가 있는 품목은 research_4f.ts 에 있다. 독립 검수는 이 파일의 품목을 도면과 대조하지 않는다.
// 남자 화장실이라서 위생용품 수거함은 넣지 않았다.
// 칸 부속, 문 손잡이, 매입등, 환기구, 물비누, 핸드드라이어, 휴지통의 형상은 parts_added.ts 에 있다.
import { GAP, HEAD, SILL } from './parts';
import { at, doorLever, downlight, handDryer, paperHolder, pullHandle, soap, stallLatch, vent, wasteBin } from './parts_added';
import { CH, FRONT_X, STALLS, TOILET_X, WALL } from './research_4f';
import { box, cyl, dim, tube } from './shape_helpers';
import type { Item } from './types';

const A = 'assumed' as const;
/** 칸 문 경첩이 붙는 전면 칸막이의 동쪽 면 */
const DOOR_X = FRONT_X + 6;

const counter: Item[] = [
  // 세면대 상판(counter)은 도면에 앞 선이 그려져 있다. 도면 근거 품목(research_4f.ts)에 있다.
  {
    id: 'partition-under-basin-added', layer: 'partition', name: '세면대 하부 칸막이 (보완)', added: true,
    remark: '도면은 서쪽 끝의 점선 1개만 판독된다. 상판 아래 전면을 같은 높이의 패널로 막았다(연구동 3층과 같은 방식).',
    shapes: [box(622, 4884, 1122, 4896, 0, 800), box(1122, 4884, 1622, 4896, 0, 800), box(1622, 4884, 1916, 4896, 0, 800)],
    dims: [dim('패널 폭', '500, 500, 294', A), dim('높이', 800, A)],
  },
  // 남측 벽 북쪽 면(Y 5,491) 앞 상판 위
  soap(1, 889, WALL.south, 270),
  soap(2, 1687, WALL.south, 270),
];

// 칸마다 양변기와 같은 벽 틀(동측 벽, 서쪽을 본다)을 쓴다. 휴지걸이는 칸의 북쪽 면에 둔다.
const stallItems: Item[] = STALLS.flatMap((s): Item[] => [
  paperHolder(s.n, TOILET_X, s.cy, 180, s.cy - s.north),
  stallLatch(s.n, DOOR_X, s.hinge, 0),
  vent(`vent-${s.n}`, `환기구 ${s.n}`, 3550, s.cy, CH),
  downlight(`downlight-stall-${s.n}`, `매입등 (대변기 칸 ${s.n})`, 3000, s.cy, CH),
]);

const stallFrame: Item[] = [
  {
    id: 'partition-legs', layer: 'partition', name: '칸막이 다리', added: true, material: 'metal',
    remark: '칸막이 하부 틈을 받치는 다리다. 위치와 수량은 가정이다.',
    shapes: [
      ...STALLS.map((s) => cyl(FRONT_X + 50, s.south, 13, 0, GAP)),
      ...[150, 770, 1190, 1775, 2150, 2776].map((y) => cyl(FRONT_X, y, 13, 0, GAP)),
    ],
    dims: [dim('높이', GAP, A), dim('지름', 26, A)],
  },
  {
    id: 'partition-headrail', layer: 'partition', name: '칸막이 상부 보강대', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(FRONT_X - 20, WALL.north, FRONT_X + 20, 2970, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', 3029, A)],
  },
];

const doorHardware: Item[] = [
  // 경첩, 방향, 문짝 폭은 research_4f.ts 의 문과 같다.
  pullHandle('handle-entrance', '출입문 손잡이', 3835, 5624, 90, 1000),
  doorLever('handle-closet', '수채기실 문 손잡이', 2674, 5889, 0, 647, 55),
  doorLever('handle-inner', '하부 두 실 사이 문 손잡이', 1458, 6345, 0, 533),
];

const roomItems: Item[] = [
  {
    id: 'window-frame', layer: 'wall', name: '창틀', added: true, material: 'bronze',
    shapes: [
      box(293, -298, 1790, -228, SILL, SILL + 45), box(293, -298, 1790, -228, HEAD - 45, HEAD),
      box(293, -298, 338, -228, SILL + 45, HEAD - 45), box(1745, -298, 1790, -228, SILL + 45, HEAD - 45),
      box(1019, -298, 1064, -228, SILL + 45, HEAD - 45),
    ],
    dims: [dim('틀 폭', 45, A), dim('틀 깊이', 70, A)],
  },
  handDryer('hand-dryer', 2420, WALL.south, 270),
  wasteBin('waste-bin', 2110, 5300),
  {
    id: 'fd-west-room', layer: 'fixture', name: '바닥 배수구 (하부 서측 실)', added: true, material: 'metal',
    remark: 'X 표시(바닥 구배)가 모이는 교점에 넣었다. 관경은 도면의 다른 배수구와 같게 가정했다.',
    // 구배 바닥의 중앙은 -15다. 배수구 윗면을 가장자리 바닥 높이(-13)에 맞춘다.
    shapes: [box(652, 6523, 802, 6673, -19, -13)],
    dims: [at(727, 6598), dim('관경', 'Ø75', A)],
  },
  {
    id: 'mop-tap', layer: 'fixture', name: '수채기 수전', added: true, material: 'metal',
    shapes: [
      tube([[1980, 7494, 720], [1980, 7400, 720], [1980, 7378, 690]], 10),
      tube([[1980, 7440, 730], [1980, 7440, 770]], 7),
      tube([[1950, 7440, 770], [2010, 7440, 770]], 6),
    ],
    dims: [at(1980, 7440), dim('설치 높이', 720, A)],
  },
  vent('vent-west-room', '환기구 (하부 서측 실)', 500, 6200, CH),
  vent('vent-closet', '환기구 (수채기실)', 1800, 6050, CH),
];

const lighting: Item[] = [
  downlight('downlight-urinal', '매입등 (소변기 앞)', 900, 1945, CH),
  downlight('downlight-main-1', '매입등 (화장실 중앙 북)', 1500, 2600, CH, true),
  downlight('downlight-main-2', '매입등 (화장실 중앙 남)', 1500, 4000, CH),
  downlight('downlight-entrance', '매입등 (출입구)', 3000, 4300, CH),
  downlight('downlight-basin', '매입등 (세면대)', 1020, 5050, CH, true),
  {
    id: 'led-mirror', layer: 'light', name: '세면대 거울 간접 조명', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '호텔 화장실 느낌을 위한 간접 조명이다(연구동 3층과 같은 방식). 도면에 없다.',
    shapes: [box(WALL.west, WALL.south - 18, 1916, WALL.south - 5, 988, 1000), box(WALL.west, WALL.south - 18, 1916, WALL.south - 5, 2000, 2012)],
    dims: [dim('길이', 1813, A)],
  },
];

export const research4fAdded: Item[] = [...counter, ...stallItems, ...stallFrame, ...doorHardware, ...roomItems, ...lighting];
