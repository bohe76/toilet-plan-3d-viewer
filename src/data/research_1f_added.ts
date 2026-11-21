// 1층 연구동 화장실 확대평면도 (변경후) — 상식 보완 품목
// 도면에 없지만 상식적으로 있어야 하는 것이다. 위치·크기·높이는 모두 가정이다. 종류는 연구동 3층(research_3f_added.ts)과 맞췄다.
// 도면에 근거가 있는 품목은 research_1f.ts 에 있다. 독립 검수는 이 파일의 품목을 도면과 대조하지 않는다.
// 칸 부속, 문 손잡이, 매입등, 환기구, 물비누, 핸드드라이어, 휴지통의 형상은 parts_added.ts 에 있다.
// 장애인용 칸(f1, m1)에는 휴지걸이를 넣지 않았다. 옆 벽에 도면의 벽 손잡이가 있어서 부품의 휴지걸이(높이 700)와 겹친다.
// 여 장애인용 칸에는 위생용품 수거함도 넣지 않았다. 부품의 위치(벽에서 400 ~ 570)가 도면의 아래 비상벨(H200) 앞을 막는다.
import { GAP, PT } from './parts';
import { windowFrame } from './parts_extra';
import { at, doorLever, downlight, handDryer, paperHolder, pullHandle, sanitaryBin, soap, stallLatch, vent, wasteBin } from './parts_added';
import { CH, C_E, C_W, E_IN, FRONT_F, FRONT_M, N_IN, STALLS, STALL_S, W_IN } from './research_1f';
import { box, cyl, dim, tube } from './shape_helpers';
import type { Item } from './types';

const A = 'assumed' as const;

const counter: Item[] = [
  {
    id: 'partition-under-basin-added-f', layer: 'partition', name: '세면대 하부 칸막이 (보완, 여)', added: true,
    remark: '도면은 상판 앞 선 남쪽 끝의 점선 1개만 판독된다. 상판 아래 나머지 앞면을 같은 높이의 패널로 막았다(연구동 3층과 같은 처리).',
    shapes: [box(2730, 4047, 2742, 4537, 0, 800), box(2730, 4537, 2742, 5024, 0, 800)],
    dims: [dim('패널 폭', '490, 487', A), dim('높이', 800, A)],
  },
  {
    id: 'partition-under-basin-added-m', layer: 'partition', name: '세면대 하부 칸막이 (보완, 남)', added: true,
    remark: '도면은 상판 앞 선 남쪽 끝의 점선 1개만 판독된다. 상판 아래 나머지 앞면을 같은 높이의 패널로 막았다(연구동 3층과 같은 처리).',
    shapes: [box(4156, 4047, 4168, 4537, 0, 800), box(4156, 4537, 4168, 5024, 0, 800)],
    dims: [dim('패널 폭', '490, 487', A), dim('높이', 800, A)],
  },
  // 중앙 벽면 앞 상판 위, 세면기 사이와 남쪽 끝
  soap('f1', C_W, 4775, 180),
  soap('f2', C_W, 5420, 180),
  soap('m1', C_E, 4775, 0),
  soap('m2', C_E, 5420, 0),
];

// 칸 2, 3은 양변기와 같은 벽 틀(외벽)을 쓴다. 휴지걸이와 수거함은 칸의 북쪽 칸막이 면에 둔다.
const stallItems: Item[] = STALLS.flatMap((s): Item[] => {
  const side = s.cy - (s.north + PT / 2);
  return [
    // 여: 동쪽을 본다(rot 0). 북쪽이 왼쪽(-)이다.
    paperHolder(`f${s.n}`, W_IN, s.cy, 0, -side),
    sanitaryBin(`f${s.n}`, W_IN, s.cy, 0, -side),
    stallLatch(`f${s.n}`, FRONT_F, s.hinge, 180),
    vent(`vent-f${s.n}`, `환기구 (여 칸 ${s.n})`, 450, s.cy, CH),
    downlight(`downlight-stall-f${s.n}`, `매입등 (여 칸 ${s.n})`, 1000, s.cy, CH),
    // 남: 서쪽을 본다(rot 180). 북쪽이 오른쪽(+)이다.
    paperHolder(`m${s.n}`, E_IN, s.cy, 180, side),
    stallLatch(`m${s.n}`, FRONT_M, s.hinge, 0),
    vent(`vent-m${s.n}`, `환기구 (남 칸 ${s.n})`, 6750, s.cy, CH),
    downlight(`downlight-stall-m${s.n}`, `매입등 (남 칸 ${s.n})`, 6150, s.cy, CH),
  ];
});

const accessibleItems: Item[] = [
  vent('vent-f1', '환기구 (여 장애인용 칸)', 1000, 1300, CH),
  downlight('downlight-stall-f1', '매입등 (여 장애인용 칸)', 800, 900, CH),
  vent('vent-m1', '환기구 (남 장애인용 칸)', 6200, 1300, CH),
  downlight('downlight-stall-m1', '매입등 (남 장애인용 칸)', 6400, 900, CH),
];

