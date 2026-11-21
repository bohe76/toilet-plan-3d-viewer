// 5층 연구동 화장실 확대평면도 (변경후) — PDF 8페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분과 work/verify/p8/scan.py 의 주사선 판독값(300dpi 기울기 보정 이미지)을 mm로 환산했다.
// 환산식: X = (px - 1971.2) * 4.37, Y = (py - 962.7) * 4.37.
// 원점 X=0은 치수선 4,000의 서쪽 끝이다(통심 5에서 서쪽으로 100, 서측 벽 중심). Y=0은 통심 G다.
// 축척 4.37은 세로 5,600(1,281px, 좌우 같음)과 평면 중간 높이의 가로 4,000(약 916px)에서 구했다.
// 이 장은 스캔이 사다리꼴로 틀어져 있다. 위쪽 4,000은 918.7px, 아래쪽 4,000은 913.0px다. 서측 보조선은 위에서 아래로 8.6px, 동측은 2.9px 밀린다.
// 그래서 위쪽 4,000(+15), 아래쪽 1,400(-11), 아래쪽 4,000(-10)은 환산 오차가 10mm를 넘는다. 원점은 평면 중간 높이(py 약 1,800)에 맞췄다.
// 서측 벽선은 평면 위쪽과 아래쪽에서 이 원점 기준으로 약 ±3px(±13mm) 기운다. 모델의 벽은 곧게 두었다.
// 벽 안쪽에 굵은 선(구조 면)과 가는 선(마감 면으로 본다)이 15~17mm 간격으로 나란히 그려져 있다. 벽 상자는 굵은 선에 맞췄다.
// 표기 치수 1,000(대변기 칸), 1,400(칸 깊이), 1,800(세면대)은 가는 선에서 잰 것이다. 그 치수로 정한 위치는 가는 선을 기준으로 두었다.
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/research_5f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 research_5f_added.ts 에 있다.
// 양변기, 세면기, 수전, 배수구, 칸 문, 가방걸이, 유리선반, 코너 비드의 형상과 가정 높이(SILL, HEAD, GAP)는 parts.ts 에 있다.
import { GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet } from './parts';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2450; // 천장고. 도면 표기 CH 2,450 (평면 안 2곳)

/** 벽의 굵은 선(구조 면) 위치. 축척 환산값이다. */
export const WALL = { west: 102, east: 3895, north: -62, south: 5492 };
/** 세면기 반지름. 도면 기호의 환산값(지름 약 450)이다. */
export const BASIN_R = 225;
/** 양변기 탱크 뒤 면. 동측 벽 굵은 선에서 벽 마감 3mm 안쪽이다. */
export const TOILET_X = WALL.east - 3;

/** 대변기 칸. north는 칸의 북쪽 면 Y, cy는 양변기 중심 Y, hinge는 문 경첩 Y, south는 남쪽 칸막이 중심 Y다. */
export const STALLS = [
  { n: 1, north: WALL.north, cy: 461, hinge: 736, south: 962 },
  { n: 2, north: 968, cy: 1461, hinge: 1739, south: 1962 },
  { n: 3, north: 1968, cy: 2464, hinge: 2737, south: 2962 },
];

