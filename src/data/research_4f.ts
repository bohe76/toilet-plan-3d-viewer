// 4층 연구동 화장실(남) 확대평면도 (변경후) — PDF 7페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분과 work/verify/p7/rowscan.py 의 주사선 판독값(300dpi 기울기 보정 이미지)을 mm로 환산했다.
// 환산식: X = (px - 1961) * 4.37, Y = (py - 942) * 4.37.
// 원점 X=0은 치수선 4,000의 서쪽 끝이다(통심 5에서 서쪽으로 100, 서측 벽 중심). Y=0은 통심 G(창대석 안쪽 끝)다.
// 축척 4.37은 세로 5,600(1,281px, 좌우 같음)과 평면 중간 높이의 가로 4,000(약 915.7px)에서 구했다. 두 값의 차이는 0.1% 안쪽이다.
// 이 장은 스캔이 사다리꼴로 틀어져 있다. 위쪽 4,000은 918.5px, 아래쪽 4,000은 913.0px다. X=0 보조선은 위에서 아래로 7.4px(1958 → 1965.4) 밀린다.
// 그래서 위쪽 4,000(+14)과 아래쪽 4,000(-10)은 환산 오차가 10mm 이상이다. 원점은 평면 중간 높이(py 약 1,800)와 중간 폭에 맞췄다.
// 통심 G의 보조선도 서쪽(943.5)에서 동쪽(940)으로 3.5px 올라간다. 원점 y는 평면 가운데의 값(942)이다.
// 서측 벽선은 평면 위쪽과 아래쪽에서 이 원점 기준으로 약 ±3px(±13mm) 기운다. 모델의 벽은 곧게 두었다.
// 벽 안쪽에 굵은 선(구조 면)과 가는 선(마감 면으로 본다)이 13~22mm 간격으로 나란히 그려져 있다. 벽 상자는 굵은 선에 맞췄다.
// 표기 치수 1,000(대변기 칸), 1,400(칸 깊이), 1,800(세면대)은 가는 선에서 잰 것으로 읽혔다(환산 오차 4mm 이내).
// 가림 칸막이 800과 소변기 칸막이 450도 가는 선에서 잰 것으로 가정했다. 이 둘은 선 위치와 맞지 않는다(선 기준 약 826, 461). 표기를 따랐다.
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/research_4f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 research_4f_added.ts 에 있다.
// 양변기, 소변기, 세면기, 수전, 배수구, 칸 문, 가방걸이, 유리선반, 코너 비드의 형상과 가정 높이(SILL, HEAD, GAP, COUNTER)는 parts.ts 에 있다.
import { COUNTER, GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet, urinal } from './parts';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2450; // 천장고. 도면 표기 CH 2,450 (평면 안 2곳)

/** 벽의 굵은 선(구조 면) 위치. 축척 환산값이다. south는 화장실 남측 벽의 북쪽 면이다. */
export const WALL = { west: 103, east: 3900, north: -59, south: 5491 };
/** 화장실 남측 벽의 남쪽 면 */
const MID_S = 5695;
/** 대변기 칸 전면 칸막이의 중심 X. 표기 치수 1,400(동측 벽 가는 선 X 3,883에서)을 따랐다. */
export const FRONT_X = 2483;
/** 세면기 반지름. 도면 기호의 환산값(지름 약 452)이다. */
export const BASIN_R = 226;
/** 양변기 탱크 뒤 면. 동측 벽 굵은 선에서 벽 마감 3mm 안쪽이다. */
export const TOILET_X = WALL.east - 3;
/** 소변기 뒤 면. 서측 벽 굵은 선에서 벽 마감 3mm 안쪽이다. */
export const URINAL_X = WALL.west + 3;
/** 소변기 중심 Y. 소변기 칸막이 사이의 가운데다(표기 520 + 950 간격). 뒤판 환산 중심(993, 1,944, 2,893)과 2mm 안쪽이다. */
export const URINAL_YS = [995, 1945, 2895];
/** 소변기 칸막이 중심 Y. 표기 치수 520과 950 × 3을 따랐다. */
const URINAL_PARTITIONS = [1470, 2420, 3370];

// 소변기 뒤 띠. 서측 벽면의 점묘 띠(X 103 ~ 271)다. 점묘가 소변기 뒤판 안에서도 이어져서 끊지 않았다.
const CHASE = { x1: 271, y0: 520, y1: 3420, h: 1000 };
const URINAL_W = 428;

/** 대변기 칸. north는 칸의 북쪽 면 Y, cy는 양변기 중심 Y, hinge는 문 경첩 Y, south는 남쪽 칸막이 중심 Y다. */
export const STALLS = [
  { n: 1, north: WALL.north, cy: 461, hinge: 739, south: 970 },
  { n: 2, north: 976, cy: 1463, hinge: 1741, south: 1970 },
  { n: 3, north: 1976, cy: 2463, hinge: 2742, south: 2970 },
];