/** 칸막이 다리. 전면 칸막이의 칸막이 접합부와 패널 끝에 둔다. */
const legYs = [942, 1975, 2214, 2752, 2998, 3233, 3780, STALL_S];
const stallFrame: Item[] = [
  {
    id: 'partition-legs', layer: 'partition', name: '칸막이 다리', added: true, material: 'metal',
    remark: '칸막이 하부 틈을 받치는 다리다. 위치와 수량은 가정이다.',
    shapes: [...legYs.map((y) => cyl(FRONT_F, y, 13, 0, GAP)), ...legYs.map((y) => cyl(FRONT_M, y, 13, 0, GAP))],
    dims: [dim('높이', GAP, A), dim('지름', 26, A)],
  },
  {
    id: 'partition-headrail-f', layer: 'partition', name: '칸막이 상부 보강대 (여)', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(FRONT_F - 20, N_IN, FRONT_F + 20, 4024, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', 4076, A)],
  },
  {
    id: 'partition-headrail-m', layer: 'partition', name: '칸막이 상부 보강대 (남)', added: true, material: 'bronze',
    remark: '대변기 칸 전면 칸막이의 위를 잇는 보강대다. 가정이다.',
    shapes: [box(FRONT_M - 20, N_IN, FRONT_M + 20, 4024, 1950, 1990)],
    dims: [dim('단면', '40 x 40', A), dim('길이', 4076, A)],
  },
];

const doorHardware: Item[] = [
  // 경첩, 방향, 문짝 폭은 research_1f.ts 의 문과 같다.
  pullHandle('handle-entrance-f', '출입문 손잡이 (여)', 1369, 6934, 90, 1153),
  pullHandle('handle-entrance-m', '출입문 손잡이 (남)', 5839, 6930, 90, 1154),
  doorLever('handle-mop', '수채기실 문 손잡이', 2534, 5948, 180, 651),
];

/** 창틀(parts_extra.ts). 창(1/CAW)의 양 끝 X를 받는다. 틀 두께 중심은 Y −255(−290 ~ −220)다. */
const frame = (key: 'f' | 'm', x0: number, x1: number): Item =>
  windowFrame(key, (x0 + x1) / 2, -255, 90, x1 - x0, { name: `창틀 (${key === 'f' ? '여' : '남'})` });


const roomItems: Item[] = [
  frame('f', 1840, 2942),
  frame('m', C_E, 4652),
  handDryer('hand-dryer-f', W_IN, 4800, 0),
  handDryer('hand-dryer-m', E_IN, 4800, 180),
  wasteBin('waste-bin-f', 300, 5250),
  wasteBin('waste-bin-m', 6900, 5250),
  {
    id: 'mop-tap', layer: 'fixture', name: '수채기 수전', added: true, material: 'metal',
    shapes: [
      tube([[3452, 6291, 720], [3360, 6291, 720], [3338, 6291, 690]], 10),
      tube([[3410, 6291, 730], [3410, 6291, 770]], 7),
      tube([[3410, 6261, 770], [3410, 6321, 770]], 6),
    ],
    dims: [at(3410, 6291), dim('설치 높이', 720, A)],
  },
  vent('vent-mop', '환기구 (수채기실)', 3050, 5950, CH),
  vent('vent-small', '환기구 (작은 실)', 4050, 6000, CH),
  vent('vent-vestibule-f', '환기구 (여 전실)', 700, 6300, CH),
  vent('vent-vestibule-m', '환기구 (남 전실)', 6500, 6300, CH),
];

const lighting: Item[] = [
  downlight('downlight-main-f1', '매입등 (여 화장실 북)', 2300, 1500, CH, true),
  downlight('downlight-main-f2', '매입등 (여 화장실 남)', 2300, 3200, CH),
  downlight('downlight-basin-f', '매입등 (여 세면대)', 2500, 4800, CH),
  downlight('downlight-vestibule-f', '매입등 (여 전실)', 1300, 6250, CH),
  downlight('downlight-main-m1', '매입등 (남 화장실 북)', 4900, 1500, CH, true),
  downlight('downlight-main-m2', '매입등 (남 화장실 남)', 4900, 3200, CH),
  downlight('downlight-basin-m', '매입등 (남 세면대)', 4700, 4800, CH),
  downlight('downlight-vestibule-m', '매입등 (남 전실)', 5900, 6250, CH),
  {
    id: 'led-shelf-f', layer: 'light', name: '선반 하부 간접 조명 (여)', added: true, material: 'led', lamp: { power: 0.25 },
    remark: '연구동 3층과 같은 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(3135, 2390, 3155, 3850, 822, 830)],
    dims: [dim('길이', 1460, A)],
  },
  {
    id: 'led-mirror-f', layer: 'light', name: '세면대 거울 간접 조명 (여)', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '연구동 3층과 같은 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(C_W - 13, 4047, C_W, 5547, 988, 1000), box(C_W - 13, 4047, C_W, 5547, 2000, 2012)],
    dims: [dim('길이', 1500, A)],
  },
  {
    id: 'led-mirror-m', layer: 'light', name: '세면대 거울 간접 조명 (남)', added: true, material: 'led', lamp: { power: 0.35 },
    remark: '연구동 3층과 같은 간접 조명이다(작성자 제안). 도면에 없다.',
    shapes: [box(C_E, 4047, C_E + 13, 5547, 988, 1000), box(C_E, 4047, C_E + 13, 5547, 2000, 2012)],
    dims: [dim('길이', 1500, A)],
  },
];

export const research1fAdded: Item[] = [...counter, ...stallItems, ...accessibleItems, ...stallFrame, ...doorHardware, ...roomItems, ...lighting];
