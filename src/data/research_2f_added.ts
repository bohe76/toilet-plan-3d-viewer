// 2층 연구동 화장실 확대평면도 (변경후) — 상식 보완 품목
// 도면에 없지만 상식적으로 있어야 하는 것이다. 위치·크기·높이는 모두 가정이다. 종류는 연구동 3층(research_3f_added.ts)과 맞췄다.
// 도면에 근거가 있는 품목은 research_2f.ts 에 있다. 독립 검수는 이 파일의 품목을 도면과 대조하지 않는다.
// 칸 부속, 문 손잡이, 매입등, 환기구, 물비누, 핸드드라이어, 휴지통, 창틀의 형상은 parts_added.ts, parts_extra.ts 에 있다.
import { GAP, PT } from './parts';
import { windowFrame } from './parts_extra';
import { at, doorLever, downlight, handDryer, paperHolder, pullHandle, sanitaryBin, soap, stallLatch, vent, wasteBin } from './parts_added';
import { BRICK, CH, C_E, C_W, ENTRANCE, E_IN, FRONT_F, FRONT_M, LEAF, MID, MOP_DOOR, N_IN, STALLS, W_IN } from './research_2f';
import { box, cyl, dim, tube } from './shape_helpers';
import type { Item } from './types';

const A = 'assumed' as const;
/** 세면대 상판 앞 끝과 두겁돌 남쪽 면. research_2f.ts 의 값과 같다. */
const COUNTER_X = { f: C_W - 618, m: C_E + 627 };
const CAP_Y1 = MID.y0 - 1500;
const UNDER_Y = MID.y0 - 500; // 도면 근거 하부 칸막이의 북쪽 끝

const counter: Item[] = [
  {
    id: 'partition-under-basin-added-f', layer: 'partition', name: '세면대 하부 칸막이 (보완, 여)', added: true,
    remark: '도면은 상판 앞 선 남쪽 끝의 점선 1개만 판독된다. 상판 아래 나머지 앞면을 같은 높이의 패널로 막았다(연구동 3층과 같은 처리).',
    shapes: [box(COUNTER_X.f, CAP_Y1, COUNTER_X.f + PT, 4549, 0, 800), box(COUNTER_X.f, 4549, COUNTER_X.f + PT, UNDER_Y, 0, 800)],
    dims: [dim('패널 폭', '500, 499', A), dim('높이', 800, A)],
  },
  {
    id: 'partition-under-basin-added-m', layer: 'partition', name: '세면대 하부 칸막이 (보완, 남)', added: true,
    remark: '도면은 상판 앞 선 남쪽 끝의 점선 1개만 판독된다. 상판 아래 나머지 앞면을 같은 높이의 패널로 막았다(연구동 3층과 같은 처리).',
    shapes: [box(COUNTER_X.m - PT, CAP_Y1, COUNTER_X.m, 4549, 0, 800), box(COUNTER_X.m - PT, 4549, COUNTER_X.m, UNDER_Y, 0, 800)],
    dims: [dim('패널 폭', '500, 499', A), dim('높이', 800, A)],
  },
  // 중앙 벽면 앞 상판 위, 세면기 사이와 남쪽 끝
  soap('f1', C_W, 4775, 180),
  soap('f2', C_W, 5420, 180),
  soap('m1', C_E, 4775, 0),
  soap('m2', C_E, 5420, 0),
];

// 칸은 양변기와 같은 벽 틀(외벽)을 쓴다. 휴지걸이와 수거함은 칸의 북쪽 벽면(칸막이 면)에 둔다. 유리선반은 여 칸의 북서 모서리 높이 1,000에 있어서 휴지걸이(높이 700)와 겹치지 않는다.
const stallItems: Item[] = STALLS.flatMap((s): Item[] => {
  const north = s.n === 1 ? N_IN : s.north + PT / 2;
  return [
    // 여: 동쪽을 본다(rot 0). 북쪽이 왼쪽(-)이다.
    paperHolder(`f${s.n}`, W_IN, s.cyF, 0, -(s.cyF - north)),
    sanitaryBin(`f${s.n}`, W_IN, s.cyF, 0, -(s.cyF - north)),
    stallLatch(`f${s.n}`, FRONT_F, s.hF, 180, LEAF.f - 40),
    vent(`vent-f${s.n}`, `환기구 (여 칸 ${s.n})`, 450, s.cyF, CH),
    downlight(`downlight-stall-f${s.n}`, `매입등 (여 칸 ${s.n})`, 1000, s.cyF, CH),
    // 남: 서쪽을 본다(rot 180). 북쪽이 오른쪽(+)이다.
    paperHolder(`m${s.n}`, E_IN, s.cyM, 180, s.cyM - north),
    stallLatch(`m${s.n}`, FRONT_M, s.hM, 0, LEAF.m - 40),
    vent(`vent-m${s.n}`, `환기구 (남 칸 ${s.n})`, 6750, s.cyM, CH),
    downlight(`downlight-stall-m${s.n}`, `매입등 (남 칸 ${s.n})`, 6150, s.cyM, CH),
  ];
});

