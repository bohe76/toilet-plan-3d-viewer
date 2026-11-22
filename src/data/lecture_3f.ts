// 3층 강의동 화장실 확대평면도 (변경후) — PDF 2페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분(300dpi 기울기 보정 이미지, work/measure/p2/segments.json)을 mm로 환산했다.
// 측정 환산식: X = (px - 1835) * 4.355, Y = (py - 977.5) * 4.373.
// 원점 X=0은 가로 치수선 4,600의 서쪽 끝이다(서측 벽 중심). Y=0은 세로 치수선 6,800의 북쪽 끝이다(북측 벽 중심).
// 4,600의 동쪽 끝은 동측 벽 바깥 면이고, 6,800의 남쪽 끝은 남측 벽 바깥 면이다.
// 이 장은 가로와 세로의 축척이 다르다. 세로는 왼쪽·오른쪽 6,800(1554.5px, 1555px)이 4.373이다. 가로는 위·아래 4,600의 평균(1056.25px)이 4.355이다.
// 1,065 체인(733px, 4.359)과 750 체인(517.5px, 4.348)도 4.355 안팎이다. 보정값(mmPerPx 4.355, mmPerPxY 4.373)은 측정 환산식과 같다.
// 도면의 서쪽 세로선은 아래로 갈수록 오른쪽으로 기운다(서측 벽 바깥 면 1809.5 → 1813.5px, 위 4,600의 서쪽 보조선 1832.5px, 아래 1837.5px).
// 원점 x 1835는 평면 가운데 높이의 서측 벽 중심이다. 가로선은 오른쪽으로 갈수록 약간 위로 간다(북측 벽 중심선 977.75 → 977.5px). 원점 y는 평면 가운데 폭의 값이다.
// 벽 안쪽에 이중선이 있다. 굵은 선은 구조면이고, 약 20mm 안쪽의 가는 선은 마감선이다. 750 체인과 1,065 체인의 끝은 마감선이다.
// 그래서 벽 품목의 안쪽 면은 마감선 위치(서 120, 북 120, 동 4,380, 남 6,580)에 둔다.
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/lecture_3f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 lecture_3f_added.ts 에 있다.
// 양변기, 소변기, 세면기, 수전, 배수구, 칸 문, 가방걸이, 유리선반, 코너 비드의 형상과 가정 높이(SILL, HEAD, GAP, COUNTER)는 parts.ts 에 있다.
import { COUNTER, GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet, urinal } from './parts';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2350; // 천장고. 도면 표기 CH 2,350 (2곳)

/** 벽 안쪽 면(마감선). 서측, 북측, 동측, 남측 */
export const FACE = { w: 120, n: 120, e: 4380, s: 6580 };
/** 대변기 칸 전면 칸막이의 중심 Y. 남측 마감선에서 1,400(도면 표기) */
export const FRONT = FACE.s - 1400;

/**
 * 대변기 칸. 칸은 서쪽부터 1~4다. 모두 남측 벽에 붙고 변기는 북쪽을 본다.
 * west는 칸의 서쪽 면 X, cx는 양변기 중심 X, hinge는 문 경첩 X, open은 문 개구의 동쪽 끝 X, east는 동쪽 칸막이 중심 X다(칸 4는 동측 마감선).
 */
export const STALLS = [
  { n: 1, west: FACE.w, cx: 657, hinge: 381, open: 932, east: 1185 },
  { n: 2, west: 1185 + PT / 2, cx: 1725, hinge: 1450, open: 1999, east: 2250 },
  { n: 3, west: 2250 + PT / 2, cx: 2783, hinge: 2511, open: 3062, east: 3315 },
  { n: 4, west: 3315 + PT / 2, cx: 3850, hinge: 3578, open: 4124, east: FACE.e },
];

/** 서측 벽의 창 구간 [북쪽 끝 Y, 남쪽 끝 Y] */
export const WINDOWS: [number, number][] = [[354, 1555], [4358, 5556]];
/** 서측 벽의 환풍기 철거 구간(350X350) [북쪽 끝 Y, 남쪽 끝 Y]. 높이는 가정이다. */
/**
 * 창 문설주의 마감선 Y [북쪽, 남쪽]. 구조 선(1058.5 / 1333, 1973.5 / 2247.5px)에서 개구 쪽으로 약 20 안의 가는 선(1063 / 1328.5, 1977.5 / 2242.5px)이다.
 * 코너 비드 1, 2, 5, 6의 지시선 원이 이 선과 서측 마감선이 만나는 모서리에 있다.
 */
const WIN_FINISH: [number, number][] = [[374, 1535], [4372, 5532]];
/** 창틀 안쪽 면 X. 도면 x 1844.5 ~ 1846px(X 41 ~ 48)이다. 창대석의 서쪽 끝과 같다. */
const WIN_FRAME_IN = 44;
const VENT_HOLES: [number, number][] = [[1805, 2155], [3755, 4105]];
const HOLE_Z0 = 1900;
const HOLE_Z1 = 2250;

/** 북측 벽의 소변기 중심 X. 서쪽부터 1~3이다. 도면 기호(뒤판)의 가운데를 환산한 값이다. */
export const URINALS = [486, 1239, 1990];
/** 소변기 기호의 뒤판 폭과 마감선에서 앞 끝까지의 길이 */
const URINAL_W = 440;
const URINAL_D = 339;
/** 소변기 칸막이의 중심 X. 서측 마감선에서 750(도면 표기) 간격이다. */
const SCREENS = [FACE.w + 750, FACE.w + 1500, FACE.w + 2250];
/** 소변기 뒤 띠(두겁돌)의 남쪽 면 Y와 높이(가정) */
const CHASE_Y = 270;
const CHASE_H = 1000;

/** 세면대 옆 가림 칸막이의 중심 X (선분 환산값) */
export const SCREEN_X = 2572;
/** 세면기 중심. 북측 마감선에서 306 떨어져 남쪽을 본다. */
export const BASINS: [number, number][] = [[3072, 426], [3873, 426]];
const BASIN_R = 226;
/** 세면대 상판 앞 선의 Y (선분 환산값) */
export const COUNTER_Y = 717;

/** 동측 벽 출입구 [북쪽 끝 Y, 남쪽 끝 Y] */
export const ENTRANCE: [number, number] = [2200, 4095];
/**
 * 출입구 문틀 머리 아랫면 높이. 우상단 「"A" 단면상세도」의 환산값이다.
 * 상세도의 세로 축척은 치수 550(눈금 y 572.0 → 824.2px, 252.2px)에서 2.181 mm/px다.
 * 550의 아래 눈금(824.2px)은 화장실 천장선(822 ~ 824px, CH 2,350)과 문틀 머리 윗면(824.5px) 위에 있다.
 * 문틀 머리 아랫면은 855.5px다. 2,350 - (855.5 - 824.2) × 2.181 = 2,282.
 */
export const DOOR_HEAD = 2282;
/** 출입문 경첩. 도면 판독값 (4,518, 2,265)에서 Y를 3 옮겼다. 문짝 두께 40이 북쪽 문틀(Y 2,248까지)과 겹치지 않는다. 손잡이(lecture_3f_added)도 이 값을 쓴다. */
export const ENTRANCE_HINGE = { x: 4518, y: 2268 };
/**
 * 출입구 양쪽 문설주의 마감선 Y [북쪽, 남쪽]. 구조 선(1480.5, 1914px)에서 약 20mm 안쪽의 가는 선(1485, 1910px)이다.
 * 코너 비드 7, 8의 지시선 원이 이 선과 동측 마감선이 만나는 모서리에 있다.
 */