const walls: Item[] = [
  {
    id: 'wall-column', layer: 'wall', name: '기둥 (북서 모서리)',
    remark: '기둥 북쪽의 서쪽 돌출부(X -260 ~ -99)도 도면 외곽선대로 넣었다.',
    shapes: [box(-99, -358, 293, 496, 0, CH), box(-260, -358, -99, -55, 0, CH)],
    dims: [dim('폭', 392, 'scaled'), dim('깊이', 854, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-north-window', layer: 'wall', name: '북측 벽 (창 구간)',
    remark: '창대 높이와 창 상단 높이는 도면에 없다. 가정값이다. 벽 안쪽 끝은 창대석 안쪽 끝 선(Y 0, 통심 G)이다.',
    shapes: [box(293, -358, 1790, 0, 0, SILL - 20), box(293, -358, 1790, 0, HEAD, CH)],
    dims: [dim('창 구간 길이', 1497, 'scaled'), dim('창대 높이', SILL, 'assumed'), dim('창 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'window', layer: 'wall', name: '창호 2/CAW', material: 'glass',
    shapes: [box(293, -273, 1790, -253, SILL, HEAD)],
    dims: [dim('폭', 1497, 'scaled'), dim('높이', HEAD - SILL, 'assumed')],
  },
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽 (대변기 칸 구간)',
    remark: '벽 안쪽에 굵은 선(Y -59)과 가는 선(Y -37)이 있다. 벽은 굵은 선까지 그렸다. 벽 안의 가는 선 2줄(Y -258, -208)은 벽체 속 선으로 보고 따로 그리지 않았다.',
    shapes: [box(1790, -358, 4249, WALL.north, 0, CH)],
    dims: [dim('두께', 299, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-ne-corner', layer: 'wall', name: '북동 모서리 벽체 (실 밖)',
    remark: '동측 벽 바깥의 꺾인 벽체다. 도면 외곽선대로 넣었다. 그 동쪽으로 이어지는 창과 벽은 이 실 밖이라서 넣지 않았다.',
    shapes: [box(4100, WALL.north, 4249, 39, 0, CH), box(4100, 39, 4498, 390, 0, CH)],
    dims: [dim('외곽', '선분 검출값', 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽',
    remark: '벽 안쪽에 굵은 선(X 3,898)과 가는 선(X 3,883)이 있다. 벽은 굵은 선까지 그렸다.',
    shapes: [box(WALL.east, WALL.north, 4100, 7302, 0, CH)],
    dims: [dim('서측 벽 중심에서 동측 벽 중심까지', 4000, 'drawn'), dim('두께', 200, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽',
    remark: '벽 안쪽에 굵은 선(X 103)과 가는 선(X 약 116)이 있다. 벽은 굵은 선까지 그렸다. 남쪽 끝(Y 7,396 아래)은 바깥 면이 X -183으로 꺾여 두꺼워진다. 그 서쪽의 문틀과 문(X 약 -250 ~ -224)은 이웃 실의 것이라서 넣지 않았다.',
    shapes: [box(-99, 496, WALL.west, 7599, 0, CH), box(-183, 7396, -99, 7599, 0, CH)],
    dims: [dim('두께', 202, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-mid', layer: 'wall', name: '화장실 남측 벽',
    remark: '벽은 수채기실 동측 벽의 바깥 면(X 2,655)에서 끝난다. 그 동쪽은 출입문 문틀과 문이다. 벽 북쪽 면에도 가는 선(Y 5,476)이 있다. 벽 중심의 환산값은 Y 5,593이다. 출입문 상단 높이는 도면에 없다. 가정값이다.',
    shapes: [box(WALL.west, WALL.south, 2655, MID_S, 0, CH), box(2655, WALL.south, WALL.east, MID_S, HEAD, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', 5600, 'drawn'), dim('두께', 204, 'scaled'), dim('출입문 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'wall-inner', layer: 'wall', name: '하부 두 실 사이 벽',
    remark: '서쪽 실은 도면에 실명이 없다. 벽 중심은 표기 1,400을 따랐다(X 1,350 ~ 1,450). 선 위치의 환산값은 X 1,359 ~ 1,460(중심 1,410)이다. 이 높이에서는 X=0 보조선이 원점보다 약 2.3px 동쪽에 있어서 바닥 도면과 약 10mm 어긋나 보인다. 문 높이는 가정값이다.',
    shapes: [box(1350, MID_S, 1450, 6302, 0, CH), box(1350, 6896, 1450, 7500, 0, CH), box(1350, 6302, 1450, 6896, HEAD, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 1400, 'drawn'), dim('두께', 101, 'scaled'), dim('문 개구 폭 (문틀 외곽)', 594, 'scaled'), dim('문 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'wall-closet-east', layer: 'wall', name: '수채기실 동측 벽',
    remark: '개구 폭은 문틀 외곽선 사이(환산 699)이고 표기 700을 따랐다. 개구 안에 그려진 요소는 sill-closet-tile-50 에 있다. 벽 중심의 환산값은 X 2,580이다(표기 2,575).',
    shapes: [box(2505, MID_S, 2655, 5841, 0, CH), box(2505, 6541, 2655, 7500, 0, CH), box(2505, 5841, 2655, 6541, 2050, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 2575, 'drawn'), dim('두께', 150, 'scaled'), dim('문 개구 폭', 700, 'drawn'), dim('문 개구 높이', 2050, 'drawn')],
  },
  {
    id: 'wall-chase', layer: 'wall', name: '소변기 뒤 띠와 두겁돌', note: 'THK20 화강석 두겁돌 설치 (L=2,900)',
    remark: '서측 벽면의 점묘 띠다(X 103 ~ 271, 폭 168). 주기의 지시선이 이 띠를 가리킨다. 띠의 길이는 표기 L=2,900을 따랐다(환산 2,904). 띠 높이는 도면에 없다. 1,000으로 가정했고 두겁돌(THK20)을 그 위에 얹었다. 점묘는 소변기 뒤판 윤곽선 안에서도 이어진다(띠 안쪽 열 x 1991 ~ 2002px의 점 밀도: 뒤판 안 2.9 ~ 6.9, 소변기 사이 1.7 ~ 10.5개/1,000px²). 그래서 띠와 두겁돌을 끊지 않고 한 덩어리로 그렸다. 소변기 부품의 뒤판과 그릇의 벽 쪽 부분은 띠 안에 묻힌다.',
    shapes: [box(WALL.west, CHASE.y0, CHASE.x1, CHASE.y1, 0, CHASE.h), box(WALL.west, CHASE.y0, CHASE.x1, CHASE.y1, CHASE.h, CHASE.h + 20, 'granite')],
    dims: [dim('길이', 2900, 'drawn'), dim('폭', 168, 'scaled'), dim('두겁돌 두께', 20, 'drawn'), dim('높이', CHASE.h, 'assumed')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    shapes: [box(-99, 7500, 2655, 7599, 0, CH)],
    dims: [dim('화장실 남측 벽 중심에서 벽 안쪽 면까지', 1900, 'drawn'), dim('두께', 99, 'scaled')],
  },
];

const stallPartition = (n: number, y: number): Item => ({
  id: `partition-${n}`, layer: 'partition', name: `대변기 칸막이 ${n}`,
  ...(n === 1 ? { note: '12mm 지정칸막이 (H=1,950)' } : {}),
  remark: '도면의 「12mm 지정칸막이 (H=1,950)」 지시선은 칸막이 1을 가리킨다. 칸막이 2, 3도 같은 것으로 보았다. 「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다. 위치는 표기 치수(우측 2,970과 1,000 간격)를 따랐다. 환산값은 Y 968, 1,964, 2,965다.',
  shapes: [box(FRONT_X, y - PT / 2, WALL.east, y + PT / 2, GAP, 1950)],
  dims: [dim('칸 폭', 1000, 'drawn'), dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('하부 틈', GAP, 'assumed')],
});

const urinalRemark = '위치는 표기 치수 520과 950 × 3을 따랐다. 길이 450은 서측 벽의 가는 선(X 약 116)에서 잰 것으로 읽었다. 도면 선의 끝은 X 577이다(가는 선에서 461). 높이 1,250의 하단 높이는 도면에 없다. 400으로 가정했다.';

const partitions: Item[] = [
  ...STALLS.map((s) => stallPartition(s.n, s.south)),
  {
    id: 'partition-front', layer: 'partition', name: '대변기 칸 전면 칸막이',
    remark: '전면 패널에는 주기가 없다. 높이와 두께는 칸 사이 칸막이(H=1,950, 12mm)와 같은 것으로 가정했다. 하부 틈도 가정값이다. 패널 양 끝은 선분 검출값이다.',
    shapes: [
      box(FRONT_X - PT / 2, WALL.north, FRONT_X + PT / 2, 184, GAP, 1950),
      box(FRONT_X - PT / 2, 734, FRONT_X + PT / 2, 1224, GAP, 1950),
      box(FRONT_X - PT / 2, 1739, FRONT_X + PT / 2, 2185, GAP, 1950),
      box(FRONT_X - PT / 2, 2740, FRONT_X + PT / 2, 2970, GAP, 1950),
    ],
    dims: [dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('동측 벽 가는 선에서 패널 중심까지', 1400, 'drawn'), dim('패널 양 끝', '선분 검출값', 'scaled'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-urinal', layer: 'partition', name: '소변기 칸막이', note: '12mm 지정 칸막이 (450x1,250 - 3개소)',
    remark: urinalRemark,
    shapes: URINAL_PARTITIONS.map((y) => box(WALL.west, y - PT / 2, 566, y + PT / 2, 400, 1650)),
    dims: [dim('수량', '3개소', 'drawn'), dim('길이', 450, 'drawn'), dim('높이', 1250, 'drawn'), dim('간격', 950, 'drawn'), dim('두께', PT, 'drawn'), dim('하단 높이', 400, 'assumed')],
  },
  {
    id: 'partition-screen', layer: 'partition', name: '세면대 옆 가림 칸막이', note: '12mm 지정칸막이 (800x1,600)',
    remark: '위치는 표기 치수 1,800(서측 벽 가는 선 X 122에서 패널 중심까지)을 따랐다. 환산값은 X 1,924다. 길이 800은 남측 벽의 가는 선(마감 면, Y 5,476)에서 잰 것으로 읽었다. 패널 북쪽 끝은 그 선에서 800(Y 4,676)이다. 상자는 벽의 굵은 선(Y 5,491)까지 그렸다. 상자 길이 815 중 15는 마감 층 안에 묻힌 부분이다. 도면의 굵은 패널 선은 치수선 1,800(Y 4,663) 근처에서 시작한다. 그 위로 이어지는 가는 선(Y 약 4,261까지)은 주기의 지시선이다.',
    shapes: [box(1916, 4676, 1928, WALL.south, 0, 1600)],
    dims: [dim('길이', 800, 'drawn'), dim('높이', 1600, 'drawn'), dim('두께', PT, 'drawn'), dim('서측 벽면에서의 거리', 1800, 'drawn')],
  },
  {
    id: 'partition-under-basin', layer: 'partition', name: '세면대 하부 칸막이', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에서 점선 1개(X 122 ~ 629, 상판 앞 선 바로 뒤)만 판독된다. 길이는 표기 500을 따랐다. 다른 위치의 패널 유무는 도면으로 확인할 수 없다.',
    shapes: [box(122, 4884, 622, 4896, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('남측 벽면에서의 거리', 601, 'scaled')],
  },
];

const doors: Item[] = [
  ...STALLS.map((s) => stallDoor(s.n, FRONT_X + PT / 2, s.hinge, 0, 580, {
    remark: '도면은 문을 안쪽(동쪽)으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 경첩은 문 개구의 남쪽 끝이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
  })),
  {
    id: 'door-entrance', layer: 'door', name: '출입문 3/SSD', material: 'steelDoor',
    remark: '도면은 문을 남쪽(바깥)으로 90도 연 상태로 그렸다. 경첩은 재료분리대 중심선 위(Y 5,624)다. 문짝 끝(Y 6,625)과 열림 호에서 읽었다. 서쪽 문틀(X 2,655 ~ 2,854)은 도면의 외곽만 따랐다. 안쪽 형상은 단순화했다. 문 높이는 가정값이다.',
    shapes: [
      { type: 'leaf', hx: 3835, hy: 5624, width: 1000, angleDeg: 90, thickness: 40, z0: 0, z1: HEAD },
      // 서쪽 문틀
      box(2655, 5545, 2854, MID_S, 0, HEAD),
    ],
    dims: [dim('문짝 폭', 1000, 'scaled'), dim('서쪽 문틀 폭', 199, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
  {
    id: 'door-closet', layer: 'door', name: '수채기실 문 2/SD', note: '기존 점검구 도색 (700X2,050)', material: 'paintDoor',
    remark: '도면은 문을 동쪽(바깥)으로 90도 연 상태로 그렸다. 경첩은 개구 북쪽 끝이다.',
    shapes: [{ type: 'leaf', hx: 2674, hy: 5889, width: 647, angleDeg: 0, thickness: 40, z0: 0, z1: 2050 }],
    dims: [dim('개구 폭', 700, 'drawn'), dim('높이', 2050, 'drawn'), dim('문짝 폭', 647, 'scaled')],
  },
  {
    id: 'door-inner', layer: 'door', name: '하부 두 실 사이 문', material: 'paintDoor',
    remark: '도면에 문짝과 열림 호가 그려져 있다. 문은 수채기실 쪽(동쪽)으로 90도 열려 있다. 경첩은 개구 북쪽 끝이다. 문 번호와 치수 표기는 없다. 문 높이는 가정값이다.',
    shapes: [{ type: 'leaf', hx: 1458, hy: 6345, width: 533, angleDeg: 0, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 533, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
];

const fixtures: Item[] = [
  // 양변기는 동측 벽에 붙어 서쪽을 본다. 도면 기호의 길이(벽 굵은 선에서 747)는 부품 기본값 740과 20mm 안쪽이다.
  ...STALLS.map((s) => toilet(s.n, TOILET_X, s.cy, 180)),
  // 소변기는 서측 벽에 붙어 동쪽을 본다. 폭 428은 뒤판 폭, 벽에서 나온 길이 346은 벽 마감면에서 앞 끝(X 452)까지의 환산값이다.
  ...URINAL_YS.map((y, i) => urinal(i + 1, URINAL_X, y, 0, URINAL_W, 346)),
  // 세면기는 남측 벽 북쪽 면(Y 5,491)에서 331 떨어져 북쪽을 본다. 도면의 세면기 기호에 토수구 1개와 손잡이 2개가 그려져 있다.
  basin(1, 627, 5160, '남측 벽면에서 중심까지', 331, BASIN_R),
  basin(2, 1425, 5160, '남측 벽면에서 중심까지', 331, BASIN_R),
  faucet(1, 627, 5160, 270, BASIN_R),
  faucet(2, 1425, 5160, 270, BASIN_R),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 높이와 안쪽 형상은 가정값이다.',
    shapes: [
      rbox(1682, 7007, 2263, 7473, 0, 260, 30),
      { type: 'plate', x0: 1682, y0: 7007, x1: 2263, y1: 7473, z0: 260, z1: 350, r: 30, holes: [{ x0: 1748, y0: 7066, x1: 2210, y1: 7423, r: 50 }] },
      cyl(1980, 7245, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭', 581, 'scaled'), dim('깊이', 466, 'scaled'), dim('높이', 350, 'assumed')],
  },
  floorDrain('fd-main', 1776, 2176),
  floorDrain('fd-basin', 986, 4974),
];

const hookNote = {
  note: '가방걸이 설치',
  remark: '주기의 지시선은 칸 1 문의 기호를 가리킨다. 칸 2, 3의 문에도 같은 기호가 그려져 있다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면(열린 상태에서 남쪽 면)에 달았다.',
};
const hookRemark = { remark: '도면의 문에 가방걸이 기호가 그려져 있다(주기는 칸 1에만 있다). 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면(열린 상태에서 남쪽 면)에 달았다.' };

const accessories: Item[] = [
  {
    id: 'window-sill', layer: 'accessory', name: '창대석', note: 'THK20 인조대리석 창대석 설치 (W=200)', material: 'marble',
    shapes: [box(293, -200, 1790, 0, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  {
    id: 'mirror-full', layer: 'accessory', name: '전신 방습거울', note: 'THK.5 방습거울 (기계설비공사) (600X1,500)', material: 'mirror',
    facing: [-1, 0],
    remark: '동측 벽면에 있다. 위치는 우측 표기 치수 2,970 + 710 = 3,680에서 600이다. 하단 높이는 가정값이다.',
    shapes: [box(3895, 3680, 3900, 4280, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('칸막이 3에서의 거리', 710, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, 'assumed')],
  },
  {
    id: 'mirror-basin', layer: 'accessory', name: '세면대 방습거울', note: 'THK.5 방습거울 (기계설비공사) (1,800X1,000)', material: 'mirror',
    facing: [0, -1],
    remark: '남측 벽 북쪽 면의 굵은 선(서측 벽에서 가림 칸막이까지)이다. 하단 높이는 가정값이다.',
    shapes: [box(WALL.west, WALL.south - 5, 1916, WALL.south, 1000, 2000)],
    dims: [dim('폭', 1800, 'drawn'), dim('높이', 1000, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 1000, 'assumed')],
  },
  {
    id: 'counter', layer: 'accessory', name: '세면대 상판', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(Y 4,877의 실선, 서측 벽 ~ 가림 칸막이)을 환산한 값이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      {
        type: 'plate', x0: WALL.west, y0: 4877, x1: 1916, y1: WALL.south, z0: COUNTER - 20, z1: COUNTER,
        holes: [{ cx: 627, cy: 5160, r: 210 }, { cx: 1425, cy: 5160, r: 210 }],
      },
      // 뒷턱
      box(WALL.west, WALL.south - 20, 1916, WALL.south - 5, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 1813, 'scaled'), dim('깊이', 614, 'scaled'), dim('윗면 높이', COUNTER, 'assumed'), dim('두께', 20, 'assumed')],
  },
  // 유리선반은 칸의 남동 모서리에 있다. 중심 Y는 남쪽 칸막이의 북쪽 면이다.
  // 도면의 세 칸 모두에 점선 1/4 원이 있다. 주기의 지시선(화살표 Y 약 1,830)은 칸 2의 선반을 가리킨다.
  ...STALLS.map((s) => glassShelf(s.n, WALL.east, s.south - PT / 2, 180, 300, s.n === 2
    ? { note: '유리선반 설치 (r=300) (기계설비공사)', remark: '주기의 지시선이 이 선반을 가리킨다. 설치 높이는 가정값이다.' }
    : { remark: '칸 2의 주기 「유리선반 설치 (r=300) (기계설비공사)」와 같은 기호가 그려져 있다. 설치 높이는 가정값이다.' })),
  ...STALLS.map((s) => stallHook(s.n, FRONT_X + PT / 2, s.hinge, 0, 1, 290, s.n === 1 ? hookNote : hookRemark)),
  {
    id: 'threshold', layer: 'accessory', name: '화강석 재료분리대', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 점묘 해치(X 2,854 ~ 3,815)다. 두께 30은 석재 두께다. 바닥 위로 드러나는 높이는 도면에 없다. 10으로 가정했다.',
    shapes: [box(2854, 5545, 3815, MID_S, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 961, 'scaled'), dim('노출 높이', 10, 'assumed')],
  },
  {
    id: 'sill-closet-tile-50', layer: 'accessory', name: '수채기실 문 개구 바닥 타일 턱', note: '타일 덧대기(적층) (THK 50)', material: 'smallTile',
    remark: '정체는 도면으로 확정하지 못했다. 문이 여닫히는 개구 안에 있어서 높이 50의 턱으로 보았다(해석). 주기의 지시 점은 지름 약 7px이고 중심은 (2548.7, 2362)px다. 띠 B 안에 있다. 개구 안(문틀 캡 안쪽 선 y 2289.2 ~ 2428.6px)에 세로선 4개가 있다: 2531, 2539.0(가는 선), 2550.3, 2562.6px. 이 선들과 문틀 선(2572px) 사이가 띠 A ~ D다. 줄눈 가로선 3개(y 2325, 2369, 2412px)가 띠 A·B·C를 가로지른다. 평면은 띠 B(x 2539.0 ~ 2550.3px)와 문틀 캡 안쪽 선 사이로 넣었다. 수채기실 문(door-closet)은 하부 틈이 0이다. 그러나 문짝은 경첩 X 2,674의 동쪽에 있다. 열린 상태(X 2,674 ~ 3,321)와 닫힌 상태(X 2,654 ~ 2,694) 모두 턱(X 2,526 ~ 2,575)과 평면에서 겹치지 않는다.',
    shapes: [box(2526, 5887, 2575, 6496, 0, 50)],
    dims: [dim('두께 (쌓은 높이로 봄)', 50, 'drawn'), dim('평면 폭', 49, 'scaled'), dim('길이', 609, 'scaled')],
  },
  {
    id: 'tactile-blocks', layer: 'accessory', name: '점형블럭 2EA', note: '점형블럭 2EA (매립형)', material: 'tactile',
    shapes: [box(2058, 7892, 2356, 8194, 0, 5), box(2360, 7892, 2659, 8194, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('1장 크기', '약 300 x 300', 'scaled')],
  },
  {
    id: 'braille-sign', layer: 'accessory', name: '점자표지판', note: '벽면 촉지도식 점자표지판설치', material: 'metal',
    remark: '크기와 설치 높이는 가정값이다. 폭은 남측 벽 바깥 면의 굵은 선을 환산한 값이다.',
    shapes: [box(2207, 7599, 2504, 7621, 1400, 1550)],
    dims: [dim('위치', '남측 벽 바깥 면', 'scaled'), dim('폭', 297, 'scaled'), dim('설치 높이', 1400, 'assumed')],
  },
  // 코너 비드. 도면의 「코너 비드 설치」 지시선 3개가 가리키는 벽 모서리에 붙였다.
  cornerBead(1, '창 동쪽 모서리', [box(1790, -25, 1795, 5, 0, SILL - 20), box(1765, 0, 1795, 5, 0, SILL - 20), box(1790, -25, 1795, 5, HEAD, CH), box(1765, 0, 1795, 5, HEAD, CH)]),
  cornerBead(2, '기둥 남동 모서리', [box(293, 471, 298, 501, 0, CH), box(268, 496, 298, 501, 0, CH)]),
  // 출입구 개구 옆이다. 개구 위(HEAD 위)는 인방이라서 모서리가 없다. 비드는 바닥에서 개구 상단까지 둔다.
  {
    ...cornerBead(3, '출입구 서쪽 모서리', [box(2630, 5486, 2660, 5491, 0, HEAD), box(2655, 5486, 2660, 5516, 0, HEAD)]),
    dims: [dim('위치', '출입구 서쪽 모서리', 'scaled'), dim('날개 폭', 25, 'assumed'), dim('두께', 5, 'assumed'), dim('높이', '바닥에서 출입문 상단(2,100)까지', 'assumed')],
  },
];

const lightRemark = '도면에 손으로 적은 「조명」 위치다. 주황 형광펜 표시의 중심에 두었다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-west-room', layer: 'light', name: '조명 표시 (하부 서측 실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 693, cy: 6615, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-closet', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 2159, cy: 6639, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

// 마감. 도면 좌상단 「지상4층 연구동 화장실 마감 변경부분」 표와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
const finishes: Item[] = [
  {
    id: 'floor-main', layer: 'finish', name: '바닥 마감 (화장실)', material: 'floorTile',
    note: '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)',
    remark: '줄눈 위치는 도면의 타일 나누기 선(X 877, Y 678에서 600 간격)에 맞췄다. 색과 무늬는 도면에 없다. 가정이다. 평면의 주기는 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 대변기 칸 3 안(Y 약 2,600)부터 출입구까지 「+」 표시 구역이 있다. 그 구역의 주기는 「기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 마감 타일이 같아서 따로 나누지 않았다. 중앙 배수구(fd-main)와 세면대 배수구(fd-basin)를 향하는 구배 화살표가 도면에 있다. 구배 값이 없어서 바닥은 평탄하게 그렸다(작성자 선택, 연구동 3층과 같다). 출입문 경첩 쪽의 재료분리대 동쪽(X 3,815 ~ 3,900)은 바닥 타일로 메웠다(작성자 선택).',
    shapes: [box(WALL.west, WALL.north, WALL.east, WALL.south, -10, 0), box(2655, WALL.south, WALL.east, 5545, -10, 0), box(3815, 5545, WALL.east, MID_S, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('줄눈 시작점', 'X 877, Y 678', 'scaled')],
  },
  {
    id: 'floor-closet', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'smallTile',
    note: '기존 바닥 / 고와스 / THK.6 자기질 타일(200X200) 부착',
    remark: '주기의 글자는 하부 서측 실 안에 있다. 지시선 끝의 점은 수채기실 안(X 약 1,770, Y 약 6,050)에 있다. 줄눈 위치는 도면의 200 격자(X 1,875, Y 5,915에서 200 간격)에 맞췄다. 색은 도면에 없다. 가정이다.',
    shapes: [box(1450, MID_S, 2505, 7500, -6, 0)],
    dims: [dim('타일 크기', '200 x 200', 'drawn'), dim('타일 두께', 6, 'drawn'), dim('줄눈 시작점', 'X 1,875, Y 5,915', 'scaled')],
  },
  {
    id: 'floor-west-room', layer: 'finish', name: '바닥 마감 (하부 서측 실)', material: 'smallTile',
    remark: '도면에 실 모서리를 잇는 X 선이 그려져 있다. 화살표와 배수구 기호는 없다. 지침서 데이터 규칙(X 표시는 물이 빠지는 방향)과 연구동 3층·5층에 따라 바닥 구배로 보았다. 낮은 점은 X의 교점(실 가운데, X 727, Y 6,598)이다. 선 위치의 환산 교점은 (736, 6,598)이다. 구배 깊이와 타일은 도면에 없다. 가정이다.',
    shapes: [{ type: 'pan', x0: WALL.west, y0: MID_S, x1: 1350, y1: 7500, z: 0, drop: 15, cx: 727, cy: 6598 }],
    dims: [dim('구배 깊이 (중앙)', 15, 'assumed'), dim('타일 크기', '200 x 200', 'assumed')],
  },
  {
    id: 'wall-finish-main', layer: 'finish', name: '벽 마감 (화장실)', material: 'wall',
    note: '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착',
    remark: '벽의 안쪽 면에 얇은 면(3mm)을 붙여 그렸다. 타일 두께 10으로 그리면 벽에 붙은 거울을 덮는다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다.',
    shapes: [
      // 서측 벽, 기둥의 남쪽 면과 동쪽 면
      box(WALL.west, 496, WALL.west + 3, WALL.south, 0, CH), box(WALL.west, 496, 293, 499, 0, CH), box(293, 0, 296, 496, 0, CH),
      // 북측 벽 (창 구간의 창대 아래와 창 위, 꺾인 면, 대변기 칸 구간)
      box(293, 0, 1790, 3, 0, SILL - 20), box(293, 0, 1790, 3, HEAD, CH), box(1790, WALL.north, 1793, 0, 0, CH), box(1790, WALL.north, WALL.east, WALL.north + 3, 0, CH),
      // 동측 벽
      box(WALL.east - 3, WALL.north, WALL.east, 5545, 0, CH),
      // 남측 벽, 출입문 위, 남측 벽의 동쪽 끝면
      box(WALL.west, WALL.south - 3, 2655, WALL.south, 0, CH), box(2655, WALL.south - 3, WALL.east, WALL.south, HEAD, CH), box(2655, WALL.south, 2658, 5545, 0, HEAD),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'wall-finish-closet', layer: 'finish', name: '벽 마감 (수채기실)', material: 'wainscotTile',
    note: '벽체 : 도막방수(고와스, H=500) 위 THK.6 도기질타일 (H=1,200)',
    remark: '주기의 지시선은 수채기실 남측 벽 안쪽을 가리킨다. 타일 크기는 도면에 없다. 200 x 200으로 가정했다. 높이 1,200 위는 도장으로 가정했다.',
    shapes: [
      box(1450, MID_S, 2505, MID_S + 6, 0, 1200), box(1450, 7494, 2505, 7500, 0, 1200),
      box(1450, MID_S, 1456, 6302, 0, 1200), box(1450, 6896, 1456, 7500, 0, 1200),
      box(2499, MID_S, 2505, 5841, 0, 1200), box(2499, 6541, 2505, 7500, 0, 1200),
      box(1450, MID_S, 2505, MID_S + 3, 1200, CH, 'paint'), box(1450, 7497, 2505, 7500, 1200, CH, 'paint'),
      box(1450, MID_S, 1453, 6302, 1200, CH, 'paint'), box(1450, 6896, 1453, 7500, 1200, CH, 'paint'),
      box(2502, MID_S, 2505, 5841, 1200, CH, 'paint'), box(2502, 6541, 2505, 7500, 1200, CH, 'paint'),
    ],
    dims: [dim('타일 높이', 1200, 'drawn'), dim('타일 두께', 6, 'drawn'), dim('타일 크기', '200 x 200', 'assumed')],
  },
  {
    id: 'ceiling', layer: 'finish', name: '천장 마감', material: 'ceiling',
    note: '천장 : 경량철골 천장틀위 금속재 흡음천장 (AL. 600각)',
    remark: '실내에서 볼 때만 그린다. 위에서 내려다볼 때는 그리지 않는다. 하부 두 실의 천장 마감과 높이는 도면에 없다. 화장실과 같은 것으로 가정했다. 패널 나누기 위치도 가정이다.',
    shapes: [box(-99, -358, 4100, MID_S, CH, CH + 30), box(-99, MID_S, 2655, 7599, CH, CH + 30)],
    dims: [dim('천장고', CH, 'drawn'), dim('패널 크기', '600 x 600', 'drawn')],
  },
];

export const research4fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1961, 942],
  mmPerPx: 4.37,
};

export const research4fModel: SheetModel = {
  ceilingHeight: CH,
  bounds: { x0: -260, y0: -358, x1: 4100, y1: 7599 },
  eye: { from: [3300, 5100, 1600], to: [1200, 1800, 1100] },
  // 북동쪽에서 본다. 서측 벽의 소변기와 남측 벽의 세면기가 카메라 쪽을 본다.
  isoDir: [1, -1],
  // 창은 북측 벽에 있다. 자연광은 북쪽에서 남쪽으로 들어온다.
  daylightDir: [0.2, 1],
  // 도면의 타일 나누기 선에서 읽은 교점이다. 화장실 600 격자와 수채기실 200 격자다.
  tileOrigin: { floorTile: [877, 678], smallTile: [1875, 5915] },
  items: [...walls, ...partitions, ...doors, ...fixtures, ...accessories, ...lights, ...finishes],
  // 치수선 위치는 도면의 치수선 위치와 같다.
  dimLines: [
    { from: [0, -2517], to: [4000, -2517], label: '4,000' },
    { from: [0, -2314], to: [2575, -2314], label: '2,575' },
    { from: [2575, -2314], to: [4000, -2314], label: '1,425' },
    { from: [0, -2113], to: [100, -2113], label: '100' },
    { from: [-3072, 0], to: [-3072, 5600], label: '5,600' },
    { from: [-2862, 0], to: [-2862, 520], label: '520' },
    { from: [-2862, 520], to: [-2862, 3370], label: '2,850' },
    { from: [-2862, 3370], to: [-2862, 5600], label: '2,230' },
    { from: [-2862, 5600], to: [-2862, 7500], label: '1,900' },
    { from: [826, 520], to: [826, 1470], label: '950' },
    { from: [826, 1470], to: [826, 2420], label: '950' },
    { from: [826, 2420], to: [826, 3370], label: '950' },
    { from: [2209, -30], to: [2209, 970], label: '1,000' },
    { from: [2209, 970], to: [2209, 1970], label: '1,000' },
    { from: [2209, 1970], to: [2209, 2970], label: '1,000' },
    { from: [2483, 3234], to: [3883, 3234], label: '1,400' },
    { from: [122, 4663], to: [1922, 4663], label: '1,800' },
    { from: [0, 9572], to: [1400, 9572], label: '1,400' },
    { from: [1400, 9572], to: [2575, 9572], label: '1,175' },
    { from: [2575, 9572], to: [4000, 9572], label: '1,425' },
    { from: [0, 9769], to: [4000, 9769], label: '4,000' },
    { from: [0, 9374], to: [100, 9374], label: '100' },
    { from: [6765, 2970], to: [6765, 3680], label: '710' },
    { from: [6765, 3680], to: [6765, 4280], label: '600' },
    { from: [6765, 4280], to: [6765, 5600], label: '1,320' },
    { from: [6964, 0], to: [6964, 2970], label: '2,970' },
    { from: [6964, 2970], to: [6964, 5600], label: '2,630' },
    { from: [6964, 5600], to: [6964, 7500], label: '1,900' },
    { from: [7162, 0], to: [7162, 5600], label: '5,600' },
  ],
  roomLabels: [{ text: '화장실(남)', at: [1481, 1530] }],
};