/** 칸막이 다리. 전면 칸막이의 칸막이 접합부와 패널 끝에 둔다. */
const legYs = (key: 'f' | 'm'): number[] => {
  const h = STALLS.map((s) => (key === 'f' ? s.hF : s.hM));
  const parts = STALLS.slice(1).map((s) => s.north);
  return [...h, ...h.map((y) => y - LEAF[key]), ...parts];
};
const stallFrame: Item[] = [
  {
    id: 'partition-legs', layer: 'partition', name: '칸막이 다리', added: true, material: 'metal',
    remark: '칸막이 하부 틈을 받치는 다리다. 위치와 수량은 가정이다.',
    shapes: [...legYs('f').map((y) => cyl(FRONT_F, y, 13, 0, GAP)), ...legYs('m').map((y) => cyl(FRONT_M, y, 13, 0, GAP))],
    dims: [dim('높이', GAP, A), dim('지름', 26, A)],
  },
  {
    id: 'partition-headrail-f', layer: 'partition', name: '칸막이 상부 보강대 (여)', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(FRONT_F - 20, N_IN, FRONT_F + 20, BRICK.y0, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', BRICK.y0 - N_IN, A)],
  },
  {
    id: 'partition-headrail-m', layer: 'partition', name: '칸막이 상부 보강대 (남)', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(FRONT_M - 20, N_IN, FRONT_M + 20, BRICK.y0, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', BRICK.y0 - N_IN, A)],
  },
];

const doorHardware: Item[] = [
  // 경첩, 방향, 문짝 폭은 research_2f.ts 의 문과 같다.
  pullHandle('handle-entrance-f', '출입문 손잡이 (여)', ENTRANCE.f.hx, ENTRANCE.f.hy, 90, ENTRANCE.f.w),
  pullHandle('handle-entrance-m', '출입문 손잡이 (남)', ENTRANCE.m.hx, ENTRANCE.m.hy, 90, ENTRANCE.m.w),
  doorLever('handle-mop', '수채기실 문 손잡이', MOP_DOOR.hx, MOP_DOOR.hy, 180, MOP_DOOR.w),
];

/** 창틀(parts_extra.ts). 창(2/CAW)의 양 끝 X를 받는다. 틀 두께 중심은 Y −235(−270 ~ −200)다. 안쪽 면은 창대석 바깥 끝(Y −200)이다. 「"A" 단면상세도」의 340이 이 면에서 시작한다. 머리는 상세도의 창 위 면(천장고 + 150)에 붙는다. 유리(research_2f.ts 의 window-f/m)는 평면의 창짝 선 위치 그대로다. */
const frame = (key: 'f' | 'm', x0: number, x1: number): Item =>
  windowFrame(key, (x0 + x1) / 2, -235, 90, x1 - x0, { name: `창틀 (${key === 'f' ? '여' : '남'})` }, CH + 150);

const roomItems: Item[] = [
  frame('f', 1486, 2985),
  frame('m', C_E, 4996),
  handDryer('hand-dryer-f', W_IN, 4800, 0),
  handDryer('hand-dryer-m', E_IN, 4800, 180),
  wasteBin('waste-bin-f', 300, 5250),
  wasteBin('waste-bin-m', 6900, 5250),
  {
    id: 'mop-tap', layer: 'fixture', name: '수채기 수전', added: true, material: 'metal',
    shapes: [
      tube([[3450, 6299, 720], [3358, 6299, 720], [3336, 6299, 690]], 10),
      tube([[3408, 6299, 730], [3408, 6299, 770]], 7),
      tube([[3408, 6269, 770], [3408, 6329, 770]], 6),
    ],
    dims: [at(3408, 6299), dim('설치 높이', 720, A)],
  },
  vent('vent-mop', '환기구 (수채기실)', 3050, 5950, CH),
  vent('vent-small', '환기구 (작은 실)', 4050, 6000, CH),
  vent('vent-vestibule-f', '환기구 (여 남쪽 통로)', 700, 6300, CH),
  vent('vent-vestibule-m', '환기구 (남 남쪽 통로)', 6500, 6300, CH),
];

const lighting: Item[] = [
  downlight('downlight-main-f1', '매입등 (여 화장실 북)', 2300, 1500, CH, true),
  downlight('downlight-main-f2', '매입등 (여 화장실 남)', 2300, 3200, CH),
  downlight('downlight-basin-f', '매입등 (여 세면대)', 2200, 4800, CH),
  downlight('downlight-vestibule-f', '매입등 (여 「+」 구역)', 1950, 6250, CH),
  downlight('downlight-south-f', '매입등 (여 남쪽 통로)', 750, 6000, CH),
  downlight('downlight-main-m1', '매입등 (남 화장실 북)', 4900, 1500, CH, true),
  downlight('downlight-main-m2', '매입등 (남 화장실 남)', 4900, 3200, CH),
  downlight('downlight-basin-m', '매입등 (남 세면대)', 4600, 4800, CH),
  // 남 「+」 구역은 천장고 2,800(도면 표기)이다.
  downlight('downlight-vestibule-m', '매입등 (남 「+」 구역)', 5250, 6250, 2800),
  downlight('downlight-south-m', '매입등 (남 남쪽 통로)', 6450, 6000, CH),
  {
    id: 'led-shelf-f', layer: 'light', name: '선반 하부 간접 조명 (여)', added: true, material: 'led', lamp: { power: 0.25 },
    remark: '연구동 3층과 같은 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(C_W - 200, 2396, C_W - 180, 3850, 822, 830)],
    dims: [dim('길이', 1454, A)],
  },
  {
    id: 'led-mirror-f', layer: 'light', name: '세면대 거울 간접 조명 (여)', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '연구동 3층과 같은 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(C_W - 13, CAP_Y1, C_W, MID.y0, 988, 1000), box(C_W - 13, CAP_Y1, C_W, MID.y0, 2000, 2012)],
    dims: [dim('길이', 1500, A)],
  },
  {
    id: 'led-mirror-m', layer: 'light', name: '세면대 거울 간접 조명 (남)', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '연구동 3층과 같은 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(C_E, CAP_Y1, C_E + 13, MID.y0, 988, 1000), box(C_E, CAP_Y1, C_E + 13, MID.y0, 2000, 2012)],
    dims: [dim('길이', 1500, A)],
  },
];

export const research2fAdded: Item[] = [...counter, ...stallItems, ...stallFrame, ...doorHardware, ...roomItems, ...lighting];
