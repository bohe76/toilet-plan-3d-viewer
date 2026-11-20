// 3층 연구동 화장실(여) 확대평면도 (변경후) — PDF 6페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분(300dpi 기울기 보정 이미지)을 mm로 환산했다.
// 환산식: X = (px - 1969) * 4.372, Y = (py - 958) * 4.372. 원점은 치수선 4,000과 5,600의 시작점(벽 중심선 교점)이다.
// 측정 근거와 판독 메모는 docs/drawings/research_3f_measurements.md 에 있다.
import type { Calibration, DimValue, Item, Shape, SheetModel, Source } from './types';

const CH = 2550; // 천장고. 도면 표기 CH 2,550
const SILL = 1200; // 창대 높이. 도면에 없다. 가정
const HEAD = 2100; // 창·문 상단 높이. 도면에 없다. 가정
const PT = 12; // 칸막이 두께. 도면 표기 12mm

const box = (x0: number, y0: number, x1: number, y1: number, z0: number, z1: number): Shape => ({
  type: 'box', x0, y0, x1, y1, z0, z1,
});
const dim = (label: string, value: number | string, source: Source): DimValue => ({
  label,
  value: typeof value === 'number' ? value.toLocaleString('en-US') : value,
  source,
});

const walls: Item[] = [
  {
    id: 'wall-column', layer: 'wall', name: '기둥 (북서 모서리)',
    shapes: [box(-100, -358, 297, 498, 0, CH)],
    dims: [dim('폭', 397, 'scaled'), dim('깊이', 856, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-north-window', layer: 'wall', name: '북측 벽 (창 구간)',
    remark: '창대 높이와 창 상단 높이는 도면에 없다. 가정값이다.',
    shapes: [box(297, -358, 1792, 0, 0, SILL - 20), box(297, -358, 1792, 0, HEAD, CH)],
    dims: [dim('창 구간 길이', 1495, 'scaled'), dim('창대 높이', SILL, 'assumed'), dim('창 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'window', layer: 'wall', name: '창호 2/CAW', material: 'glass',
    shapes: [box(297, -265, 1792, -245, SILL, HEAD)],
    dims: [dim('폭', 1495, 'scaled'), dim('높이', HEAD - SILL, 'assumed')],
  },
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽 (대변기 칸 구간)',
    shapes: [box(1792, -358, 4100, -55, 0, CH)],
    dims: [dim('두께', 303, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽',
    shapes: [box(3900, -55, 4100, 7310, 0, CH)],
    dims: [dim('서측 벽 중심에서 동측 벽 중심까지', 4000, 'drawn'), dim('두께', 200, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽',
    shapes: [box(-100, 498, 110, 7600, 0, CH)],
    dims: [dim('두께', 210, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-mid', layer: 'wall', name: '화장실 남측 벽',
    remark: '출입문 상단 높이는 도면에 없다. 가정값이다.',
    shapes: [box(110, 5475, 2800, 5700, 0, CH), box(2800, 5475, 3900, 5700, HEAD, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', 5600, 'drawn'), dim('두께', 225, 'scaled'), dim('출입문 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'wall-inner', layer: 'wall', name: '하부 두 실 사이 벽',
    remark: '서쪽 실은 도면에 실명이 없다. 문 높이는 가정값이다.',
    shapes: [box(1357, 5700, 1460, 6304, 0, CH), box(1357, 6895, 1460, 7500, 0, CH), box(1357, 6304, 1460, 6895, HEAD, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 1400, 'drawn'), dim('두께', 103, 'scaled'), dim('문 개구 폭', 591, 'scaled')],
  },
  {
    id: 'wall-closet-east', layer: 'wall', name: '수채기실 동측 벽', note: '타일 덧대기(적층) (THK 50)',
    shapes: [box(2490, 5700, 2654, 5854, 0, CH), box(2490, 6540, 2654, 7600, 0, CH), box(2490, 5854, 2654, 6540, 2050, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 2575, 'drawn'), dim('두께', 164, 'scaled'), dim('문 개구 폭', 686, 'scaled'), dim('문 개구 높이', 2050, 'drawn')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    shapes: [box(-100, 7500, 2654, 7600, 0, CH)],
    dims: [dim('화장실 남측 벽 중심에서 벽 안쪽 면까지', 1900, 'drawn'), dim('두께', 100, 'scaled')],
  },
];

const stallPartition = (n: number, y: number): Item => ({
  id: `partition-${n}`, layer: 'partition', name: `대변기 칸막이 ${n}`, note: '12mm 지정칸막이 (H=1,950)',
  shapes: [box(2490, y - PT / 2, 3900, y + PT / 2, 0, 1950)],
  dims: [dim('칸 폭', 1000, 'drawn'), dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn')],
});

const partitions: Item[] = [
  stallPartition(1, 971),
  stallPartition(2, 1967),
  stallPartition(3, 2969),
  {
    id: 'partition-front', layer: 'partition', name: '대변기 칸 전면 칸막이', note: '12mm 지정칸막이 (H=1,950)',
    shapes: [
      box(2484, -55, 2496, 192, 0, 1950),
      box(2484, 730, 2496, 1229, 0, 1950),
      box(2484, 1735, 2496, 2190, 0, 1950),
      box(2484, 2736, 2496, 2969, 0, 1950),
    ],
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('패널 위치', '선분 검출값', 'scaled')],
  },
  {
    id: 'partition-screen', layer: 'partition', name: '세면대 옆 가림 칸막이', note: '12mm 지정칸막이 (800x1,600)',
    shapes: [box(1918, 4670, 1930, 5475, 0, 1600)],
    dims: [dim('길이', 800, 'drawn'), dim('높이', 1600, 'drawn'), dim('두께', PT, 'drawn'), dim('서측 벽면에서의 거리', 1800, 'drawn')],
  },
  {
    id: 'partition-under-basin', layer: 'partition', name: '세면대 하부 칸막이', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에서 점선 1개(길이 약 510mm)만 판독된다. 다른 위치의 패널 유무는 도면으로 확인할 수 없다.',
    shapes: [box(122, 4873, 634, 4885, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('남측 벽면에서의 거리', 596, 'scaled')],
  },
];

const stallDoor = (n: number, hy: number): Item => ({
  id: `door-stall-${n}`, layer: 'door', name: `대변기 칸 ${n} 문`, note: '가방걸이 설치',
  remark: '도면은 문을 안쪽으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 문 높이는 칸막이 높이를 따랐다.',
  shapes: [{ type: 'leaf', hx: 2496, hy, width: 580, angleDeg: 0, thickness: PT, z0: 0, z1: 1950 }],
  dims: [dim('문짝 폭', 580, 'scaled'), dim('높이', 1950, 'assumed')],
});

const doors: Item[] = [
  stallDoor(1, 739),
  stallDoor(2, 1740),
  stallDoor(3, 2741),
  {
    id: 'door-entrance', layer: 'door', name: '출입문 3/SSD',
    remark: '도면은 문을 남쪽(바깥)으로 90도 연 상태로 그렸다. 문 높이는 가정값이다.',
    shapes: [{ type: 'leaf', hx: 3850, hy: 5620, width: 1000, angleDeg: 90, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 1000, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
  {
    id: 'door-closet', layer: 'door', name: '수채기실 문 2/SD', note: '기존 점검구 도색 (700X2,050)',
    remark: '도면은 문을 동쪽(바깥)으로 90도 연 상태로 그렸다.',
    shapes: [{ type: 'leaf', hx: 2667, hy: 5893, width: 645, angleDeg: 0, thickness: 40, z0: 0, z1: 2050 }],
    dims: [dim('개구 폭', 700, 'drawn'), dim('높이', 2050, 'drawn'), dim('문짝 폭', 645, 'scaled')],
  },
  {
    id: 'door-inner', layer: 'door', name: '하부 두 실 사이 문',
    remark: '도면에 문 기호와 치수 표기가 없다. 문 높이는 가정값이다.',
    shapes: [{ type: 'leaf', hx: 1465, hy: 6348, width: 540, angleDeg: 0, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 540, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
];

const toilet = (n: number, cy: number): Item => ({
  id: `toilet-${n}`, layer: 'fixture', name: `양변기 ${n}`,
  remark: '평면 크기는 도면 축척 환산값이다. 높이는 가정값이다.',
  shapes: [
    box(3710, cy - 185, 3900, cy + 185, 0, 780),
    { type: 'cylinder', cx: 3435, cy, rx: 275, ry: 185, z0: 0, z1: 400 },
  ],
  dims: [dim('길이', 740, 'scaled'), dim('폭', 370, 'scaled'), dim('좌면 높이', 400, 'assumed'), dim('탱크 높이', 780, 'assumed')],
});

const basin = (n: number, cx: number): Item => ({
  id: `basin-${n}`, layer: 'fixture', name: `세면기 ${n}`,
  remark: '상단 높이는 가정값이다.',
  shapes: [{ type: 'cylinder', cx, cy: 5133, rx: 215, ry: 215, z0: 620, z1: 800 }],
  dims: [dim('지름', 430, 'scaled'), dim('남측 벽면에서 중심까지', 342, 'scaled'), dim('상단 높이', 800, 'assumed')],
});

const floorDrain = (id: string, cx: number, cy: number): Item => ({
  id, layer: 'fixture', name: '바닥 배수구', note: 'Ø75 F.D', material: 'metal',
  shapes: [box(cx - 75, cy - 75, cx + 75, cy + 75, 0, 6)],
  dims: [dim('관경', 'Ø75', 'drawn'), dim('위치', '선분 검출값', 'scaled')],
});

const fixtures: Item[] = [
  toilet(1, 470),
  toilet(2, 1460),
  toilet(3, 2455),
  basin(1, 625),
  basin(2, 1420),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '높이는 가정값이다.',
    shapes: [box(1696, 7013, 2259, 7459, 0, 350)],
    dims: [dim('폭', 563, 'scaled'), dim('깊이', 446, 'scaled'), dim('높이', 350, 'assumed')],
  },
  floorDrain('fd-main', 1779, 2168),
  floorDrain('fd-basin', 984, 4975),
];

const glassShelf = (n: number, cy: number): Item => ({
  id: `glass-shelf-${n}`, layer: 'accessory', name: `유리선반 ${n}`, note: '유리선반 설치 (r=300) (기계설비공사)', material: 'glass',
  remark: '설치 높이는 가정값이다.',
  shapes: [{ type: 'quarter', cx: 3900, cy, r: 300, startDeg: 180, z0: 1000, z1: 1008 }],
  dims: [dim('반지름', 300, 'drawn'), dim('설치 높이', 1000, 'assumed')],
});

const accessories: Item[] = [
  {
    id: 'window-sill', layer: 'accessory', name: '창대석', note: 'THK20 인조대리석 창대석 설치 (W=200)',
    shapes: [box(297, -205, 1792, 0, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  {
    id: 'shelf', layer: 'accessory', name: '인조대리석 선반', note: 'THK20 인조대리석 선반 설치 (하부 고정 철물)',
    remark: '설치 높이는 가정값이다.',
    shapes: [box(110, 498, 320, 2024, 830, 850)],
    dims: [dim('북측 기준선에서 선반 끝까지', 2020, 'drawn'), dim('두께', 20, 'drawn'), dim('깊이', 210, 'scaled'), dim('설치 높이', 850, 'assumed')],
  },
  {
    id: 'mirror-shelf', layer: 'accessory', name: '선반 위 방습거울 (2EA)', note: 'THK.5 방습거울 (2EA) (기계설비공사)', material: 'mirror',
    remark: '도면에 거울 크기가 없다. 2장의 분할 위치와 높이는 가정값이다.',
    shapes: [box(110, 520, 116, 1272, 950, 1850), box(110, 1282, 116, 2033, 950, 1850)],
    dims: [dim('수량', '2EA', 'drawn'), dim('전체 길이', 1513, 'scaled'), dim('높이', 900, 'assumed')],
  },
  {
    id: 'mirror-full', layer: 'accessory', name: '전신 방습거울', note: 'THK.5 방습거울 (기계설비공사) (600X1,500)', material: 'mirror',
    remark: '하단 높이는 가정값이다.',
    shapes: [box(110, 2772, 116, 3371, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('선반 끝에서의 거리', 750, 'drawn'), dim('하단 높이', 300, 'assumed')],
  },
  {
    id: 'mirror-basin', layer: 'accessory', name: '세면대 방습거울', note: 'THK.5 방습거울 (기계설비공사) (1,800X1,000)', material: 'mirror',
    remark: '하단 높이는 가정값이다.',
    shapes: [box(110, 5469, 1918, 5475, 1000, 2000)],
    dims: [dim('폭', 1800, 'drawn'), dim('높이', 1000, 'drawn'), dim('하단 높이', 1000, 'assumed')],
  },
  glassShelf(1, 965),
  glassShelf(2, 1961),
  glassShelf(3, 2963),
  {
    id: 'threshold', layer: 'accessory', name: '화강석 재료분리대', note: 'THK30 화강석 재료분리대 설치 (W=150)',
    shapes: [box(2800, 5548, 3900, 5700, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 1100, 'scaled')],
  },
  {
    id: 'tactile-blocks', layer: 'accessory', name: '점형블럭 2EA', note: '점형블럭 2EA (매립형)', material: 'tactile',
    shapes: [box(2054, 7896, 2358, 8193, 0, 5), box(2362, 7896, 2666, 8193, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('1장 크기', '약 300 x 300', 'scaled')],
  },
  {
    id: 'braille-sign', layer: 'accessory', name: '점자표지판', note: '벽면 촉지도식 점자표지판설치', material: 'metal',
    remark: '크기와 설치 높이는 가정값이다.',
    shapes: [box(2200, 7600, 2305, 7612, 1400, 1550)],
    dims: [dim('위치', '남측 벽 바깥 면', 'scaled'), dim('설치 높이', 1400, 'assumed')],
  },
];

const lightRemark = '도면에 손으로 적은 「조명」 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다.';

const lights: Item[] = [
  {
    id: 'light-shelf', layer: 'light', name: '조명 표시 (선반·거울 구간)', note: '손글씨 「조명」', remark: lightRemark,
    shapes: [box(150, 640, 300, 1800, CH - 40, CH)],
    dims: [dim('표시 구간 길이', 1160, 'scaled')],
  },
  {
    id: 'light-west-room', layer: 'light', name: '조명 표시 (하부 서측 실)', note: '손글씨 「조명」', remark: lightRemark,
    shapes: [{ type: 'cylinder', cx: 809, cy: 6628, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-closet', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    shapes: [{ type: 'cylinder', cx: 2077, cy: 6663, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

export const research3fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1969, 958],
  mmPerPx: 4.372,
};

export const research3fModel: SheetModel = {
  ceilingHeight: CH,
  bounds: { x0: -100, y0: -358, x1: 4100, y1: 7600 },
  eye: { from: [3300, 5150, 1600], to: [1300, 1500, 1100] },
  // 북서쪽에서 본다. 동측 벽의 변기와 남측 벽의 세면기가 벽에 가리지 않는다.
  isoDir: [-1, -1],
  items: [...walls, ...partitions, ...doors, ...fixtures, ...accessories, ...lights],
  // 치수선 위치는 도면의 치수선 위치와 같다.
  dimLines: [
    { from: [0, -2518], to: [4000, -2518], label: '4,000' },
    { from: [0, -2317], to: [2575, -2317], label: '2,575' },
    { from: [2575, -2317], to: [4000, -2317], label: '1,425' },
    { from: [-3069, 0], to: [-3069, 5600], label: '5,600' },
    { from: [-2864, 0], to: [-2864, 2020], label: '2,020' },
    { from: [-2864, 2020], to: [-2864, 5600], label: '3,580' },
    { from: [-2864, 5600], to: [-2864, 7500], label: '1,900' },
    { from: [-2667, 2020], to: [-2667, 2770], label: '750' },
    { from: [-2667, 2770], to: [-2667, 3370], label: '600' },
    { from: [-2667, 3370], to: [-2667, 5600], label: '2,230' },
    { from: [2212, -30], to: [2212, 970], label: '1,000' },
    { from: [2212, 970], to: [2212, 1970], label: '1,000' },
    { from: [2212, 1970], to: [2212, 2970], label: '1,000' },
    { from: [2500, 3235], to: [3900, 3235], label: '1,400' },
    { from: [110, 4661], to: [1924, 4661], label: '1,800' },
    { from: [0, 9575], to: [1400, 9575], label: '1,400' },
    { from: [1400, 9575], to: [2575, 9575], label: '1,175' },
    { from: [2575, 9575], to: [4000, 9575], label: '1,425' },
  ],
  roomLabels: [{ text: '화장실(여)', at: [1508, 1535] }],
};