const walls: Item[] = [
  {
    id: 'wall-column', layer: 'wall', name: '기둥 (북서 모서리)',
    remark: '기둥 북쪽의 서쪽 돌출부(X -265 ~ -106)도 도면 외곽선대로 넣었다.',
    shapes: [box(-106, -359, 288, 500, 0, CH), box(-265, -359, -106, -51, 0, CH)],
    dims: [dim('폭', 394, 'scaled'), dim('깊이', 859, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-north-window', layer: 'wall', name: '북측 벽 (창 구간)',
    remark: '창대 높이와 창 상단 높이는 도면에 없다. 가정값이다. 벽 안쪽 끝은 창대석 안쪽 끝 선(Y -7)이다.',
    shapes: [box(288, -359, 1784, -7, 0, SILL - 20), box(288, -359, 1784, -7, HEAD, CH)],
    dims: [dim('창 구간 길이', 1496, 'scaled'), dim('창대 높이', SILL, 'assumed'), dim('창 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'window', layer: 'wall', name: '창호 2/CAW', material: 'glass',
    shapes: [box(288, -266, 1784, -246, SILL, HEAD)],
    dims: [dim('폭', 1496, 'scaled'), dim('높이', HEAD - SILL, 'assumed')],
  },
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽 (대변기 칸 구간)',
    remark: '벽 안쪽에 굵은 선(Y -62)과 가는 선(Y -38)이 있다. 벽은 굵은 선까지 그렸다.',
    shapes: [box(1784, -359, 4247, WALL.north, 0, CH)],
    dims: [dim('두께', 297, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-ne-corner', layer: 'wall', name: '북동 모서리 벽체 (실 밖)',
    remark: '동측 벽 바깥의 꺾인 벽체다. 도면 외곽선대로 넣었다. 그 동쪽으로 이어지는 창과 벽은 이 실 밖이라서 넣지 않았다.',
    shapes: [box(4096, WALL.north, 4247, 43, 0, CH), box(4096, 43, 4493, 395, 0, CH)],
    dims: [dim('외곽', '선분 검출값', 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽',
    remark: '벽 안쪽에 굵은 선(X 3,895)과 가는 선(X 3,882)이 있다. 벽은 굵은 선까지 그렸다. 벽 중심은 X 약 3,996이다.',
    shapes: [box(WALL.east, WALL.north, 4096, 7291, 0, CH)],
    dims: [dim('서측 벽 중심에서 동측 벽 중심까지', 4000, 'drawn'), dim('두께', 201, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽',
    remark: '벽 안쪽에 굵은 선(X 102)과 가는 선(X 118)이 있다. 벽은 굵은 선까지 그렸다. 남쪽 끝(Y 7,395 아래)은 바깥 면이 X -187로 꺾여 두꺼워진다. 그 서쪽의 문틀(X 약 -257 ~ -187)은 이웃 실의 것이라서 넣지 않았다.',
    shapes: [box(-106, 500, WALL.west, 7596, 0, CH), box(-187, 7395, -106, 7596, 0, CH)],
    dims: [dim('두께', 208, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-mid', layer: 'wall', name: '화장실 남측 벽',
    remark: '벽은 수채기실 동측 벽의 바깥 면(X 2,652)에서 끝난다. 그 동쪽은 출입문 문틀과 문이다. 벽 북쪽 면에도 가는 선(Y 5,473)이 있다. 출입문 상단 높이는 도면에 없다. 가정값이다.',
    shapes: [box(WALL.west, WALL.south, 2652, 5695, 0, CH), box(2652, WALL.south, WALL.east, 5695, HEAD, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', 5600, 'drawn'), dim('두께', 203, 'scaled'), dim('출입문 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'wall-inner', layer: 'wall', name: '하부 두 실 사이 벽',
    remark: '서쪽 실은 도면에 실명이 없다. 문 높이는 가정값이다.',
    shapes: [box(1347, 5695, 1450, 6302, 0, CH), box(1347, 6892, 1450, 7496, 0, CH), box(1347, 6302, 1450, 6892, HEAD, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 1400, 'drawn'), dim('두께', 103, 'scaled'), dim('문 개구 폭', 590, 'scaled')],
  },
  {
    id: 'wall-closet-east', layer: 'wall', name: '수채기실 동측 벽', note: '타일 덧대기(적층) (THK 50)',
    remark: '주기의 지시선은 수채기실 문틀 안쪽을 가리킨다. 문틀 범위(X 2,486 ~ 2,656)는 벽과 같은 상자로 단순화했다.',
    shapes: [box(2505, 5695, 2654, 5841, 0, CH), box(2505, 6541, 2654, 7496, 0, CH), box(2505, 5841, 2654, 6541, 2050, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 2575, 'drawn'), dim('두께', 149, 'scaled'), dim('문 개구 폭', 700, 'drawn'), dim('문 개구 높이', 2050, 'drawn')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    shapes: [box(-106, 7496, 2654, 7596, 0, CH)],
    dims: [dim('화장실 남측 벽 중심에서 벽 안쪽 면까지', 1900, 'drawn'), dim('두께', 100, 'scaled')],
  },
];

const gapRemark = '「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다.';

const stallPartition = (n: number, y: number): Item => ({
  id: `partition-${n}`, layer: 'partition', name: `대변기 칸막이 ${n}`, note: '12mm 지정칸막이 (H=1,950)',
  remark: `${gapRemark} 칸 폭 1,000은 북측 벽의 가는 선(Y -38)에서 잰 표기 치수를 따랐다. 선 위치와의 차이는 4mm 이내다.`,
  shapes: [box(2482, y - PT / 2, WALL.east, y + PT / 2, GAP, 1950)],
  dims: [dim('칸 폭', 1000, 'drawn'), dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('하부 틈', GAP, 'assumed')],
});

const partitions: Item[] = [
  ...STALLS.map((s) => stallPartition(s.n, s.south)),
  {
    id: 'partition-front', layer: 'partition', name: '대변기 칸 전면 칸막이', note: '12mm 지정칸막이 (H=1,950)',
    remark: '도면의 「(H=1,950)」 지시선은 칸 사이 칸막이를 가리킨다. 전면 패널의 높이와 두께는 같은 것으로 가정했다. 하부 틈도 가정값이다. 패널 중심 X 2,482는 동측 벽 가는 선(X 3,882)에서 표기 치수 1,400을 뺀 값이다(선 위치 X 2,481).',
    shapes: [
      box(2476, WALL.north, 2488, 185, GAP, 1950),
      box(2476, 731, 2488, 1196, GAP, 1950),
      box(2476, 1734, 2488, 2193, GAP, 1950),
      box(2476, 2733, 2488, 2968, GAP, 1950),
    ],
    dims: [dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('패널 위치', '선분 검출값', 'scaled'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-screen', layer: 'partition', name: '세면대 옆 가림 칸막이', note: '12mm 지정칸막이 (800x1,600)',
    remark: '중심 X 1,918은 서측 벽 가는 선(X 118)에서 표기 치수 1,800을 더한 값이다(선 위치 X 1,924). 길이 800은 남측 벽 가는 선(Y 5,473)에서 잰 표기 치수다. 북쪽 끝은 Y 4,673이다(도면 패널 선의 북쪽 끝 Y 약 4,662). 그 위의 2px 선과 화살표는 주기 지시선이다. 패널은 벽의 굵은 선(Y 5,492)까지 그렸다.',
    shapes: [box(1912, 5473 - 800, 1924, WALL.south, 0, 1600)],
    dims: [dim('길이', 800, 'drawn'), dim('높이', 1600, 'drawn'), dim('두께', PT, 'drawn'), dim('서측 벽 가는 선에서의 거리', 1800, 'drawn')],
  },
  {
    id: 'partition-under-basin', layer: 'partition', name: '세면대 하부 칸막이', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에서 서쪽 끝의 점선 1개(X 약 126 ~ 619)만 판독된다. 길이는 표기 치수 500을 따랐다. 다른 위치의 패널 유무는 도면으로 확인할 수 없다.',
    shapes: [box(125, 4876, 625, 4888, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('남측 벽면에서의 거리', 610, 'scaled')],
  },
];

const stallDoorText = {
  remark: '도면은 문을 안쪽(동쪽)으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 문짝 폭 566은 문짝 선(전면 패널 동쪽 면 X 2,488 ~ 끝 X 3,054)의 환산값이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
};

const doors: Item[] = [
  ...STALLS.map((s) => stallDoor(s.n, 2488, s.hinge, 0, 566, stallDoorText)),
  {
    id: 'door-entrance', layer: 'door', name: '출입문 3/SSD', material: 'steelDoor',
    remark: '도면은 문을 남쪽(바깥)으로 90도 연 상태로 그렸다. 경첩은 동쪽이다. 서쪽 문틀(X 2,652 ~ 2,853)은 도면의 외곽만 따랐다. 안쪽 형상은 단순화했다. 문 높이는 가정값이다.',
    shapes: [
      { type: 'leaf', hx: 3834, hy: 5618, width: 1000, angleDeg: 90, thickness: 40, z0: 0, z1: HEAD },
      // 서쪽 문틀
      box(2652, 5541, 2853, 5695, 0, HEAD),
    ],
    dims: [dim('문짝 폭', 1000, 'scaled'), dim('서쪽 문틀 폭', 201, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
  {
    id: 'door-closet', layer: 'door', name: '수채기실 문 2/SD', note: '기존 점검구 도색 (700X2,050)', material: 'paintDoor',
    remark: '도면은 문을 동쪽(바깥)으로 90도 연 상태로 그렸다. 경첩은 북쪽이다.',
    shapes: [{ type: 'leaf', hx: 2667, hy: 5885, width: 645, angleDeg: 0, thickness: 40, z0: 0, z1: 2050 }],
    dims: [dim('개구 폭', 700, 'drawn'), dim('높이', 2050, 'drawn'), dim('문짝 폭', 645, 'scaled')],
  },
  {
    id: 'door-inner', layer: 'door', name: '하부 두 실 사이 문', material: 'paintDoor',
    remark: '도면에 문짝과 열림 호가 그려져 있다. 수채기실 쪽(동쪽)으로 90도 연 상태다. 문 번호와 치수 표기는 없다. 문 높이는 가정값이다.',
    shapes: [{ type: 'leaf', hx: 1462, hy: 6340, width: 550, angleDeg: 0, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 550, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
];

const fixtures: Item[] = [
  // 양변기는 동측 벽에 붙어 서쪽을 본다. 도면의 탱크 뒤 면은 가는 선(X 3,882)에 닿는다. 모델은 벽 마감 면(X 3,892)에 붙였다.
  ...STALLS.map((s) => toilet(s.n, TOILET_X, s.cy, 180)),
  // 세면기는 남측 벽(Y 5,492)에서 334 떨어져 북쪽을 본다. 도면의 세면기 기호에 토수구 1개와 손잡이 2개가 그려져 있다.
  basin(1, 626, 5158, '남측 벽면에서 중심까지', 334, BASIN_R),
  basin(2, 1415, 5158, '남측 벽면에서 중심까지', 334, BASIN_R),
  faucet(1, 626, 5158, 270, BASIN_R),
  faucet(2, 1415, 5158, 270, BASIN_R),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 높이와 안쪽 형상은 가정값이다.',
    shapes: [
      rbox(1693, 7009, 2261, 7470, 0, 260, 30),
      { type: 'plate', x0: 1693, y0: 7009, x1: 2261, y1: 7470, z0: 260, z1: 350, r: 30, holes: [{ x0: 1745, y0: 7061, x1: 2208, y1: 7419, r: 50 }] },
      cyl(1977, 7240, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭', 568, 'scaled'), dim('깊이', 461, 'scaled'), dim('높이', 350, 'assumed')],
  },
  floorDrain('fd-main', 1772, 2174),
  floorDrain('fd-basin', 979, 4975),
];

const glassShelfText = { note: '유리선반 설치 (r=300) (기계설비공사)' };
// 가방걸이. 도면의 대변기 칸 문 3개에 기호가 그려져 있다. 문 안쪽 면(열린 상태에서 남쪽 면)에 달았다.
const stallHookText = {
  note: '가방걸이 설치',
  remark: '도면의 문 3개에 가방걸이 기호가 그려져 있다. 주기의 지시선은 칸 1의 기호를 가리킨다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면에 달았다.',
};

const accessories: Item[] = [
  {
    id: 'window-sill', layer: 'accessory', name: '창대석', note: 'THK20 인조대리석 창대석 설치 (W=200)', material: 'marble',
    shapes: [box(288, -207, 1784, -7, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  {
    id: 'shelf', layer: 'accessory', name: '인조대리석 선반', note: 'THK20 인조대리석 선반 설치 (하부 고정 철물)', material: 'marble',
    remark: '이 장에는 선반 끝의 치수 표기가 없다. 범위(Y 521 ~ 2,017)와 깊이는 선분 환산값이다. 설치 높이는 가정값이다.',
    shapes: [box(WALL.west, 521, 312, 2017, 830, 850)],
    dims: [dim('선반 남쪽 끝 Y', 2017, 'scaled'), dim('두께', 20, 'drawn'), dim('깊이', 210, 'scaled'), dim('설치 높이', 850, 'assumed')],
  },
  {
    id: 'mirror-shelf', layer: 'accessory', name: '선반 위 방습거울 (2EA)', note: 'THK.5 방습거울 (2EA) (기계설비공사)', material: 'mirror',
    facing: [1, 0],
    remark: '도면에 거울 크기 표기가 없다. 평면 위치와 길이는 서측 벽면의 굵은 선 2토막을 빨강 채널로 읽은 값이다(형광펜에 가려 있다). 벽 마감 면에 붙였다. 높이는 가정값이다.',
    shapes: [box(WALL.west + 3, 661, WALL.west + 8, 1181, 950, 1850), box(WALL.west + 3, 1360, WALL.west + 8, 1880, 950, 1850)],
    dims: [dim('수량', '2EA', 'drawn'), dim('1장 길이', '약 520', 'scaled'), dim('2장 사이 간격', 179, 'scaled'), dim('높이', 900, 'assumed')],
  },
  {
    id: 'mirror-full', layer: 'accessory', name: '전신 방습거울', note: 'THK.5 방습거울 (기계설비공사) (600X1,500)', material: 'mirror',
    facing: [1, 0],
    remark: '이 장에는 거울 위치의 치수 표기가 없다. 위치(Y 2,766 ~ 3,366)는 서측 벽면의 굵은 선(594 길이)을 환산하고 표기 폭 600에 맞춘 값이다. 하단 높이는 가정값이다.',
    shapes: [box(WALL.west + 3, 2766, WALL.west + 8, 3366, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('위치 (Y)', '2,766 ~ 3,366', 'scaled'), dim('하단 높이', 300, 'assumed')],
  },
  {
    id: 'mirror-basin', layer: 'accessory', name: '세면대 방습거울', note: 'THK.5 방습거울 (기계설비공사) (1,800X1,000)', material: 'mirror',
    facing: [0, -1],
    remark: '가림 칸막이 서쪽 면에서 서쪽으로 1,800을 그렸다. 하단 높이는 가정값이다.',
    shapes: [box(112, WALL.south - 8, 1912, WALL.south - 3, 1000, 2000)],
    dims: [dim('폭', 1800, 'drawn'), dim('높이', 1000, 'drawn'), dim('하단 높이', 1000, 'assumed')],
  },
  // 유리선반은 칸의 남동 모서리에 있다. 중심 Y는 남쪽 칸막이의 북쪽 면이다.
  ...STALLS.map((s) => glassShelf(s.n, TOILET_X, s.south - PT / 2, 180, 300, glassShelfText)),
  ...STALLS.map((s) => stallHook(s.n, 2488, s.hinge, 0, 1, 276, stallHookText)),
  {
    id: 'threshold', layer: 'accessory', name: '화강석 재료분리대', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치(서쪽 문틀 동쪽 면 X 2,853 ~ 출입문 문짝 서쪽 면 X 3,814)다. 두께 30은 석재 두께다. 바닥 위로 드러나는 높이는 도면에 없다. 10으로 가정했다.',
    shapes: [box(2853, 5541, 3814, 5691, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 961, 'scaled'), dim('노출 높이', 10, 'assumed')],
  },
  {
    id: 'tactile-blocks', layer: 'accessory', name: '점형블럭 2EA', note: '점형블럭 2EA (매립형)', material: 'tactile',
    shapes: [box(2057, 7889, 2355, 8191, 0, 5), box(2359, 7889, 2658, 8191, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('1장 크기', '약 300 x 300', 'scaled')],
  },
  {
    id: 'braille-sign', layer: 'accessory', name: '점자표지판', note: '벽면 촉지도식 점자표지판설치', material: 'metal',
    remark: '크기와 설치 높이는 가정값이다. 평면 폭과 두께는 남측 벽 바깥 면의 굵은 막대를 환산한 값이다.',
    shapes: [box(2208, 7596, 2508, 7614, 1400, 1550)],
    dims: [dim('위치', '남측 벽 바깥 면', 'scaled'), dim('폭', 300, 'scaled'), dim('설치 높이', 1400, 'assumed')],
  },
  // 코너 비드. 도면의 「코너 비드 설치」 지시선 3개가 가리키는 벽 모서리에 붙였다.
  cornerBead(1, '창 동쪽 모서리', [box(1784, -32, 1789, -2, 0, SILL - 20), box(1759, -7, 1789, -2, 0, SILL - 20), box(1784, -32, 1789, -2, HEAD, CH), box(1759, -7, 1789, -2, HEAD, CH)]),
  cornerBead(2, '기둥 남동 모서리', [box(288, 475, 293, 505, 0, CH), box(263, 500, 293, 505, 0, CH)]),
  // 출입문 개구 옆이다. 문 상단(HEAD) 위는 벽이라서 모서리가 없다.
  cornerBead(3, '출입구 서쪽 모서리', [box(2627, WALL.south - 5, 2657, WALL.south, 0, HEAD), box(2652, WALL.south - 5, 2657, WALL.south + 25, 0, HEAD)], { remark: '위치는 도면의 지시선이 가리키는 벽 모서리다. 출입문 개구 옆이라서 높이를 개구 상단(2,100, 가정)까지로 두었다. 폭과 두께는 가정값이다.' }),
];

const lightRemark = '도면에 손으로 적은 「조명」 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-shelf', layer: 'light', name: '조명 표시 (선반·거울 구간)', note: '손글씨 「조명」', remark: `${lightRemark} 범위는 선반 위 형광펜 표시(Y 556 ~ 2,020)다.`,
    lamp: { power: 1.6 },
    shapes: [box(130, 556, 300, 2020, CH - 40, CH)],
    dims: [dim('표시 구간 길이', 1464, 'scaled')],
  },
  {
    id: 'light-west-room', layer: 'light', name: '조명 표시 (하부 서측 실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 720, cy: 6637, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-closet', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 2082, cy: 6668, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

// 마감. 도면 좌상단 마감 표와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
// 마감 표의 제목은 「지상1층 연구동 화장실 마감 변경부분」이다. 도면명(5층)과 층이 다르다. 표의 내용은 연구동 3층 표와 같다.
const W = WALL;
const finishes: Item[] = [
  {
    id: 'floor-main', layer: 'finish', name: '바닥 마감 (화장실)', material: 'floorTile',
    note: '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)',
    remark: '줄눈 위치는 도면의 타일 나누기 선(X 277, Y 73에서 600 간격)에 맞췄다. 색과 무늬는 도면에 없다. 가정이다. 평면의 주기는 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 대변기 칸 3 안(Y 약 2,590)부터 출입구까지 「+」 표시 구역이 있다. 그 구역의 주기는 「기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 마감 타일이 같아서 따로 나누지 않았다. 주 배수구로 모이는 대각선 화살표 4개와 세면대 배수구 쪽 화살표 2개가 있다(구배 표시로 본다). 구배 값이 도면에 없어서 바닥은 평탄하게 그렸다. 출입문 경첩 쪽의 재료분리대 동쪽(X 3,814 ~ 3,895)은 바닥 타일로 메웠다(작성자 선택).',
    shapes: [box(W.west, W.north, W.east, W.south, -10, 0), box(2652, W.south, W.east, 5541, -10, 0), box(3814, 5541, W.east, 5695, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('줄눈 시작점', 'X 277, Y 73', 'scaled')],
  },
  {
    id: 'floor-closet', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'smallTile',
    note: '기존 바닥 / 고와스 / THK.6 자기질 타일(200X200) 부착',
    remark: '주기는 하부 서측 실 안에 적혀 있고 지시선이 수채기실 타일 격자를 가리킨다. 줄눈 위치는 도면의 200 격자(X 1,676, Y 5,910에서 200 간격)에 맞췄다. 색은 도면에 없다. 가정이다.',
    shapes: [box(1450, 5695, 2505, 7496, -6, 0)],
    dims: [dim('타일 크기', '200 x 200', 'drawn'), dim('타일 두께', 6, 'drawn'), dim('줄눈 시작점', 'X 1,676, Y 5,910', 'scaled')],
  },
  {
    id: 'floor-west-room', layer: 'finish', name: '바닥 마감 (하부 서측 실)', material: 'smallTile',
    remark: '도면에 X 표시만 있다. X는 물이 빠지는 방향(바닥 구배)이다(보헤님 확인, 연구동 3층). X의 교점(725, 6,596)으로 기울게 그렸다. 구배 깊이와 타일은 도면에 없다. 가정이다.',
    shapes: [{ type: 'pan', x0: W.west, y0: 5695, x1: 1347, y1: 7496, z: 0, drop: 15, cx: 725, cy: 6596 }],
    dims: [dim('구배 깊이 (중앙)', 15, 'assumed'), dim('타일 크기', '200 x 200', 'assumed')],
  },
  {
    id: 'wall-finish-main', layer: 'finish', name: '벽 마감 (화장실)', material: 'wall',
    note: '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착',
    remark: '벽의 굵은 선(구조 면)에 얇은 면(3mm)을 붙여 그렸다. 도면의 가는 선(마감 면으로 본다)은 굵은 선에서 15~17mm 안쪽이다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다.',
    shapes: [
      // 서측 벽, 기둥의 남쪽 면과 동쪽 면
      box(W.west, 500, W.west + 3, W.south, 0, CH), box(W.west, 500, 288, 503, 0, CH), box(288, -7, 291, 500, 0, CH),
      // 북측 벽 (창 구간의 창대 아래와 창 위, 꺾인 면, 대변기 칸 구간)
      box(288, -7, 1784, -4, 0, SILL - 20), box(288, -7, 1784, -4, HEAD, CH), box(1784, W.north, 1787, -7, 0, CH), box(1784, W.north, W.east, W.north + 3, 0, CH),
      // 동측 벽
      box(W.east - 3, W.north, W.east, 5541, 0, CH),
      // 남측 벽, 출입문 위, 남측 벽의 동쪽 끝면
      box(W.west, W.south - 3, 2652, W.south, 0, CH), box(2652, W.south - 3, W.east, W.south, HEAD, CH), box(2652, W.south, 2655, 5541, 0, HEAD),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'wall-finish-closet', layer: 'finish', name: '벽 마감 (수채기실)', material: 'wainscotTile',
    note: '벽체 : 도막방수(고와스, H=500) 위 THK.6 도기질타일 (H=1,200)',
    remark: '타일 크기는 도면에 없다. 200 x 200으로 가정했다. 높이 1,200 위는 도장으로 가정했다.',
    shapes: [
      box(1450, 5695, 2505, 5701, 0, 1200), box(1450, 7490, 2505, 7496, 0, 1200),
      box(1450, 5695, 1456, 6302, 0, 1200), box(1450, 6892, 1456, 7496, 0, 1200),
      box(2499, 5695, 2505, 5841, 0, 1200), box(2499, 6541, 2505, 7496, 0, 1200),
      box(1450, 5695, 2505, 5698, 1200, CH, 'paint'), box(1450, 7493, 2505, 7496, 1200, CH, 'paint'),
      box(1450, 5695, 1453, 6302, 1200, CH, 'paint'), box(1450, 6892, 1453, 7496, 1200, CH, 'paint'),
      box(2502, 5695, 2505, 5841, 1200, CH, 'paint'), box(2502, 6541, 2505, 7496, 1200, CH, 'paint'),
    ],
    dims: [dim('타일 높이', 1200, 'drawn'), dim('타일 두께', 6, 'drawn'), dim('타일 크기', '200 x 200', 'assumed')],
  },
  {
    id: 'ceiling', layer: 'finish', name: '천장 마감', material: 'ceiling',
    note: '천장 : 경량철골 천장틀위 금속재 흡음천장 (AL. 600각)',
    remark: '실내에서 볼 때만 그린다. 위에서 내려다볼 때는 그리지 않는다. 하부 두 실의 천장 마감과 높이는 도면에 없다. 화장실과 같은 것으로 가정했다. 패널 나누기 위치도 가정이다.',
    shapes: [box(-106, -359, 4096, 5695, CH, CH + 30), box(-106, 5695, 2654, 7596, CH, CH + 30)],
    dims: [dim('천장고', CH, 'drawn'), dim('패널 크기', '600 x 600', 'drawn')],
  },
];

export const research5fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1971.2, 962.7],
  mmPerPx: 4.37,
};

export const research5fModel: SheetModel = {
  ceilingHeight: CH,
  bounds: { x0: -106, y0: -359, x1: 4096, y1: 7596 },
  eye: { from: [3300, 5150, 1600], to: [1300, 1500, 1100] },
  // 북서쪽에서 본다. 동측 벽의 변기와 남측 벽의 세면기가 벽에 가리지 않는다.
  isoDir: [-1, -1],
  // 창은 북측 벽에 있다. 자연광은 북쪽에서 남쪽으로 들어온다.
  daylightDir: [0.2, 1],
  tileOrigin: { floorTile: [277, 73], smallTile: [1676, 5910] },
  items: [...walls, ...partitions, ...doors, ...fixtures, ...accessories, ...lights, ...finishes],
  // 치수선 위치는 도면의 치수선 위치와 같다. 칸 폭 1,000, 칸 깊이 1,400, 세면대 1,800은 벽의 가는 선에서 시작한다.
  dimLines: [
    { from: [0, -2518], to: [4000, -2518], label: '4,000' },
    { from: [0, -2317], to: [2575, -2317], label: '2,575' },
    { from: [2575, -2317], to: [4000, -2317], label: '1,425' },
    { from: [0, -2114], to: [100, -2114], label: '100' },
    { from: [-3086, 0], to: [-3086, 5600], label: '5,600' },
    { from: [-2881, 0], to: [-2881, 2675], label: '2,675' },
    { from: [-2881, 2675], to: [-2881, 5600], label: '2,925' },
    { from: [-2881, 5600], to: [-2881, 7500], label: '1,900' },
    { from: [2208, -38], to: [2208, 962], label: '1,000' },
    { from: [2208, 962], to: [2208, 1962], label: '1,000' },
    { from: [2208, 1962], to: [2208, 2962], label: '1,000' },
    { from: [2482, 3231], to: [3882, 3231], label: '1,400' },
    { from: [118, 4660], to: [1918, 4660], label: '1,800' },
    { from: [0, 9370], to: [100, 9370], label: '100' },
    { from: [0, 9569], to: [1400, 9569], label: '1,400' },
    { from: [1400, 9569], to: [2575, 9569], label: '1,175' },
    { from: [2575, 9569], to: [4000, 9569], label: '1,425' },
    { from: [0, 9768], to: [4000, 9768], label: '4,000' },
    { from: [6956, 0], to: [6956, 2675], label: '2,675' },
    { from: [6956, 2675], to: [6956, 5600], label: '2,925' },
    { from: [6956, 5600], to: [6956, 7500], label: '1,900' },
    { from: [7155, 0], to: [7155, 5600], label: '5,600' },
  ],
  roomLabels: [{ text: '화장실(여)', at: [1498, 1641] }],
};