const JAMB_FINISH: [number, number] = [2220, 4078];
const doorHeadRemark = '높이는 우상단 「"A" 단면상세도」(출입구 남쪽 고정 유리를 동서로 자른 단면)의 환산값이다. 상세도의 세로 축척은 치수 550(눈금 y 572.0 → 824.2px)에서 2.181 mm/px다. 550의 아래 눈금은 화장실 천장선(CH 2,350)과 문틀 머리 윗면에 있다. 문틀 머리 아랫면(855.5px)은 천장에서 68 아래인 2,282다. 출입문 쪽 단면은 없다. 출입문도 같은 높이로 보았다.';

/** 조적벽 양 면 X와 남북 끝 Y */
const BRICK = { x0: 995, x1: 1116, y0: 1600, y1: 3774 };
/** 조적벽 서쪽 면의 수채기실 구간(Y 1,600 ~ 2,780) X. 가는 마감선 x 2059px(X 975.5)이다. 수채기 동쪽 끝(976)과 칸막이 동쪽 끝이 이 선에 닿는다. PS 구간은 치수 600을 따라 BRICK.x0 다. */
export const BRICK_MOP_W = 976;
/** 수채기실과 PS 사이 벽의 북쪽 면(마감선) Y. 구조면(약 2,800)에서 20 안쪽이다. */
const MOP_PS_N = 2780;

const westWallShapes = [
  box(-100, FACE.n, FACE.w, WINDOWS[0][0], 0, CH),
  box(-100, WINDOWS[0][0], FACE.w, WINDOWS[0][1], 0, SILL - 20), box(-100, WINDOWS[0][0], FACE.w, WINDOWS[0][1], HEAD, CH),
  box(-100, WINDOWS[0][1], FACE.w, VENT_HOLES[0][0], 0, CH),
  box(-100, VENT_HOLES[0][0], FACE.w, VENT_HOLES[0][1], 0, HOLE_Z0), box(-100, VENT_HOLES[0][0], FACE.w, VENT_HOLES[0][1], HOLE_Z1, CH),
  box(-100, VENT_HOLES[0][1], FACE.w, VENT_HOLES[1][0], 0, CH),
  box(-100, VENT_HOLES[1][0], FACE.w, VENT_HOLES[1][1], 0, HOLE_Z0), box(-100, VENT_HOLES[1][0], FACE.w, VENT_HOLES[1][1], HOLE_Z1, CH),
  box(-100, VENT_HOLES[1][1], FACE.w, WINDOWS[1][0], 0, CH),
  box(-100, WINDOWS[1][0], FACE.w, WINDOWS[1][1], 0, SILL - 20), box(-100, WINDOWS[1][0], FACE.w, WINDOWS[1][1], HEAD, CH),
  box(-100, WINDOWS[1][1], FACE.w, FACE.s, 0, CH),
];

const faceRemark = '벽 안쪽 면은 도면의 마감선(구조면에서 약 20mm 안쪽의 가는 선)에 두었다. 치수 750 체인과 1,065 체인이 이 선을 기준으로 한다.';
const infillRemark = '도면 좌상단 표의 「※ 환풍기 철거 구간 - 시멘트벽돌쌓기 (건축공사)」에 해당한다. 평면 위치는 해치 범위의 환산값이다. 높이는 가정값이다.';

