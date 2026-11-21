// 3층 강의동 화장실(남) — 상식 보완 품목
// 도면에 없지만 상식적으로 있어야 하는 것이다. 위치·크기·높이는 모두 가정이다.
// 도면에 근거가 있는 품목은 lecture_3f.ts 에 있다. 독립 검수는 이 파일의 품목을 도면과 대조하지 않는다.
// 칸 부속, 문 손잡이, 매입등, 환기구, 물비누, 핸드드라이어, 휴지통의 형상은 parts_added.ts 에 있다.
// 남자 화장실이라서 위생용품 수거함은 넣지 않는다.
import { GAP, HEAD, PT, SILL } from './parts';
import { doorLever, downlight, handDryer, paperHolder, pullHandle, soap, stallLatch, vent, wasteBin } from './parts_added';
import { BRICK_MOP_W, CH, COUNTER_Y, ENTRANCE_HINGE, FACE, FRONT, SCREEN_X, STALLS, WINDOWS } from './lecture_3f';
import { box, cyl, dim } from './shape_helpers';
import type { Item } from './types';

const A = 'assumed' as const;
/** 상판의 서쪽 끝 X (가림 칸막이 동쪽 면) */
const COUNTER_W = SCREEN_X + PT / 2;

const counter: Item[] = [
  // 세면대 상판(counter)은 도면에 앞 선이 그려져 있다. 도면 근거 품목(lecture_3f.ts)에 있다.
  {
    id: 'partition-under-basin-added', layer: 'partition', name: '세면대 하부 칸막이 (보완)', added: true,
    remark: '도면은 동쪽 끝의 점선 1개(500)만 그려져 있다. 상판 아래 나머지 전면을 같은 높이의 패널로 막았다.',
    shapes: [
      box(COUNTER_W, COUNTER_Y - PT, COUNTER_W + 500, COUNTER_Y, 0, 800),
      box(COUNTER_W + 500, COUNTER_Y - PT, COUNTER_W + 1000, COUNTER_Y, 0, 800),
      box(COUNTER_W + 1000, COUNTER_Y - PT, FACE.e - 500, COUNTER_Y, 0, 800),
    ],
    dims: [dim('패널 폭', `500, 500, ${FACE.e - 500 - COUNTER_W - 1000}`, A), dim('높이', 800, A)],
  },
  // 북측 마감선(Y 120) 앞 상판 위. 세면기 사이와 양 끝에 둔다.
  soap(1, 2700, FACE.n, 90),
  soap(2, 3472, FACE.n, 90),
  soap(3, 4250, FACE.n, 90),
];

// 칸마다 양변기와 같은 벽 틀(남측 마감선 Y 6,580, 북쪽을 본다)을 쓴다. 휴지걸이는 동쪽 면에 둔다.
const stallItems: Item[] = STALLS.flatMap((s): Item[] => [
  paperHolder(s.n, s.cx, FACE.s, 270, (s.east === FACE.e ? FACE.e : s.east - PT / 2) - s.cx),
  stallLatch(s.n, s.hinge, FRONT, 90),
  vent(`vent-${s.n}`, `환기구 ${s.n}`, s.cx, 6250, CH),
  downlight(`downlight-stall-${s.n}`, `매입등 (대변기 칸 ${s.n})`, s.cx, 5650, CH),
]);

const stallFrame: Item[] = [
  {
    id: 'partition-legs', layer: 'partition', name: '칸막이 다리', added: true, material: 'metal',
    remark: '칸막이 하부 틈을 받치는 다리다. 위치와 수량은 가정이다.',
    shapes: [
      ...[1185, 2250, 3315].map((x) => cyl(x, FRONT + 50, 13, 0, GAP)),
      ...[250, 1060, 1320, 2125, 2385, 3190, 3450, 4255].map((x) => cyl(x, FRONT, 13, 0, GAP)),
      cyl(190, 1606, 13, 0, GAP), cyl(905, 1606, 13, 0, GAP),
    ],
    dims: [dim('높이', GAP, A), dim('지름', 26, A)],
  },
  {
    id: 'partition-headrail', layer: 'partition', name: '칸막이 상부 보강대', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이와 수채기실 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(FACE.w, FRONT - 20, FACE.e, FRONT + 20, 1950, 1990), box(FACE.w, 1586, BRICK_MOP_W, 1626, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', `${FACE.e - FACE.w}, ${BRICK_MOP_W - FACE.w}`, A)],
  },
];

const doorHardware: Item[] = [
  // 경첩, 방향, 문짝 폭은 lecture_3f.ts 의 문과 같다.
  pullHandle('handle-entrance', '출입문 손잡이', ENTRANCE_HINGE.x, ENTRANCE_HINGE.y, 0, 993),
  doorLever('handle-mop', '수채기실 문 손잡이', 266, 1606, 270, 566, 50, PT),
];

const windowFrame = (y0: number, y1: number) => {
  const mid = (y0 + y1) / 2;
  return [
    box(-45, y0, 25, y1, SILL, SILL + 45), box(-45, y0, 25, y1, HEAD - 45, HEAD),
    box(-45, y0, 25, y0 + 45, SILL + 45, HEAD - 45), box(-45, y1 - 45, 25, y1, SILL + 45, HEAD - 45),
    box(-45, mid - 22, 25, mid + 23, SILL + 45, HEAD - 45),
  ];
};

const roomItems: Item[] = [
  {
    id: 'window-frame', layer: 'wall', name: '창틀', added: true, material: 'bronze',
    shapes: WINDOWS.flatMap(([y0, y1]) => windowFrame(y0, y1)),
    dims: [dim('틀 폭', 45, A), dim('틀 깊이', 70, A)],
  },
  handDryer('hand-dryer', FACE.e, 1400, 180),
  wasteBin('waste-bin', 4200, 1800),
  vent('vent-main', '환기구 (화장실 가운데)', 2400, 2600, CH),
  vent('vent-mop', '환기구 (수채기실)', 600, 2450, CH),
];

const lighting: Item[] = [
  downlight('downlight-main-1', '매입등 (화장실 가운데 북)', 2300, 2000, CH, true),
  downlight('downlight-main-2', '매입등 (화장실 가운데 남)', 2300, 4200, CH),
  downlight('downlight-entrance', '매입등 (출입구)', 3900, 3150, CH),
  downlight('downlight-basin', '매입등 (세면대)', 3470, 800, CH, true),
  downlight('downlight-urinal', '매입등 (소변기)', 1240, 900, CH),
  {
    id: 'led-mirror', layer: 'light', name: '세면대 거울 간접 조명', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '호텔 화장실 느낌을 위한 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(COUNTER_W, FACE.n, FACE.e, FACE.n + 13, 988, 1000), box(COUNTER_W, FACE.n, FACE.e, FACE.n + 13, 2000, 2012)],
    dims: [dim('길이', FACE.e - COUNTER_W, A)],
  },
];

export const lecture3fAdded: Item[] = [...counter, ...stallItems, ...stallFrame, ...doorHardware, ...roomItems, ...lighting];
