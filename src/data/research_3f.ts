// 3층 연구동 화장실(여) 확대평면도 (변경후) — PDF 6페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분(300dpi 기울기 보정 이미지)을 mm로 환산했다.
// 환산식: X = (px - 1969) * 4.372, Y = (py - 958) * 4.372.
// 원점 X=0은 치수선 4,000의 서쪽 끝이다(통심 5에서 서쪽으로 100, 서측 벽 중심). Y=0은 통심 G다.
// 위쪽과 아래쪽 치수선의 서쪽 시작선이 도면에서 4.3px 다르다(1966.6 / 1970.9). 원점 x는 그 사이인 1969로 두었다.
// 그래서 가로 치수 2개(위 2,575, 아래 4,000)는 환산 오차가 11mm다. 나머지는 10mm 이내다.
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/research_3f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 research_3f_added.ts 에 있다.
// 양변기, 세면기, 수전, 배수구, 칸 문, 가방걸이, 유리선반, 코너 비드의 형상과 가정 높이(SILL, HEAD, GAP, COUNTER)는 parts.ts 에 있다.
import { COUNTER, GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet } from './parts';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2550; // 천장고. 도면 표기 CH 2,550

/** 대변기 칸. north는 칸의 북쪽 면 Y, cy는 양변기 중심 Y, hinge는 문 경첩 Y, south는 남쪽 칸막이 중심 Y다. */
export const STALLS = [
  { n: 1, north: -55, cy: 464, hinge: 739, south: 971 },
  { n: 2, north: 977, cy: 1460, hinge: 1740, south: 1967 },
  { n: 3, north: 1973, cy: 2465, hinge: 2741, south: 2969 },
];

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
    remark: '벽은 수채기실 동측 벽의 바깥 면(X 2,654)에서 끝난다. 그 동쪽은 출입문 문틀과 문이다. 출입문 상단 높이는 도면에 없다. 가정값이다.',
    shapes: [box(110, 5475, 2654, 5700, 0, CH), box(2654, 5475, 3900, 5700, HEAD, CH)],
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
    shapes: [box(2490, 5700, 2654, 5847, 0, CH), box(2490, 6547, 2654, 7600, 0, CH), box(2490, 5847, 2654, 6547, 2050, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 2575, 'drawn'), dim('두께', 164, 'scaled'), dim('문 개구 폭', 700, 'drawn'), dim('문 개구 높이', 2050, 'drawn')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    shapes: [box(-100, 7500, 2654, 7600, 0, CH)],
    dims: [dim('화장실 남측 벽 중심에서 벽 안쪽 면까지', 1900, 'drawn'), dim('두께', 100, 'scaled')],
  },
];

const gapRemark = '「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다.';

const stallPartition = (n: number, y: number): Item => ({
  id: `partition-${n}`, layer: 'partition', name: `대변기 칸막이 ${n}`, note: '12mm 지정칸막이 (H=1,950)',
  remark: gapRemark,
  shapes: [box(2490, y - PT / 2, 3900, y + PT / 2, GAP, 1950)],
  dims: [dim('칸 폭', 1000, 'drawn'), dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('하부 틈', GAP, 'assumed')],
});

