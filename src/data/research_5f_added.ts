// 5층 연구동 화장실(여) — 상식 보완 품목
// 도면에 없지만 상식적으로 있어야 하는 것이다. 위치·크기·높이는 모두 가정이다. 종류는 연구동 3층과 맞췄다.
// 도면에 근거가 있는 품목은 research_5f.ts 에 있다.
// 칸 부속, 문 손잡이, 매입등, 환기구, 물비누, 핸드드라이어, 휴지통의 형상은 parts_added.ts 에 있다.
import { COUNTER, GAP, HEAD, SILL } from './parts';
import { at, doorLever, downlight, handDryer, paperHolder, pullHandle, sanitaryBin, soap, stallLatch, vent, wasteBin } from './parts_added';
import { BASIN_R, CH, STALLS, TOILET_X, WALL } from './research_5f';
import { box, cyl, dim, tube } from './shape_helpers';
import type { Item } from './types';

const A = 'assumed' as const;

const counter: Item[] = [
  {
    id: 'counter', layer: 'accessory', name: '세면대 상판', added: true, material: 'marble',
    remark: '이 장에는 상판 앞 선이 따로 없다. 세면기 앞의 가로선(Y 4,872)은 가림 칸막이를 지나 동쪽으로 이어지는 바닥 타일 나누기 선이다. 상판 앞 끝은 세면대 하부 칸막이 점선(Y 약 4,880)에 맞췄다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      {
        type: 'plate', x0: WALL.west + 3, y0: 4872, x1: 1912, y1: WALL.south - 3, z0: COUNTER - 20, z1: COUNTER,
        holes: [{ cx: 626, cy: 5158, r: BASIN_R - 15 }, { cx: 1415, cy: 5158, r: BASIN_R - 15 }],
      },
      // 뒷턱
      box(WALL.west + 3, WALL.south - 18, 1912, WALL.south - 3, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 1807, A), dim('깊이', 617, A), dim('윗면 높이', COUNTER, A), dim('두께', 20, A)],
  },
  {
    id: 'partition-under-basin-added', layer: 'partition', name: '세면대 하부 칸막이 (보완)', added: true,
    remark: '도면은 서쪽 끝의 점선 1개만 판독된다. 상판 아래 전면을 같은 높이의 패널로 막았다(연구동 3층과 같은 방식).',
    shapes: [box(625, 4876, 1125, 4888, 0, 800), box(1125, 4876, 1625, 4888, 0, 800), box(1625, 4876, 1912, 4888, 0, 800)],
    dims: [dim('패널 폭', '500, 500, 287', A), dim('높이', 800, A)],
  },
  // 남측 벽 마감 면(Y 5,489) 앞 상판 위
  soap(1, 888, WALL.south - 3, 270),
  soap(2, 1677, WALL.south - 3, 270),
];

// 칸마다 양변기와 같은 벽 틀(동측 벽, 서쪽을 본다)을 쓴다. 휴지걸이와 수거함은 칸의 북쪽 면에 둔다.
const stallItems: Item[] = STALLS.flatMap((s): Item[] => [
  paperHolder(s.n, TOILET_X, s.cy, 180, s.cy - s.north),
  sanitaryBin(s.n, TOILET_X, s.cy, 180, s.cy - s.north),
  stallLatch(s.n, 2488, s.hinge, 0),
  vent(`vent-${s.n}`, `환기구 ${s.n}`, 3550, s.cy, CH),
  downlight(`downlight-stall-${s.n}`, `매입등 (대변기 칸 ${s.n})`, 3000, s.cy, CH),
]);

const stallFrame: Item[] = [
  {
    id: 'partition-legs', layer: 'partition', name: '칸막이 다리', added: true, material: 'metal',
    remark: '칸막이 하부 틈을 받치는 다리다. 위치와 수량은 가정이다.',
    shapes: [
      ...STALLS.map((s) => cyl(2530, s.south, 13, 0, GAP)),
      ...[150, 770, 1160, 1770, 2155, 2770].map((y) => cyl(2482, y, 13, 0, GAP)),
    ],
    dims: [dim('높이', GAP, A), dim('지름', 26, A)],
  },
  {
    id: 'partition-headrail', layer: 'partition', name: '칸막이 상부 보강대', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(2462, WALL.north, 2502, 2968, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', 3030, A)],
  },
];

const doorHardware: Item[] = [
  // 경첩, 방향, 문짝 폭은 research_5f.ts 의 문과 같다.
  pullHandle('handle-entrance', '출입문 손잡이', 3834, 5618, 90, 1000),
  doorLever('handle-closet', '수채기실 문 손잡이', 2667, 5885, 0, 645, 55),
  doorLever('handle-inner', '하부 두 실 사이 문 손잡이', 1462, 6340, 0, 550),
];

const roomItems: Item[] = [
  {
    id: 'window-frame', layer: 'wall', name: '창틀', added: true, material: 'bronze',
    shapes: [
      box(288, -290, 1784, -220, SILL, SILL + 45), box(288, -290, 1784, -220, HEAD - 45, HEAD),
      box(288, -290, 333, -220, SILL + 45, HEAD - 45), box(1739, -290, 1784, -220, SILL + 45, HEAD - 45),
      box(1013, -290, 1058, -220, SILL + 45, HEAD - 45),
    ],
    dims: [dim('틀 폭', 45, A), dim('틀 깊이', 70, A)],
  },
  handDryer('hand-dryer', 2300, WALL.south - 3, 270),
  wasteBin('waste-bin', 2150, 5300),
  {
    id: 'fd-west-room', layer: 'fixture', name: '바닥 배수구 (하부 서측 실)', added: true, material: 'metal',
    remark: 'X 표시(바닥 구배)가 모이는 교점에 넣었다. 관경은 도면의 다른 배수구와 같게 가정했다.',
    // 구배 바닥의 중앙은 -15다. 배수구 윗면을 가장자리 바닥 높이(-13)에 맞춘다.
    shapes: [box(650, 6521, 800, 6671, -19, -13)],
    dims: [at(725, 6596), dim('관경', 'Ø75', A)],
  },
  {
    id: 'mop-tap', layer: 'fixture', name: '수채기 수전', added: true, material: 'metal',
    shapes: [
      tube([[1977, 7490, 720], [1977, 7400, 720], [1977, 7378, 690]], 10),
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
    shapes: [box(120, 540, 140, 2000, 822, 830)],
    dims: [dim('길이', 1460, A)],
  },
  {
    id: 'led-mirror', layer: 'light', name: '세면대 거울 간접 조명', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '호텔 화장실 느낌을 위한 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(112, WALL.south - 16, 1912, WALL.south - 3, 988, 1000), box(112, WALL.south - 16, 1912, WALL.south - 3, 2000, 2012)],
    dims: [dim('길이', 1800, A)],
  },
];

export const research5fAdded: Item[] = [...counter, ...stallItems, ...stallFrame, ...doorHardware, ...roomItems, ...lighting];