const walls: Item[] = [
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽',
    remark: `${faceRemark} 바깥 면 Y -100은 선분 환산값(-101)이다. 바깥 면 선은 동쪽으로 이웃 벽까지 이어지지만 모델은 동측 벽 바깥 면(X 4,600)에서 잘랐다.`,
    shapes: [box(-100, -100, 4600, FACE.n, 0, CH)],
    dims: [dim('바깥 면에서 마감선까지', 220, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽 (창 2곳, 환풍기 철거 구간 2곳)',
    remark: `${faceRemark} 창대 높이와 창 상단 높이는 도면에 없다. 가정값이다. 환풍기 철거 구간(350X350)의 높이는 도면에 없다. 바닥에서 1,900 ~ 2,250으로 가정했다.`,
    shapes: westWallShapes,
    dims: [
      dim('바깥 면에서 마감선까지', 220, 'scaled'),
      dim('창 구간 (북쪽)', '354 ~ 1,555', 'scaled'), dim('창 구간 (남쪽)', '4,358 ~ 5,556', 'scaled'),
      dim('창대 높이', SILL, 'assumed'), dim('창 상단 높이', HEAD, 'assumed'),
    ],
  },
  {
    id: 'window-north', layer: 'wall', name: '서측 창 (북쪽)', material: 'glass',
    remark: '도면에 창호 번호가 없다. 유리면 위치는 창틀 선의 환산값이다. 높이는 가정값이다.',
    shapes: [box(-20, WINDOWS[0][0], 0, WINDOWS[0][1], SILL, HEAD)],
    dims: [dim('폭', WINDOWS[0][1] - WINDOWS[0][0], 'scaled'), dim('높이', HEAD - SILL, 'assumed')],
  },
  {
    id: 'window-south', layer: 'wall', name: '서측 창 (남쪽)', material: 'glass',
    remark: '도면에 창호 번호가 없다. 유리면 위치는 창틀 선의 환산값이다. 높이는 가정값이다.',
    shapes: [box(-20, WINDOWS[1][0], 0, WINDOWS[1][1], SILL, HEAD)],
    dims: [dim('폭', WINDOWS[1][1] - WINDOWS[1][0], 'scaled'), dim('높이', HEAD - SILL, 'assumed')],
  },
  {
    id: 'wall-vent-infill-north', layer: 'wall', name: '환풍기 철거 구간 벽돌쌓기 (북쪽)',
    note: '시멘트벽돌쌓기 (350X350)', remark: infillRemark,
    shapes: [box(-100, VENT_HOLES[0][0], FACE.w, VENT_HOLES[0][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('중심 Y', 1980, 'scaled'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'wall-vent-infill-south', layer: 'wall', name: '환풍기 철거 구간 벽돌쌓기 (남쪽)',
    note: '시멘트벽돌쌓기 (350X350)', remark: infillRemark,
    shapes: [box(-100, VENT_HOLES[1][0], FACE.w, VENT_HOLES[1][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('중심 Y', 3930, 'scaled'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽 (출입구 구간 포함)',
    remark: `${faceRemark} 바깥 면 X 4,600은 가로 치수선 4,600의 동쪽 끝이다. 출입구 구간의 양 끝은 선분 환산값이다. 출입구 위(2,282 ~ 2,350)는 문틀 머리만 있다. 「"A" 단면상세도」에서 화장실 천장선이 문틀 머리의 서쪽 면까지 이어지고 그 서쪽에 내림벽이 없다. 그래서 문틀 머리 서쪽(X 4,380 ~ 4,440)은 천장까지 비워 두었다.`,
    shapes: [
      box(FACE.e, FACE.n, 4600, ENTRANCE[0], 0, CH),
      box(FACE.e, ENTRANCE[1], 4600, FACE.s, 0, CH),
    ],
    dims: [dim('서측 벽 중심에서 바깥 면까지', 4600, 'drawn'), dim('출입구 구간', '2,200 ~ 4,095', 'scaled')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    remark: faceRemark,
    shapes: [box(-100, FACE.s, 4600, 6800, 0, CH)],
    dims: [dim('북측 벽 중심에서 바깥 면까지', 6800, 'drawn'), dim('마감선에서 바깥 면까지', 220, 'scaled')],
  },
  {
    id: 'wall-brick', layer: 'wall', name: '수채기실·PS 동측 조적벽', note: '0.5B 조적벽 신설 (H=3,450)',
    remark: '도면 표기 높이 3,450은 천장고(2,350)보다 높다. 모델은 천장면에서 잘랐다. 이 장에는 조적벽의 위치 치수가 없다. 구조선은 x 2063 / 2086.5px(X 993 / 1,095)이다. 동쪽 바깥의 가는 마감선 x 2091 ~ 2091.5px(X 1,116)은 행 1350 ~ 1560, 1800px에 있다(행 1680, 1760px은 거울 선과 붙는다). 서쪽 바깥의 가는 마감선 x 2059px(X 975.5)은 수채기실 구간(행 1350 ~ 1610px)에만 있고 PS 구간(행 1680 ~ 1800px)에는 없다(명암 기준 200). 동쪽 면(화장실 쪽)은 다른 벽과 같이 마감선 1,116에 두었다. 서쪽 면의 수채기실 구간(Y 1,600 ~ 2,780)은 마감선 976에 두었다. 수채기 동쪽 끝(976)과 수채기실 전면 칸막이의 동쪽 끝(x 2059px)이 이 선에 닿는다. 서쪽 면의 PS 구간은 치수 600(점검구 서쪽 문설주에서 조적벽 서쪽 구조면까지)의 끝을 따라 995에 두었다. 북쪽 끝은 구조선(y 1343.5px, Y 1,600)에 두었다. 그 바깥 y 1338 ~ 1339px의 선은 바닥 타일 나누기 선(Y 1,576)과 겹쳐서 마감선인지 정하지 못했다. 남쪽 끝은 PS 남측 벽의 남쪽 면(마감선)과 같다.',
    shapes: [box(BRICK.x0, MOP_PS_N, BRICK.x1, BRICK.y1, 0, CH), box(BRICK_MOP_W, BRICK.y0, BRICK.x1, MOP_PS_N, 0, CH)],
    dims: [dim('서측 벽 중심에서 구조 중심까지', 1045, 'scaled'), dim('구조 두께', 100, 'scaled'), dim('동쪽 마감 두께', 21, 'scaled'), dim('서쪽 마감 두께 (수채기실 구간)', 19, 'scaled'), dim('높이 (도면 표기)', 3450, 'drawn'), dim('높이 (모델, 천장면에서 자름)', CH, 'assumed')],
  },
  {
    id: 'wall-mop-ps', layer: 'wall', name: '수채기실과 PS 사이 벽',
    remark: '벽 중심 Y 2,900은 왼쪽 치수 2,900의 끝이다. 북쪽 면은 다른 벽과 같이 마감선(y 1614.5px, 실선)에 두었다. 구조면(1619px, Y 약 2,805)에서 20 안쪽인 2,780이다. 남쪽 면(PS 쪽)은 선분 환산값 3,000이다. 치수 1,200의 남쪽 보조선은 구조면(1619px)에 있다. 점검구 개구의 높이(FL+900, 900)는 도면 표기다. 개구는 PS 안의 치수 600(서쪽 문설주에서 조적벽 서쪽 면까지)을 따라 X 395 ~ 995에 두었다. 서쪽 문설주의 선 위치는 X 약 401이다.',
    shapes: [
      box(FACE.w, MOP_PS_N, 395, 3000, 0, CH),
      box(395, MOP_PS_N, BRICK.x0, 3000, 0, 900), box(395, MOP_PS_N, BRICK.x0, 3000, 1800, CH),
    ],
    dims: [dim('북측 벽 중심에서 벽 중심까지', 2900, 'drawn'), dim('두께', 200, 'scaled'), dim('점검구 개구', '600 x 900 (FL+900)', 'drawn')],
  },
  {
    id: 'wall-ps-south', layer: 'wall', name: 'PS 남측 벽',
    remark: '벽 중심 Y 3,700은 왼쪽 치수 2,900 + 800의 끝이다. 구조 두께는 선분 환산값(3,654 ~ 3,754)이다. 남쪽 면(화장실 쪽)은 다른 벽과 같이 마감선(y 1840.5px, Y 3,774)에 두었다. 구조선은 y 1835.5px(Y 3,752)이다(열 1900 ~ 2070px).',
    shapes: [box(FACE.w, 3650, BRICK.x0, BRICK.y1, 0, CH)],
    dims: [dim('북측 벽 중심에서 벽 중심까지', '2,900 + 800', 'drawn'), dim('구조 두께', 100, 'scaled'), dim('남쪽 마감 두께', 22, 'scaled')],
  },
  {
    id: 'wall-chase', layer: 'wall', name: '소변기 뒤 띠', note: 'THK20 화강석 두겁돌 설치 (L=2,300)',
    remark: '북측 벽 앞의 점묘 띠다. 길이 2,300은 서측 마감선에서 잰다(띠 동쪽 끝의 선 위치는 X 약 2,415). 폭 150은 선분 환산값(151)이다. 높이는 도면에 없다. 1,000으로 가정했다. 두겁돌 THK20은 그 위에 얹었다. 도면의 점묘 띠(x 1862 ~ 2389.5px, y 1005 ~ 1039px)는 끊기지 않는다. 소변기 뒤판은 띠 안에 그려져 있다. 그래서 띠를 끊지 않고 그렸다. 소변기 부품의 뒤판(벽에서 0 ~ 90)과 그릇의 벽 쪽 부분은 띠 안에 묻힌다.',
    shapes: [box(FACE.w, FACE.n, FACE.w + 2300, CHASE_Y, 0, CHASE_H), box(FACE.w, FACE.n, FACE.w + 2300, CHASE_Y, CHASE_H, CHASE_H + 20, 'granite')],
    dims: [dim('길이', 2300, 'drawn'), dim('폭', 150, 'scaled'), dim('두겁돌 두께', 20, 'drawn'), dim('높이', CHASE_H, 'assumed')],
  },
];

const stallGapRemark = '「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다.';

const stallPartition = (n: number, x: number): Item => ({
  id: `partition-${n}`, layer: 'partition', name: `대변기 칸막이 ${n}`, note: '12mm 지정칸막이 (H=1,950)',
  remark: `${stallGapRemark} 칸막이 중심 X는 치수 1,065 체인(동측 마감선 기준)의 값이다. 칸 깊이 1,400은 남측 마감선에서 잰 값으로 보았다.`,
  shapes: [box(x - PT / 2, FRONT, x + PT / 2, FACE.s, GAP, 1950)],
  dims: [dim('칸 폭', 1065, 'drawn'), dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('하부 틈', GAP, 'assumed')],
});

const front = (x0: number, x1: number) => box(x0, FRONT - PT / 2, x1, FRONT + PT / 2, GAP, 1950);

const partitions: Item[] = [
  stallPartition(1, 1185),
  stallPartition(2, 2250),
  stallPartition(3, 3315),
  {
    id: 'partition-front', layer: 'partition', name: '대변기 칸 전면 칸막이',
    remark: '도면의 「12mm 지정칸막이 (H=1,950)」 지시선은 칸 2와 칸 3 사이 칸막이를 가리킨다. 전면 패널의 높이와 두께는 같은 것으로 가정했다. 하부 틈도 가정값이다. 전면 선의 위치는 Y 약 5,188이다. 표기 치수 1,400을 남측 마감선(6,580)에서 재어 5,180에 두었다. 치수 1,400의 남쪽 끝 눈금은 마감선과 구조면 사이(Y 약 6,595)에 있다. 구조면(6,600)에서 재면 5,200이다. 문 개구의 양 끝은 선분 환산값이다.',
    shapes: STALLS.flatMap((s) => [front(s.west, s.hinge), front(s.open, s.east === FACE.e ? FACE.e : s.east - PT / 2)]),
    dims: [dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('문 개구 폭', '약 546 ~ 551', 'scaled'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-urinal', layer: 'partition', name: '소변기 칸막이 (3개)',
    remark: '소변기 사이와 동쪽 끝에 굵은 선 3개가 그려져 있다. 주기는 없다. 위치는 표기 치수 750 × 3(서측 마감선에서)을 따랐다. 선 위치는 X 약 860, 1,618, 2,365다. 길이는 선분 환산값(북측 마감선에서 약 455)이다. 높이와 두께는 도면에 없다. 바닥에서 400 ~ 1,650, 두께 12로 가정했다.',
    shapes: SCREENS.map((x) => box(x - PT / 2, FACE.n, x + PT / 2, 575, 400, 1650)),
    dims: [dim('간격', 750, 'drawn'), dim('길이', 455, 'scaled'), dim('높이', '400 ~ 1,650', 'assumed'), dim('두께', PT, 'assumed')],
  },
  {
    id: 'partition-screen', layer: 'partition', name: '세면대 옆 가림 칸막이', note: '12mm 지정칸막이 (800x1,600)',
    remark: '이 장에는 가림 칸막이의 위치 치수가 없다. 중심 X 2,572는 선분 환산값이다. 길이 800은 북측 마감선에서 잰다(남쪽 끝의 선 위치는 Y 약 916). 지시선이 칸막이 선에 이어져 남쪽으로 더 내려간다.',
    shapes: [box(SCREEN_X - PT / 2, FACE.n, SCREEN_X + PT / 2, FACE.n + 800, 0, 1600)],
    dims: [dim('길이', 800, 'drawn'), dim('높이', 1600, 'drawn'), dim('두께', PT, 'drawn'), dim('서측 벽 중심에서의 거리', SCREEN_X, 'scaled')],
  },
  {
    id: 'partition-under-basin', layer: 'partition', name: '세면대 하부 칸막이', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에는 동쪽 끝의 굵은 점선 1개(길이 약 500)만 그려져 있다. 상판 앞 선 바로 안쪽에 두었다.',
    shapes: [box(FACE.e - 500, COUNTER_Y - PT, FACE.e, COUNTER_Y, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('북측 마감선에서의 거리', COUNTER_Y - FACE.n, 'scaled')],
  },
  {
    id: 'partition-mop', layer: 'partition', name: '수채기실 전면 칸막이', note: '12mm 지정칸막이 (H=1,950)',
    remark: `${stallGapRemark} 지시선은 문 동쪽의 패널을 가리킨다. 문 서쪽 패널도 같은 선으로 그려져 있어 같은 칸막이로 보았다. 북쪽 면 Y 1,600은 치수 1,200(칸막이에서 수채기실 남측 벽의 북쪽 구조면 2,800까지. 보조선이 구조면 1619px에 있다)을 따랐다. 패널의 양 끝은 선분 환산값이다. 동쪽 끝은 조적벽 서쪽 마감선(x 2059px)이다.`,
    shapes: [box(FACE.w, 1600, 266, 1612, GAP, 1950), box(819, 1600, BRICK_MOP_W, 1612, GAP, 1950)],
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('수채기실 남측 벽까지', 1200, 'drawn'), dim('하부 틈', GAP, 'assumed')],
  },
];

const stallDoorText = {
  remark: '도면은 문을 칸 안쪽(남쪽)으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 문짝 폭은 문짝 선의 길이(약 131px)를 환산한 값이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
};

const doors: Item[] = [
  ...STALLS.map((s) => stallDoor(s.n, s.hinge, FRONT, 90, 575, stallDoorText)),
  stallDoor('mop', 266, 1606, 270, 566, {
    id: 'door-closet', name: '수채기실 문',
    remark: '12mm 칸막이와 같은 선으로 그려진 문이다. 도면은 문을 북쪽(화장실 쪽)으로 90도 연 상태로 그렸다. 문짝 폭은 문짝 선의 환산값이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
  }),
  {
    id: 'door-entrance', layer: 'door', name: '출입문 4-1/SSD', material: 'steelDoor',
    remark: `도면은 문을 동쪽(바깥)으로 90도 연 상태로 그렸다. 경첩은 개구의 북쪽 끝이다. 문짝 폭은 문짝 선의 환산값이다. 도면의 문짝 두께는 약 35(8px)다. 손잡이 부품(문짝 두께 40)에 맞춰 40으로 그렸다. 문틀(북쪽)은 도면의 외곽만 따랐다. 문짝 상단은 문틀 머리 아랫면이다. 문짝 아래 끝은 재료분리대 윗면(노출 10)이다. 경첩 Y는 도면 판독값 2,265에서 3 남쪽인 2,268이다. 문짝(두께 40)이 북쪽 문틀(Y 2,248까지)과 겹치지 않게 했다. 문틀 머리는 출입구 전체(고정 유리 구간 포함)에 걸쳐 천장까지 그렸다. 상세도의 문틀 머리 폭(73.5px = 160)은 평면의 문틀 폭(152)과 맞는다. 문틀 머리의 서쪽(X 4,380 ~ 4,440)에는 벽이 없다(상세도에서 화장실 천장선이 머리의 서쪽 면까지 이어진다). ${doorHeadRemark} 문짝 높이를 문틀 머리 아래 면까지로 본 것은 가정이다. 상세도는 고정 유리 부분을 자른다. 상세도의 주기 「THK.9.5 석고보드2겹 / 퍼티 위 수성광택페인트 2회 (출입구 부분)」은 문틀 머리 위 복도 쪽 석고보드를 가리킨다. 석고보드 점묘는 문틀 머리 윗면에서 슬래브까지 이어진다. 화장실 천장보다 위이고 복도 쪽이라서 그리지 않았다. 상세도의 나머지 주기 6개(Ø9 앵커볼트, 90x90x6T STL PL, C-120x50x20x2.3T, C-120x50x20x2.3T@450, 30x30x3T@450, 기존 천장재)는 모두 화장실 천장 위의 부재라서 품목을 만들지 않았다. 문짝 폭 993(그려진 길이)으로 문을 닫으면 문짝 끝(Y 3,261)이 고정 유리의 북쪽 틀(Y 3,245 ~)과 16 겹친다. 모델은 도면처럼 연 상태만 그린다. 폭은 그려진 길이를 그대로 두었다.`,
    shapes: [
      { type: 'leaf', hx: ENTRANCE_HINGE.x, hy: ENTRANCE_HINGE.y, width: 993, angleDeg: 0, thickness: 40, z0: 10, z1: DOOR_HEAD },
      box(4440, ENTRANCE[0], 4592, 2248, 0, DOOR_HEAD),
      // 문틀 머리 (출입구 전체, 천장까지)
      box(4440, ENTRANCE[0], 4592, ENTRANCE[1], DOOR_HEAD, CH),
    ],
    dims: [dim('문짝 폭', 993, 'scaled'), dim('문짝 높이', DOOR_HEAD, 'assumed'), dim('문틀 머리 아래 면 높이', DOOR_HEAD, 'scaled'), dim('문틀 머리 높이', `${DOOR_HEAD.toLocaleString('en-US')} ~ ${CH.toLocaleString('en-US')}`, 'scaled')],
  },
  {
    id: 'door-entrance-side', layer: 'door', name: '출입문 옆 고정 유리', material: 'glass',
    remark: `출입문 남쪽에 위아래 틀과 가는 이중선(유리)이 그려져 있다. 고정 유리로 해석했다. 이름은 도면에 없다. 상단은 문틀 머리 아랫면이다. ${doorHeadRemark}`,
    shapes: [
      box(4510, 3297, 4531, 4045, 0, DOOR_HEAD),
      box(4440, 3245, 4592, 3297, 0, DOOR_HEAD, 'steelDoor'),
      box(4440, 4045, 4592, ENTRANCE[1], 0, DOOR_HEAD, 'steelDoor'),
    ],
    dims: [dim('유리 길이', 748, 'scaled'), dim('높이', DOOR_HEAD, 'scaled')],
  },
  {
    id: 'door-ps-hatch', layer: 'door', name: 'PS 점검구 5/SSD', note: "SST'L 점검구 설치 (FL+900) (600x900)", material: 'metal',
    remark: '도면은 점검구 문을 수채기실 쪽으로 45도 연 상태로 그렸다. parts.ts 의 문 부품은 90도 단위만 받아 leaf 도형을 직접 썼다. 문짝은 도면의 이중선으로 그려져 있다. 문짝 축은 이중선의 중심선(행 1555 ~ 1610px에서 x 1996.5 → 1941.5px, 기울기 -1)이다. 그려진 문짝의 경첩 쪽 끝은 두 선의 끝(1931.5, 1615)px과 (1937.5, 1619)px의 가운데 (1934.5, 1617)px = (433, 2,797)이다. 그 점에 두면 문짝 두께(30)의 서쪽 뒤 모서리가 서쪽 문설주(X 395 ~ 427)를 4.6 뚫는다. 그래서 경첩을 동쪽으로 7 옮겨 (440, 2,797)에 두었다. 그려진 문짝의 길이(경첩 쪽 끝에서 문짝 끝 y 약 1531px까지)는 환산 540이다. 모델의 문짝 폭도 540이다. 이 폭으로 문을 닫으면 문짝 끝(X 980)이 동쪽 문설주의 좁은 곳(X 962 ~)과 18 겹친다. 모델은 도면처럼 연 상태만 그린다. 폭은 그려진 길이를 그대로 두었다. 도면의 문 열림 호는 X 약 967에서 끝난다. 두께 30은 두 선의 중심 간격(가로 10px)을 문짝에 수직으로 환산한 값이다. 개구 폭은 태그 아래의 치수 600(서쪽 문설주에서 조적벽 서쪽 면까지)이다. 600은 벽 개구의 폭이고 문짝 폭의 근거가 아니다. 문짝은 문틀 안에 그려져 있다(경첩은 개구 서쪽 끝에서 45 안쪽). 문설주 2개는 도면의 문틀 사각형(서쪽 x 1926.5 ~ 1933 / 1936px, 동쪽 2056 / 2053.5 ~ 2063.5px, y 1614 ~ 1623 / 1643px)을 환산해 넣었다. 문설주의 북쪽 끝은 벽 북쪽 면(마감선 2,780)이다. 문틀의 위아래 높이는 도면에 없어 개구(900 ~ 1,800)를 따랐다.',
    shapes: [
      { type: 'leaf', hx: 440, hy: 2797, width: 540, angleDeg: 315, thickness: 30, z0: 900, z1: 1800 },
      // 문설주(서쪽, 동쪽). 도면의 문틀 사각형이다. 마감선(y 1614px)에서 턱(1623px)까지는 좁고, 턱에서 1643px까지는 넓다. 높이는 개구를 따랐다(가정).
      box(395, MOP_PS_N, 427, 2823, 900, 1800), box(395, 2823, 440, 2910, 900, 1800),
      box(962, MOP_PS_N, BRICK.x0, 2823, 900, 1800), box(950, 2823, BRICK.x0, 2910, 900, 1800),
    ],
    dims: [dim('벽 개구', '600 x 900', 'drawn'), dim('하단 높이', 'FL+900', 'drawn'), dim('문짝 폭 (그려진 길이)', 540, 'scaled'), dim('열린 각도', '45도', 'scaled'), dim('두께', 30, 'scaled'), dim('문설주 폭 (좁은 곳 / 넓은 곳)', '서 32 / 45, 동 33 / 45', 'scaled'), dim('문설주 높이', '900 ~ 1,800', 'assumed')],
  },
];

const toiletRemark = '평면 크기는 도면 축척 환산값이다. 높이와 곡면 형상은 가정값이다. 뚜껑을 닫은 상태로 그렸다. 길이 726은 남측 마감선(y 약 2482px)에서 기호의 앞 끝(y 2314 ~ 2316px)까지의 환산값이다(부품 기본값 740). 탱크 깊이는 도면이 약 186, 부품이 206이다. 부품에 인자가 없어 그대로 두었다.';

const fixtures: Item[] = [
  // 양변기는 남측 마감선(Y 6,580)에 붙어 북쪽을 본다. 중심 X는 물탱크 선의 환산값이다. 길이는 도면 기호의 환산값 726이다.
  ...STALLS.map((s) => toilet(s.n, s.cx, FACE.s, 270, { remark: toiletRemark }, 726)),
  // 소변기는 북측 마감선(Y 120)에 붙어 남쪽을 본다. 뒤판과 그릇의 벽 쪽 부분은 소변기 뒤 띠 안에 묻힌다.
  ...URINALS.map((x, i) => urinal(i + 1, x, FACE.n, 90, URINAL_W, URINAL_D)),
  // 세면기는 북측 마감선(Y 120)에서 306 떨어져 남쪽을 본다. 도면의 세면기 기호에 토수구 1개와 손잡이 2개가 그려져 있다.
  ...BASINS.map(([x, y], i) => basin(i + 1, x, y, '북측 마감선에서 중심까지', y - FACE.n, BASIN_R)),
  ...BASINS.map(([x, y], i) => faucet(i + 1, x, y, 90, BASIN_R)),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 외곽은 모서리를 둥글린 사각형(반지름 약 20px)이다. 조적벽 서쪽 면에 붙어 있다. 도면의 동쪽 끝(976)은 조적벽 서쪽 마감선(x 2059px)이다. 모델은 벽 마감 면(3mm) 앞인 973에서 끝냈다. 높이와 안쪽 형상은 가정값이다.',
    shapes: [
      rbox(510, 1673, BRICK_MOP_W - 3, 2235, 0, 260, 80),
      { type: 'plate', x0: 510, y0: 1673, x1: BRICK_MOP_W - 3, y1: 2235, z0: 260, z1: 350, r: 80, holes: [{ x0: 571, y0: 1727, x1: 923, y1: 2178, r: 50 }] },
      // 배수구. 도면의 원 중심 (2005.5, 1424.5)px이다. 외곽의 중심과 같다.
      cyl(743, 1955, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭 (동서)', 466, 'scaled'), dim('길이 (남북)', 562, 'scaled'), dim('높이', 350, 'assumed')],
  },
  // 배수구는 구배 바닥(floor-main)의 낮은 점에 있다. 바닥 높이 -10(구배 깊이, 가정)에 둔다.
  floorDrain('fd-main', 2622, 3678, -10),
  floorDrain('fd-basin', 3538, 617, -10),
];

const glassShelfText = { note: '유리선반 설치 (r=300) (기계설비공사)' };
const stallHookText = {
  note: '가방걸이 설치',
  remark: '도면의 칸 문 4개에 가방걸이 기호가 그려져 있다. 지시선은 칸 2의 기호를 가리킨다. 기호는 문짝의 서쪽 면에 있다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다.',
};

const beadRemark = '위치는 도면의 지시선이 가리키는 벽 모서리다. 폭과 두께는 도면에 없다. 가정값이다.';
const windowBeadText = { remark: `${beadRemark} 지시선 끝의 원은 창 문설주의 마감 모서리(서측 마감선과 창 쪽 마감선이 만나는 점)를 가리킨다. 그 모서리에 붙였다. 창 쪽 마감선은 구조 선에서 개구 쪽으로 약 20 안의 가는 선이다. 창 개구 옆이라서 높이는 창대 윗면(1,200)에서 창 상단(2,100)까지로 두었다. 두 높이 모두 가정값이다.` };
const brickBeadText = { remark: `${beadRemark} 지시선 끝의 원은 조적벽의 마감 모서리를 가리킨다. 비드 3의 원 중심은 (2090.75, 1339.5)px, 비드 4는 (2092.5, 1840.5)px이다. 동쪽 마감선 X 1,116과 PS 남측 벽의 남쪽 마감선 Y 3,774의 모서리에 붙였다. 비드 3의 Y는 조적벽 북쪽 끝의 구조선(1,600)이다. 원 중심(Y 약 1,583)과 17 다르다. 그 자리의 가는 선이 타일 나누기 선과 겹쳐서 마감선을 정하지 못했다.` };
const entranceBeadText = { remark: `${beadRemark} 지시선 끝의 원은 문설주의 마감 모서리(동측 마감선과 출입구 마감선이 만나는 점)를 가리킨다. 그 모서리(X 4,380, Y 2,220 / 4,078)에 붙였다. 높이는 바닥에서 천장까지다. 상세도에서 문틀 머리의 서쪽에 벽이 없어 개구의 측면이 천장까지 이어진다.` };

const accessories: Item[] = [
  ...WINDOWS.map(([y0, y1], i): Item => ({
    id: `window-sill-${i + 1}`, layer: 'accessory', name: `창대석 (${i === 0 ? '북쪽' : '남쪽'} 창)`, note: 'THK20 인조대리석 창대석 설치 (W=100)', material: 'marble',
    remark: '평면 위치는 도면의 점묘 범위를 환산한 값이다(안쪽 끝 X 약 144). 창대석이 벽 마감선 안쪽으로 약 24 나온다. 높이는 가정값이다.',
    shapes: [box(44, y0, 144, y1, SILL - 20, SILL)],
    dims: [dim('폭', 100, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  })),
  {
    id: 'mirror-basin', layer: 'accessory', name: '세면대 방습거울', note: 'THK.5 방습거울 (기계설비공사) (1,800X1,000)', material: 'mirror',
    facing: [0, 1],
    remark: '평면 범위는 가림 칸막이의 동쪽 면에서 동측 마감선까지다(환산 1,802). 하단 높이는 가정값이다.',
    shapes: [box(SCREEN_X + PT / 2, FACE.n, FACE.e, FACE.n + 5, 1000, 2000)],
    dims: [dim('폭', 1800, 'drawn'), dim('높이', 1000, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 1000, 'assumed')],
  },
  {
    id: 'mirror-full', layer: 'accessory', name: '전신 방습거울', note: 'THK.5 방습거울 (기계설비공사) (600X1,500)', material: 'mirror',
    facing: [1, 0],
    remark: '조적벽의 동쪽 면에 있다. 평면 위치는 도면의 굵은 선(Y 2,873 ~ 3,472)을 환산한 값이다. 하단 높이는 가정값이다.',
    shapes: [box(BRICK.x1, 2873, BRICK.x1 + 5, 3473, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, 'assumed')],
  },
  {
    id: 'counter', layer: 'accessory', name: '세면대 상판', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(Y 717의 실선, 가림 칸막이에서 동측 마감선까지)을 환산한 값이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      {
        type: 'plate', x0: SCREEN_X + PT / 2, y0: FACE.n, x1: FACE.e, y1: COUNTER_Y, z0: COUNTER - 20, z1: COUNTER,
        holes: BASINS.map(([cx, cy]) => ({ cx, cy, r: BASIN_R - 10 })),
      },
      // 뒷턱
      box(SCREEN_X + PT / 2, FACE.n, FACE.e, FACE.n + 15, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', FACE.e - SCREEN_X - PT / 2, 'scaled'), dim('깊이', COUNTER_Y - FACE.n, 'scaled'), dim('윗면 높이', COUNTER, 'assumed'), dim('두께', 20, 'assumed')],
  },
  // 유리선반은 칸의 남서 모서리에 있다(도면의 점선 1/4 원). 지시선은 칸 2의 선반을 가리킨다.
  ...STALLS.map((s) => glassShelf(s.n, s.west, FACE.s, 270, 300, glassShelfText)),
  ...STALLS.map((s) => stallHook(s.n, s.hinge, FRONT, 90, 1, 295, stallHookText)),
  {
    id: 'threshold', layer: 'accessory', name: '화강석 재료분리대', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치(출입문 개구, Y 2,248 ~ 3,245)다. 두께 30은 석재 두께다. 바닥 위로 드러나는 높이는 도면에 없다. 10으로 가정했다.',
    shapes: [box(4440, 2248, 4590, 3245, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 997, 'scaled'), dim('노출 높이', 10, 'assumed')],
  },
  {
    id: 'tactile-blocks', layer: 'accessory', name: '점형블럭 2EA', note: '점형블럭 2EA (매립형)', material: 'tactile',
    remark: '동측 벽 바깥 면에서 300(도면 표기) 떨어져 있다. 남북으로 2장이 붙어 있다. 남북 위치는 선분 환산값이다.',
    shapes: [box(4900, 3396, 5200, 3695, 0, 5), box(4900, 3699, 5200, 3997, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('벽 바깥 면에서의 거리', 300, 'drawn'), dim('1장 크기', '약 300 x 300', 'scaled')],
  },
  {
    id: 'braille-sign', layer: 'accessory', name: '점자표지판', note: '벽면점자표지판설치', material: 'metal',
    remark: '도면의 표시는 출입문 남쪽 고정 유리 구간의 동측 벽 바깥 면에 그린 짧은 선(약 105)이다. 그 길이를 폭으로 썼다. 두께와 설치 높이는 가정값이다.',
    shapes: [box(4600, 3667, 4616, 3772, 1400, 1550)],
    dims: [dim('위치', '출입구 바깥 면', 'scaled'), dim('폭', 105, 'scaled'), dim('설치 높이', 1400, 'assumed')],
  },
  {
    id: 'gallery-north', layer: 'accessory', name: '갤러리창 2/AG (북쪽)', note: '갤러리창 설치 (350X350)', material: 'metal',
    remark: '서측 벽 바깥 면에 그려져 있다. 평면 위치는 환산값이다. 설치 높이는 가정값이다(벽돌쌓기 구간과 같게 두었다).',
    shapes: [box(-140, VENT_HOLES[0][0], -100, VENT_HOLES[0][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'gallery-south', layer: 'accessory', name: '갤러리창 2/AG (남쪽)', note: '갤러리창 설치 (350X350)', material: 'metal',
    remark: '서측 벽 바깥 면에 그려져 있다. 평면 위치는 환산값이다. 설치 높이는 가정값이다(벽돌쌓기 구간과 같게 두었다).',
    shapes: [box(-140, VENT_HOLES[1][0], -100, VENT_HOLES[1][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  // 코너 비드. 도면의 「코너 비드 설치」 지시선 8개가 가리키는 벽 모서리에 붙였다. 8곳 모두 표기가 「코너 비드」다.
  // 창 옆은 창대 윗면에서 창 상단까지, 출입구 옆과 조적벽 끝은 바닥에서 천장까지다.
  cornerBead(1, '북쪽 창 북단 모서리', [box(FACE.w, WIN_FINISH[0][0] - 30, FACE.w + 5, WIN_FINISH[0][0], SILL, HEAD), box(FACE.w - 25, WIN_FINISH[0][0], FACE.w + 5, WIN_FINISH[0][0] + 5, SILL, HEAD)], windowBeadText),
  cornerBead(2, '북쪽 창 남단 모서리', [box(FACE.w, WIN_FINISH[0][1], FACE.w + 5, WIN_FINISH[0][1] + 30, SILL, HEAD), box(FACE.w - 25, WIN_FINISH[0][1] - 5, FACE.w + 5, WIN_FINISH[0][1], SILL, HEAD)], windowBeadText),
  cornerBead(3, '조적벽 북동 모서리', [box(BRICK.x1, BRICK.y0 - 5, BRICK.x1 + 5, BRICK.y0 + 25, 0, CH), box(BRICK.x1 - 25, BRICK.y0 - 5, BRICK.x1 + 5, BRICK.y0, 0, CH)], brickBeadText),
  cornerBead(4, '조적벽 남동 모서리', [box(BRICK.x1, BRICK.y1 - 25, BRICK.x1 + 5, BRICK.y1 + 5, 0, CH), box(BRICK.x1 - 25, BRICK.y1, BRICK.x1 + 5, BRICK.y1 + 5, 0, CH)], brickBeadText),
  cornerBead(5, '남쪽 창 북단 모서리', [box(FACE.w, WIN_FINISH[1][0] - 30, FACE.w + 5, WIN_FINISH[1][0], SILL, HEAD), box(FACE.w - 25, WIN_FINISH[1][0], FACE.w + 5, WIN_FINISH[1][0] + 5, SILL, HEAD)], windowBeadText),
  cornerBead(6, '남쪽 창 남단 모서리', [box(FACE.w, WIN_FINISH[1][1], FACE.w + 5, WIN_FINISH[1][1] + 30, SILL, HEAD), box(FACE.w - 25, WIN_FINISH[1][1] - 5, FACE.w + 5, WIN_FINISH[1][1], SILL, HEAD)], windowBeadText),
  cornerBead(7, '출입구 북쪽 모서리', [box(FACE.e - 5, JAMB_FINISH[0] - 30, FACE.e, JAMB_FINISH[0], 0, CH), box(FACE.e - 5, JAMB_FINISH[0], FACE.e + 25, JAMB_FINISH[0] + 5, 0, CH)], entranceBeadText),
  cornerBead(8, '출입구 남쪽 모서리', [box(FACE.e - 5, JAMB_FINISH[1], FACE.e, JAMB_FINISH[1] + 30, 0, CH), box(FACE.e - 5, JAMB_FINISH[1] - 5, FACE.e + 25, JAMB_FINISH[1], 0, CH)], entranceBeadText),
];

const lightRemark = '도면에 손으로 적은 「조명」 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-mop', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 342, cy: 2159, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-ps', layer: 'light', name: '조명 표시 (PS)', note: '손글씨 「조명」', remark: `${lightRemark} 표시는 PS 안에 있다.`,
    lamp: { power: 0.6 },
    shapes: [{ type: 'cylinder', cx: 342, cy: 3340, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

const floorNote = '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)';
/** 세면대 앞 구배 구역의 남쪽 끝 Y. 가정 */
const BASIN_ZONE_Y = 1300;

// 마감. 도면 좌상단 「지상2층 강의동 화장실 마감 변경부분」 표(3층 도면이지만 표 제목은 2층이다)와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
const finishes: Item[] = [
  {
    id: 'floor-main', layer: 'finish', name: '바닥 마감 (화장실)', material: 'floorTile', note: floorNote,
    remark: `평면의 주기는 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 출입구 앞의 「+」 표시 구역은 두 구간이다. 남북 구간은 X 3,397 ~ 4,380(동측 마감선), Y 2,044 ~ 4,246이다. 출입구 구간(Y 2,200 ~ 4,095)에서는 「+」가 문설주 띠와 재료분리대 위를 지나 재료분리대의 동쪽 끝(x 2890px = X 약 4,595, 맨 동쪽 「+」 열의 중심 x 2881.5px = X 약 4,558)까지 간다. 고정 유리 구간(Y 3,297 ~ 4,045)에는 양 끝 틀 사이 X 4,440 ~ 4,592에 바닥을 채웠다(높이 -10 ~ 0. 유리는 그 위 z 0에서 선다). 「+」 구역의 주기는 「기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 마감 타일이 같아서 나누지 않았다. 도면의 구배 표시는 물이 빠지는 방향(바닥 구배)이다. 화장실 가운데 배수구(fd-main)에는 완전한 X가 있다. 대각선 4개가 배수구로 모이고 팔마다 배수구 쪽 화살표가 있다(팔 끝 X 약 1,982 ~ 3,266, Y 약 3,075 ~ 4,275. 위쪽 끝 (2289, 1681)px, (2584, 1681)px). 세면대 아래 배수구(fd-basin)에는 완전한 X가 아니라 남서와 남동에서 배수구 쪽으로 향하는 화살표 2개만 있다(꼬리 (2507, 1265)px, (2784, 1264)px = X 약 2,928, 4,133, Y 약 1,255). 그래서 세면대 앞 구역(Y ${BASIN_ZONE_Y.toLocaleString('en-US')}까지)과 나머지를 나눠 각각 그 배수구로 기울였다. 나누는 선의 위치와 구배 깊이(10)는 가정이다. 바닥 가장자리는 0, 배수구 위치는 -10이다. 소변기 앞과 서쪽 칸 앞은 평탄하게 두었다. 줄눈 위치는 도면의 타일 나누기 선(X 2,918, Y 2,176에서 600 간격)에 맞췄다. 색과 무늬는 도면에 없다. 가정이다.`,
    shapes: [
      { type: 'pan', x0: SCREEN_X + PT / 2, y0: FACE.n, x1: FACE.e, y1: BASIN_ZONE_Y, z: 0, drop: 10, cx: 3538, cy: 617 },
      { type: 'pan', x0: BRICK.x1, y0: BASIN_ZONE_Y, x1: FACE.e, y1: FACE.s, z: 0, drop: 10, cx: 2622, cy: 3678 },
      box(FACE.w, FACE.n, SCREEN_X + PT / 2, BASIN_ZONE_Y, -10, 0),
      box(FACE.w, BASIN_ZONE_Y, BRICK.x1, 1600, -10, 0),
      box(FACE.w, BRICK.y1, BRICK.x1, FACE.s, -10, 0),
      box(FACE.e, ENTRANCE[0], 4440, ENTRANCE[1], -10, 0),
      // 고정 유리 아래 (양 끝 틀 사이, 문틀 폭 전체). 도면의 「+」가 유리 양쪽에서 x 2888px까지 간다. 유리(z 0 ~)는 이 상자 위에 선다.
      box(4440, 3297, 4592, 4045, -10, 0),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이', 10, 'assumed'), dim('줄눈 시작점', 'X 2,918, Y 2,176', 'scaled')],
  },
  {
    id: 'floor-mop', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'floorTile',
    remark: '수채기실 바닥의 별도 주기는 도면에 없다. 좌상단 표의 바닥 마감과 같은 것으로 가정했다. 평탄하게 그렸다.',
    shapes: [box(FACE.w, 1612, BRICK_MOP_W, MOP_PS_N, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'assumed')],
  },
  {
    id: 'wall-finish-main', layer: 'finish', name: '벽 마감 (화장실)', material: 'wall',
    note: '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착',
    remark: '벽의 안쪽 면(마감선)에 얇은 면(3mm)을 붙여 그렸다. 타일 두께 10으로 그리면 벽에 붙은 거울을 덮는다. 개구 옆의 문설주 면은 3mm가 아니다. 창 문설주 면 상자 4개는 구조 선에서 창 쪽 마감선까지(두께 14 ~ 24), 창틀 안쪽 면(X 44)에서 서측 마감선까지다. 출입구 양 끝 상자 2개는 구조 선에서 문설주 마감선까지(두께 17 ~ 20), 동측 마감선에서 문틀까지다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다. PS 안쪽 면은 그리지 않았다.',
    shapes: [
      // 북측 벽
      box(FACE.w, FACE.n, FACE.e, FACE.n + 3, 0, CH),
      // 서측 벽 (창 구간은 창대 아래와 창 위)
      box(FACE.w, FACE.n, FACE.w + 3, WINDOWS[0][0], 0, CH),
      box(FACE.w, WINDOWS[0][0], FACE.w + 3, WINDOWS[0][1], 0, SILL - 20), box(FACE.w, WINDOWS[0][0], FACE.w + 3, WINDOWS[0][1], HEAD, CH),
      box(FACE.w, WINDOWS[0][1], FACE.w + 3, MOP_PS_N, 0, CH),
      box(FACE.w, BRICK.y1, FACE.w + 3, WINDOWS[1][0], 0, CH),
      box(FACE.w, WINDOWS[1][0], FACE.w + 3, WINDOWS[1][1], 0, SILL - 20), box(FACE.w, WINDOWS[1][0], FACE.w + 3, WINDOWS[1][1], HEAD, CH),
      box(FACE.w, WINDOWS[1][1], FACE.w + 3, FACE.s, 0, CH),
      // 창 문설주의 마감 (구조 선에서 창 쪽 마감선까지, 창틀 안쪽 면에서 서측 마감선까지, 창대 윗면에서 창 상단까지)
      ...WINDOWS.flatMap(([y0, y1], i) => [box(WIN_FRAME_IN, y0, FACE.w, WIN_FINISH[i][0], SILL, HEAD), box(WIN_FRAME_IN, WIN_FINISH[i][1], FACE.w, y1, SILL, HEAD)]),
      // 동측 벽 (출입구 구간은 비운다. 출입구 위에 벽이 없다)
      box(FACE.e - 3, FACE.n, FACE.e, ENTRANCE[0], 0, CH), box(FACE.e - 3, ENTRANCE[1], FACE.e, FACE.s, 0, CH),
      // 출입구 양쪽 문설주의 마감 (구조 선에서 마감선까지, 동측 마감선에서 문틀까지)
      box(FACE.e, ENTRANCE[0], 4440, JAMB_FINISH[0], 0, CH), box(FACE.e, JAMB_FINISH[1], 4440, ENTRANCE[1], 0, CH),
      // 남측 벽
      box(FACE.w, FACE.s - 3, FACE.e, FACE.s, 0, CH),
      // 조적벽 동쪽 면과 양 끝면, PS 남측 벽의 남쪽 면
      box(BRICK.x1, BRICK.y0, BRICK.x1 + 3, BRICK.y1, 0, CH), box(BRICK_MOP_W, BRICK.y0 - 3, BRICK.x1, BRICK.y0, 0, CH), box(FACE.w, BRICK.y1, BRICK.x1, BRICK.y1 + 3, 0, CH),
      // 수채기실 (조적벽 서쪽 면, 남측 벽 북쪽 면). 남측 벽 북쪽 면은 점검구 개구(X 395 ~ 995, 높이 900 ~ 1,800)를 비운다.
      box(BRICK_MOP_W - 3, 1612, BRICK_MOP_W, MOP_PS_N, 0, CH),
      box(FACE.w, MOP_PS_N - 3, 395, MOP_PS_N, 0, CH), box(395, MOP_PS_N - 3, BRICK_MOP_W - 3, MOP_PS_N, 0, 900), box(395, MOP_PS_N - 3, BRICK_MOP_W - 3, MOP_PS_N, 1800, CH),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'ceiling', layer: 'finish', name: '천장 마감', material: 'ceiling',
    note: '천장 : 경량철골 천장틀위 금속재 흡음천장 (AL. 600각)',
    remark: '실내에서 볼 때만 그린다. 위에서 내려다볼 때는 그리지 않는다. 수채기실과 PS의 천장 마감은 도면에 없다. 화장실과 같은 것으로 가정했다. 패널 나누기 위치도 가정이다.',
    shapes: [box(-100, -100, 4600, 6800, CH, CH + 30)],
    dims: [dim('천장고', CH, 'drawn'), dim('패널 크기', '600 x 600', 'drawn')],
  },
];

export const lecture3fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1835, 977.5],
  mmPerPx: 4.355,
  mmPerPxY: 4.373,
};

export const lecture3fModel: SheetModel = {
  ceilingHeight: CH,
  bounds: { x0: -100, y0: -100, x1: 4600, y1: 6800 },
  // 출입구 안쪽에서 북서쪽(소변기와 수채기실)을 본다.
  eye: { from: [3900, 3700, 1600], to: [1300, 700, 1100] },
  // 남동쪽에서 본다. 변기(남측 벽)와 소변기·세면기(북측 벽)가 마주 보는 벽에 붙어 있다. 벽을 다 세우면 어느 방향에서도 한쪽이 가린다.
  // 기본 절단 높이는 천장고라서 아이소 화면에서는 앞쪽 벽이 실내 일부를 가린다. 슬라이더를 1,200으로 내리면 모두 보인다. 전신 거울(조적벽 동쪽 면)도 보이는 남동쪽을 골랐다.
  isoDir: [1, 1],
  // 창은 서측 벽에 있다. 자연광은 서쪽에서 동쪽으로 들어온다.
  daylightDir: [1, 0.2],
  tileOrigin: { floorTile: [2918, 2176] },
  items: [...walls, ...partitions, ...doors, ...fixtures, ...accessories, ...lights, ...finishes],
  // 치수선 위치는 도면의 치수선 위치와 같다. 왼쪽 치수선은 도면에서 기울어 있어 평면 가운데 높이의 위치를 썼다.
  dimLines: [
    { from: [0, -2514], to: [4600, -2514], label: '4,600' },
    { from: [0, -2313], to: [3325, -2313], label: '3,325' },
    { from: [3325, -2313], to: [4600, -2313], label: '1,275' },
    { from: [0, 9107], to: [2325, 9107], label: '2,325' },
    { from: [2325, 9107], to: [3325, 9107], label: '1,000' },
    { from: [3325, 9107], to: [4600, 9107], label: '1,275' },
    { from: [0, 9306], to: [4600, 9306], label: '4,600' },
    { from: [-3149, 0], to: [-3149, 6800], label: '6,800' },
    { from: [-2951, 0], to: [-2951, 2900], label: '2,900' },
    { from: [-2951, 2900], to: [-2951, 6800], label: '3,900' },
    { from: [-2750, 0], to: [-2750, 2000], label: '2,000' },
    { from: [-2750, 2000], to: [-2750, 2900], label: '900' },
    { from: [-2750, 2900], to: [-2750, 3700], label: '800' },
    { from: [-2750, 3700], to: [-2750, 6800], label: '3,100' },
    { from: [7567, 0], to: [7567, 2000], label: '2,000' },
    { from: [7567, 2000], to: [7567, 5000], label: '3,000' },
    { from: [7567, 5000], to: [7567, 6800], label: '1,800' },
    { from: [7761, 0], to: [7761, 6800], label: '6,800' },
    { from: [FACE.w, 829], to: [SCREENS[0], 829], label: '750' },
    { from: [SCREENS[0], 829], to: [SCREENS[1], 829], label: '750' },
    { from: [SCREENS[1], 829], to: [SCREENS[2], 829], label: '750' },
    { from: [1346, 1600], to: [1346, 2800], label: '1,200' },
    { from: [395, 3286], to: [BRICK.x0, 3286], label: '600' },
    { from: [1185, 4889], to: [2250, 4889], label: '1,065' },
    { from: [2250, 4889], to: [3315, 4889], label: '1,065' },
    { from: [3315, 4889], to: [FACE.e, 4889], label: '1,065' },
    { from: [999, FRONT], to: [999, FACE.s], label: '1,400' },
    { from: [4600, 4196], to: [4900, 4196], label: '300' },
  ],
  roomLabels: [{ text: '화장실(남)', at: [2334, 1751] }, { text: 'PS', at: [553, 3409] }],
};