const partitions: Item[] = [
  ...STALLS.map((s) => stallPartition(s.n, s.south)),
  {
    id: 'partition-front', layer: 'partition', name: '대변기 칸 전면 칸막이', note: '12mm 지정칸막이 (H=1,950)',
    remark: '도면의 「(H=1,950)」 지시선은 칸 사이 칸막이를 가리킨다. 전면 패널의 높이와 두께는 같은 것으로 가정했다. 하부 틈도 가정값이다.',
    shapes: [
      box(2484, -55, 2496, 192, GAP, 1950),
      box(2484, 730, 2496, 1229, GAP, 1950),
      box(2484, 1735, 2496, 2190, GAP, 1950),
      box(2484, 2736, 2496, 2969, GAP, 1950),
    ],
    dims: [dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('패널 위치', '선분 검출값', 'scaled'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-screen', layer: 'partition', name: '세면대 옆 가림 칸막이', note: '12mm 지정칸막이 (800x1,600)',
    remark: '도면의 선 위치(X 1,924)와 표기 치수(서측 벽면에서 1,800)가 약 14mm 다르다. 표기 치수를 따랐다.',
    shapes: [box(1904, 4675, 1916, 5475, 0, 1600)],
    dims: [dim('길이', 800, 'drawn'), dim('높이', 1600, 'drawn'), dim('두께', PT, 'drawn'), dim('서측 벽면에서의 거리', 1800, 'drawn')],
  },
  {
    id: 'partition-under-basin', layer: 'partition', name: '세면대 하부 칸막이', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에서 점선 1개(길이 약 500mm)만 판독된다. 다른 위치의 패널 유무는 도면으로 확인할 수 없다.',
    shapes: [box(122, 4880, 622, 4892, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('남측 벽면에서의 거리', 589, 'scaled')],
  },
];

const stallDoorText = {
  note: '가방걸이 설치',
  remark: '도면은 문을 안쪽으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
};

const doors: Item[] = [
  ...STALLS.map((s) => stallDoor(s.n, 2496, s.hinge, 0, 580, stallDoorText)),
  {
    id: 'door-entrance', layer: 'door', name: '출입문 3/SSD', material: 'steelDoor',
    remark: '도면은 문을 남쪽(바깥)으로 90도 연 상태로 그렸다. 서쪽 문틀(X 2,654 ~ 2,846)은 도면의 외곽만 따랐다. 안쪽 형상은 단순화했다. 문 높이는 가정값이다.',
    shapes: [
      { type: 'leaf', hx: 3830, hy: 5618, width: 1000, angleDeg: 90, thickness: 40, z0: 0, z1: HEAD },
      // 서쪽 문틀
      box(2654, 5548, 2846, 5700, 0, HEAD),
    ],
    dims: [dim('문짝 폭', 1000, 'scaled'), dim('서쪽 문틀 폭', 192, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
  {
    id: 'door-closet', layer: 'door', name: '수채기실 문 2/SD', note: '기존 점검구 도색 (700X2,050)', material: 'paintDoor',
    remark: '도면은 문을 동쪽(바깥)으로 90도 연 상태로 그렸다.',
    shapes: [{ type: 'leaf', hx: 2667, hy: 5885, width: 645, angleDeg: 0, thickness: 40, z0: 0, z1: 2050 }],
    dims: [dim('개구 폭', 700, 'drawn'), dim('높이', 2050, 'drawn'), dim('문짝 폭', 645, 'scaled')],
  },
  {
    id: 'door-inner', layer: 'door', name: '하부 두 실 사이 문', material: 'paintDoor',
    remark: '도면에 문짝과 열림 호가 그려져 있다. 문 번호와 치수 표기는 없다. 문 높이는 가정값이다.',
    shapes: [{ type: 'leaf', hx: 1465, hy: 6348, width: 540, angleDeg: 0, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 540, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
];

const fixtures: Item[] = [
  // 양변기는 동측 벽(X 3,900)에 붙어 서쪽을 본다. 평면 크기와 중심은 도면 환산값이다.
  ...STALLS.map((s) => toilet(s.n, 3900, s.cy, 180)),
  // 세면기는 남측 벽(Y 5,475)에서 320 떨어져 북쪽을 본다. 도면의 세면기 기호에 토수구 1개와 손잡이 2개가 그려져 있다.
  basin(1, 625, 5155, '남측 벽면에서 중심까지', 320),
  basin(2, 1420, 5155, '남측 벽면에서 중심까지', 320),
  faucet(1, 625, 5155, 270),
  faucet(2, 1420, 5155, 270),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 높이와 안쪽 형상은 가정값이다.',
    shapes: [
      rbox(1696, 7013, 2259, 7473, 0, 260, 30),
      { type: 'plate', x0: 1696, y0: 7013, x1: 2259, y1: 7473, z0: 260, z1: 350, r: 30, holes: [{ x0: 1751, y0: 7068, x1: 2204, y1: 7423, r: 50 }] },
      cyl(1977, 7245, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭', 563, 'scaled'), dim('깊이', 460, 'scaled'), dim('높이', 350, 'assumed')],
  },
  floorDrain('fd-main', 1779, 2168),
  floorDrain('fd-basin', 984, 4975),
];

const glassShelfText = { note: '유리선반 설치 (r=300) (기계설비공사)' };
// 가방걸이. 도면의 대변기 칸 문 3개에 기호가 그려져 있다. 문 안쪽 면(열린 상태에서 남쪽 면)에 달았다.
const stallHookText = {
  note: '가방걸이 설치',
  remark: '도면의 문 3개에 가방걸이 기호가 그려져 있다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면에 달았다.',
};

const accessories: Item[] = [
  {
    id: 'window-sill', layer: 'accessory', name: '창대석', note: 'THK20 인조대리석 창대석 설치 (W=200)', material: 'marble',
    shapes: [box(297, -205, 1792, 0, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  {
    id: 'shelf', layer: 'accessory', name: '인조대리석 선반', note: 'THK20 인조대리석 선반 설치 (하부 고정 철물)', material: 'marble',
    remark: '설치 높이는 가정값이다.',
    shapes: [box(110, 498, 320, 2024, 830, 850)],
    dims: [dim('북측 기준선에서 선반 끝까지', 2020, 'drawn'), dim('두께', 20, 'drawn'), dim('깊이', 210, 'scaled'), dim('설치 높이', 850, 'assumed')],
  },
  {
    id: 'mirror-shelf', layer: 'accessory', name: '선반 위 방습거울 (2EA)', note: 'THK.5 방습거울 (2EA) (기계설비공사)', material: 'mirror',
    facing: [1, 0],
    remark: '도면에 거울 크기 표기가 없다. 평면 위치와 길이는 서측 벽면의 굵은 선 2개를 환산한 값이다. 높이는 가정값이다.',
    shapes: [box(110, 651, 115, 1176, 950, 1850), box(110, 1351, 115, 1880, 950, 1850)],
    dims: [dim('수량', '2EA', 'drawn'), dim('1장 길이', '약 525', 'scaled'), dim('2장 사이 간격', 175, 'scaled'), dim('높이', 900, 'assumed')],
  },
  {
    id: 'mirror-full', layer: 'accessory', name: '전신 방습거울', note: 'THK.5 방습거울 (기계설비공사) (600X1,500)', material: 'mirror',
    facing: [1, 0],
    remark: '하단 높이는 가정값이다.',
    shapes: [box(110, 2772, 115, 3371, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('선반 끝에서의 거리', 750, 'drawn'), dim('하단 높이', 300, 'assumed')],
  },
  {
    id: 'mirror-basin', layer: 'accessory', name: '세면대 방습거울', note: 'THK.5 방습거울 (기계설비공사) (1,800X1,000)', material: 'mirror',
    facing: [0, -1],
    remark: '하단 높이는 가정값이다.',
    shapes: [box(110, 5470, 1904, 5475, 1000, 2000)],
    dims: [dim('폭', 1800, 'drawn'), dim('높이', 1000, 'drawn'), dim('하단 높이', 1000, 'assumed')],
  },
  {
    id: 'counter', layer: 'accessory', name: '세면대 상판', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(Y 4,877의 실선, X 110 ~ 1,904)을 환산한 값이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다. 재질은 선반과 같은 인조대리석으로 두었다.',
    shapes: [
      {
        type: 'plate', x0: 110, y0: 4877, x1: 1904, y1: 5475, z0: COUNTER - 20, z1: COUNTER,
        holes: [{ cx: 625, cy: 5155, r: 200 }, { cx: 1420, cy: 5155, r: 200 }],
      },
      // 뒷턱
      box(110, 5460, 1904, 5475, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 1794, 'scaled'), dim('깊이', 598, 'scaled'), dim('윗면 높이', COUNTER, 'assumed'), dim('두께', 20, 'assumed')],
  },
  // 유리선반은 칸의 남동 모서리에 있다. 중심 Y는 남쪽 칸막이의 북쪽 면이다.
  ...STALLS.map((s) => glassShelf(s.n, 3900, s.south - PT / 2, 180, 300, glassShelfText)),
  ...STALLS.map((s) => stallHook(s.n, 2496, s.hinge, 0, 1, 280, stallHookText)),
  {
    id: 'threshold', layer: 'accessory', name: '화강석 재료분리대', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '두께 30은 석재 두께다. 바닥 위로 드러나는 높이는 도면에 없다. 10으로 가정했다.',
    shapes: [box(2846, 5548, 3810, 5700, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 964, 'scaled'), dim('노출 높이', 10, 'assumed')],
  },
  {
    id: 'tactile-blocks', layer: 'accessory', name: '점형블럭 2EA', note: '점형블럭 2EA (매립형)', material: 'tactile',
    shapes: [box(2054, 7896, 2358, 8193, 0, 5), box(2362, 7896, 2666, 8193, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('1장 크기', '약 300 x 300', 'scaled')],
  },
  {
    id: 'braille-sign', layer: 'accessory', name: '점자표지판', note: '벽면 촉지도식 점자표지판설치', material: 'metal',
    remark: '크기와 설치 높이는 가정값이다.',
    shapes: [box(2200, 7600, 2502, 7622, 1400, 1550)],
    dims: [dim('위치', '남측 벽 바깥 면', 'scaled'), dim('폭', 302, 'scaled'), dim('설치 높이', 1400, 'assumed')],
  },
  // 코너 비드. 도면의 「코너 비드 설치」 지시선 3개가 가리키는 벽 모서리에 붙였다.
  cornerBead(1, '창 동쪽 모서리', [box(1792, -25, 1797, 5, 0, SILL - 20), box(1767, 0, 1797, 5, 0, SILL - 20), box(1792, -25, 1797, 5, HEAD, CH), box(1767, 0, 1797, 5, HEAD, CH)]),
  cornerBead(2, '기둥 남동 모서리', [box(297, 473, 302, 503, 0, CH), box(272, 498, 302, 503, 0, CH)]),
  cornerBead(3, '출입구 서쪽 모서리', [box(2629, 5470, 2659, 5475, 0, CH), box(2654, 5470, 2659, 5500, 0, CH)]),
];

const lightRemark = '도면에 손으로 적은 「조명」 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-shelf', layer: 'light', name: '조명 표시 (선반·거울 구간)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1.6 },
    shapes: [box(150, 640, 300, 1800, CH - 40, CH)],
    dims: [dim('표시 구간 길이', 1160, 'scaled')],
  },
  {
    id: 'light-west-room', layer: 'light', name: '조명 표시 (하부 서측 실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 809, cy: 6628, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-closet', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 2068, cy: 6680, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

// 마감. 도면 좌상단 「지상3층 연구동 화장실 마감 변경부분」 표와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
const finishes: Item[] = [
  {
    id: 'floor-main', layer: 'finish', name: '바닥 마감 (화장실)', material: 'floorTile',
    note: '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)',
    remark: '줄눈 위치는 도면의 타일 나누기 선(X 281, Y 77에서 600 간격)에 맞췄다. 색과 무늬는 도면에 없다. 가정이다. 평면의 주기는 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 대변기 칸 3 안(Y 약 2,590)부터 출입구까지 「+」 표시 구역이 있다. 그 구역의 주기는 「기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 마감 타일이 같아서 따로 나누지 않았다. 배수구 쪽 구배 화살표는 도면에 있다. 구배 값이 없어서 바닥은 평탄하게 그렸다. 출입문 경첩 쪽의 재료분리대 동쪽(X 3,810 ~ 3,900)은 바닥 타일로 메웠다(작성자 선택). 도면의 점묘 해치는 문짝 선에서 끝난다. 재료분리대의 가로선은 동측 벽까지 이어진다.',
    shapes: [box(110, -55, 3900, 5475, -10, 0), box(2654, 5475, 3900, 5548, -10, 0), box(3810, 5548, 3900, 5700, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('줄눈 시작점', 'X 281, Y 77', 'scaled')],
  },
  {
    id: 'floor-closet', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'smallTile',
    note: '기존 바닥 / 고와스 / THK.6 자기질 타일(200X200) 부착',
    remark: '줄눈 위치는 도면의 200 격자(X 1,677, Y 5,913에서 200 간격)에 맞췄다. 색은 도면에 없다. 가정이다.',
    shapes: [box(1460, 5700, 2490, 7500, -6, 0)],
    dims: [dim('타일 크기', '200 x 200', 'drawn'), dim('타일 두께', 6, 'drawn'), dim('줄눈 시작점', 'X 1,677, Y 5,913', 'scaled')],
  },
  {
    id: 'floor-west-room', layer: 'finish', name: '바닥 마감 (하부 서측 실)', material: 'smallTile',
    remark: '도면에 X 표시만 있다. X는 물이 빠지는 방향(바닥 구배)이다(보헤님 확인). 구배 깊이와 타일은 도면에 없다. 가정이다.',
    shapes: [{ type: 'pan', x0: 110, y0: 5700, x1: 1357, y1: 7500, z: 0, drop: 15, cx: 733, cy: 6600 }],
    dims: [dim('구배 깊이 (중앙)', 15, 'assumed'), dim('타일 크기', '200 x 200', 'assumed')],
  },
  {
    id: 'wall-finish-main', layer: 'finish', name: '벽 마감 (화장실)', material: 'wall',
    note: '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착',
    remark: '벽의 안쪽 면에 얇은 면(3mm)을 붙여 그렸다. 타일 두께 10으로 그리면 벽에 붙은 거울을 덮는다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다.',
    shapes: [
      // 서측 벽, 기둥의 남쪽 면과 동쪽 면
      box(110, 498, 113, 5475, 0, CH), box(110, 498, 297, 501, 0, CH), box(297, 0, 300, 498, 0, CH),
      // 북측 벽 (창 구간의 창대 아래와 창 위, 꺾인 면, 대변기 칸 구간)
      box(297, 0, 1792, 3, 0, SILL - 20), box(297, 0, 1792, 3, HEAD, CH), box(1792, -55, 1795, 0, 0, CH), box(1792, -55, 3900, -52, 0, CH),
      // 동측 벽
      box(3897, -55, 3900, 5548, 0, CH),
      // 남측 벽, 출입문 위, 남측 벽의 동쪽 끝면
      box(110, 5472, 2654, 5475, 0, CH), box(2654, 5472, 3900, 5475, HEAD, CH), box(2654, 5475, 2657, 5548, 0, HEAD),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'wall-finish-closet', layer: 'finish', name: '벽 마감 (수채기실)', material: 'wainscotTile',
    note: '벽체 : 도막방수(고와스, H=500) 위 THK.6 도기질타일 (H=1,200)',
    remark: '타일 크기는 도면에 없다. 200 x 200으로 가정했다. 높이 1,200 위는 도장으로 가정했다.',
    shapes: [
      box(1460, 5700, 2490, 5706, 0, 1200), box(1460, 7494, 2490, 7500, 0, 1200),
      box(1460, 5700, 1466, 6304, 0, 1200), box(1460, 6895, 1466, 7500, 0, 1200),
      box(2484, 5700, 2490, 5847, 0, 1200), box(2484, 6547, 2490, 7500, 0, 1200),
      box(1460, 5700, 2490, 5703, 1200, CH, 'paint'), box(1460, 7497, 2490, 7500, 1200, CH, 'paint'),
      box(1460, 5700, 1463, 6304, 1200, CH, 'paint'), box(1460, 6895, 1463, 7500, 1200, CH, 'paint'),
      box(2487, 5700, 2490, 5847, 1200, CH, 'paint'), box(2487, 6547, 2490, 7500, 1200, CH, 'paint'),
    ],
    dims: [dim('타일 높이', 1200, 'drawn'), dim('타일 두께', 6, 'drawn'), dim('타일 크기', '200 x 200', 'assumed')],
  },
  {
    id: 'ceiling', layer: 'finish', name: '천장 마감', material: 'ceiling',
    note: '천장 : 경량철골 천장틀위 금속재 흡음천장 (AL. 600각)',
    remark: '실내에서 볼 때만 그린다. 위에서 내려다볼 때는 그리지 않는다(보헤님 지시, 2026-11-21). 하부 두 실의 천장 마감과 높이는 도면에 없다. 화장실과 같은 것으로 가정했다. 패널 나누기 위치도 가정이다.',
    shapes: [box(-100, -358, 4100, 5700, CH, CH + 30), box(-100, 5700, 2654, 7600, CH, CH + 30)],
    dims: [dim('천장고', CH, 'drawn'), dim('패널 크기', '600 x 600', 'drawn')],
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
  // 창은 북측 벽에 있다. 자연광은 북쪽에서 남쪽으로 들어온다.
  daylightDir: [0.2, 1],
  // 도면의 타일 나누기 선에서 읽은 교점이다. 화장실 600 격자와 수채기실 200 격자다.
  tileOrigin: { floorTile: [281, 77], smallTile: [1677, 5913] },
  items: [...walls, ...partitions, ...doors, ...fixtures, ...accessories, ...lights, ...finishes],
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
    { from: [110, 4661], to: [1910, 4661], label: '1,800' },
    { from: [0, 9575], to: [1400, 9575], label: '1,400' },
    { from: [1400, 9575], to: [2575, 9575], label: '1,175' },
    { from: [2575, 9575], to: [4000, 9575], label: '1,425' },
    { from: [0, 9771], to: [4000, 9771], label: '4,000' },
    { from: [6978, 0], to: [6978, 2970], label: '2,970' },
    { from: [6978, 2970], to: [6978, 5600], label: '2,630' },
    { from: [6978, 5600], to: [6978, 7500], label: '1,900' },
    { from: [7174, 0], to: [7174, 5600], label: '5,600' },
    { from: [0, -2120], to: [100, -2120], label: '100' },
    { from: [0, 9369], to: [100, 9369], label: '100' },
  ],
  roomLabels: [{ text: '화장실(여)', at: [1508, 1535] }],
};
