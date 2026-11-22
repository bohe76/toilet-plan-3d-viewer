// 4층 강의동 화장실 확대평면도 (변경후) — PDF 3페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분(300dpi 기울기 보정 이미지, work/measure/p3/full/segments.json)을 mm로 환산했다.
// 측정 환산식: X = (px - 1835.5) * 4.363, Y = (py - 981.5) * 4.372.
// 원점 X=0은 가로 치수선 4,600의 서쪽 끝이다(서측 벽 중심). Y=0은 세로 치수선 6,800의 북쪽 끝이다(북측 벽 중심).
// 4,600의 동쪽 끝은 동측 벽 바깥 면이고, 6,800의 남쪽 끝은 남측 벽 바깥 면이다.
// 이 장도 가로와 세로의 축척이 다르다. 세로 6,800은 왼쪽 1,556px, 오른쪽 1,555px로 4.372다.
// 가로 4,600은 위 1,058px(4.348), 아래 1,050.7px(4.378)다. 서쪽 끝만 위에서 아래로 7px 오른쪽으로 옮겨 가는 사다리꼴이다.
// 평면 가운데 높이의 값(1,054.3px, 4.363)을 가로 축척으로 썼다. 두 값의 차이가 0.2%라서 보정값에 mmPerPx와 mmPerPxY를 따로 적었다.
// 사다리꼴 때문에 북쪽 줄(세면대)의 X는 약 3 ~ 6mm 작게, 남쪽 줄(대변기 칸)의 X는 약 3 ~ 8mm 크게 환산된다.
// 벽 안쪽에 이중선이 있다. 굵은 선은 구조면이고, 15 ~ 25mm 안쪽의 가는 선은 마감선이다. 1,065, 1,400, 2,300, 800 치수는 마감선 기준이다.
// 그래서 벽 품목의 안쪽 면은 마감선 위치에 둔다(FACE). 값은 이 장의 마감선 환산값과 표기 치수를 함께 맞춘 것이다(측정값 문서 3절).
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/lecture_4f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 lecture_4f_added.ts 에 있다.
// 양변기, 세면기, 수전, 배수구, 칸 문, 가방걸이, 유리선반, 코너 비드의 형상과 가정 높이(SILL, HEAD, GAP, COUNTER)는 parts.ts 에 있다.
import { COUNTER, GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet } from './parts';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2800; // 천장고. 도면 표기 CH 2,800 (2곳)

/** 벽 안쪽 면(마감선). 서측, 북측, 동측, 남측 */
export const FACE = { w: 120, n: 110, e: 4380, s: 6575 };
/** 대변기 칸 전면 칸막이의 중심 Y. 남측 마감선에서 1,400(도면 표기) */
export const FRONT = FACE.s - 1400;

/**
 * 대변기 칸. 칸은 서쪽부터 1~4다. 모두 남측 벽에 붙고 변기는 북쪽을 본다.
 * west는 칸의 서쪽 면 X, cx는 양변기 중심 X, hinge는 문 경첩 X, open은 문 개구의 동쪽 끝 X, east는 동쪽 칸막이 중심 X다(칸 4는 동측 마감선).
 */
export const STALLS = [
  { n: 1, west: FACE.w, cx: 658, hinge: 380, open: 932, east: 1185 },
  { n: 2, west: 1185 + PT / 2, cx: 1722, hinge: 1449, open: 1994, east: 2250 },
  { n: 3, west: 2250 + PT / 2, cx: 2785, hinge: 2508, open: 3061, east: 3315 },
  { n: 4, west: 3315 + PT / 2, cx: 3844, hinge: 3573, open: 4116, east: FACE.e },
];

/** 서측 벽의 창 구간 [북쪽 끝 Y, 남쪽 끝 Y] */
export const WINDOWS: [number, number][] = [[348, 1548], [4348, 5546]];
/** 서측 벽의 환풍기 철거 구간(350X350) [북쪽 끝 Y, 남쪽 끝 Y]. 높이는 가정이다. */
const VENT_HOLES: [number, number][] = [[1799, 2149], [3748, 4098]];
const HOLE_Z0 = 1900;
const HOLE_Z1 = 2250;

/** 출입구 구간 [북쪽 끝 Y, 남쪽 끝 Y]. 동측 벽 구조 선의 끝(1483.5 / 1894.5px)이다. */
const ENTRANCE: [number, number] = [2195, 3994];
/** 출입구 문설주의 마감 모서리 Y [북쪽, 남쪽]. 마감선이 문설주 면으로 꺾이는 곳(1488.5 / 1889.5px)이다. */
const ENTRANCE_FINISH: [number, number] = [2217, 3970];
/** 출입구 문틀과 재료분리대의 서쪽 끝 X */
const JAMB_X = 4442;
/**
 * 출입문, 고정 유리, 문틀 머리 아래 면의 높이. 「A」 단면상세도에서 환산했다.
 * 상세도의 세로 축척: 표기 300(복도 천장재 아랫면 y 575.5px → 문틀 머리 윗선 y 712.5px, 137px)에서 2.190mm/px다.
 * 문틀 머리 윗선(712 ~ 716px)은 화장실 쪽 천장선(아랫면 709 ~ 713px)과 같은 높이다. 그래서 문틀 머리 윗면을 천장고(2,800)로 보았다.
 * 문틀 머리 아랫선은 744 ~ 746px(중심 745)이다. (745 - 712.5) × 2.190 = 71이다. 2,800 - 71 = 2,729 → 2,730이다.
 */
const DOOR_TOP = 2730;
/** 수채기실과 PS 사이 벽의 북쪽 면(마감선, y 1616.5px). 구조선은 y 1621.5px(Y 2,798)다. */
const MOP_PS_N = 2776;

const westWallShapes = [
  box(-100, -100, FACE.w, WINDOWS[0][0], 0, CH),
  box(-100, WINDOWS[0][0], FACE.w, WINDOWS[0][1], 0, SILL - 20), box(-100, WINDOWS[0][0], FACE.w, WINDOWS[0][1], HEAD, CH),
  box(-100, WINDOWS[0][1], FACE.w, VENT_HOLES[0][0], 0, CH),
  box(-100, VENT_HOLES[0][0], FACE.w, VENT_HOLES[0][1], 0, HOLE_Z0), box(-100, VENT_HOLES[0][0], FACE.w, VENT_HOLES[0][1], HOLE_Z1, CH),
  box(-100, VENT_HOLES[0][1], FACE.w, VENT_HOLES[1][0], 0, CH),
  box(-100, VENT_HOLES[1][0], FACE.w, VENT_HOLES[1][1], 0, HOLE_Z0), box(-100, VENT_HOLES[1][0], FACE.w, VENT_HOLES[1][1], HOLE_Z1, CH),
  box(-100, VENT_HOLES[1][1], FACE.w, WINDOWS[1][0], 0, CH),
  box(-100, WINDOWS[1][0], FACE.w, WINDOWS[1][1], 0, SILL - 20), box(-100, WINDOWS[1][0], FACE.w, WINDOWS[1][1], HEAD, CH),
  box(-100, WINDOWS[1][1], FACE.w, 6800, 0, CH),
];

const faceRemark = '벽 안쪽 면은 도면의 마감선(구조면에서 15 ~ 25mm 안쪽의 가는 선)에 두었다. 치수 1,065, 1,400, 2,300, 800이 이 선을 기준으로 한다.';

const walls: Item[] = [
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽',
    remark: `${faceRemark} 북측 마감선의 환산값은 Y 109, 구조면은 94, 바깥 면은 -107이다. 바깥 면은 치수선 기준(벽 중심 Y 0, 벽 두께 200)을 따라 -100에 두었다.`,
    shapes: [box(FACE.w, -100, 4600, FACE.n, 0, CH)],
    dims: [dim('바깥 면에서 마감선까지', 210, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽 (창 2곳, 환풍기 철거 구간 2곳)',
    remark: `${faceRemark} 서측 벽의 선은 아래로 갈수록 오른쪽으로 기운다(바깥 면 y 1000에서 1810.5px, y 2450에서 1814.5px). 평면 가운데 높이의 위치를 썼다. 창대 높이와 창 상단 높이는 도면에 없다. 가정값이다. 환풍기 철거 구간(350X350)의 높이는 도면에 없다. 바닥에서 1,900 ~ 2,250으로 가정했다.`,
    shapes: westWallShapes,
    dims: [
      dim('바깥 면에서 마감선까지', 220, 'scaled'),
      dim('창 구간 (북쪽)', '348 ~ 1,548', 'scaled'), dim('창 구간 (남쪽)', '4,348 ~ 5,546', 'scaled'),
      dim('창대 높이', SILL, 'assumed'), dim('창 상단 높이', HEAD, 'assumed'),
    ],
  },
  {
    id: 'window-north', layer: 'wall', name: '서측 창 (북쪽)', material: 'glass',
    remark: '도면에 창호 번호가 없다. 유리면 위치는 창틀 가운데 이중선(X 13 ~ 26)의 환산값이다. 높이는 가정값이다.',
    shapes: [box(12, WINDOWS[0][0], 26, WINDOWS[0][1], SILL, HEAD)],
    dims: [dim('폭', WINDOWS[0][1] - WINDOWS[0][0], 'scaled'), dim('높이', HEAD - SILL, 'assumed')],
  },
  {
    id: 'window-south', layer: 'wall', name: '서측 창 (남쪽)', material: 'glass',
    remark: '도면에 창호 번호가 없다. 유리면 위치는 창틀 가운데 이중선(X 13 ~ 26)의 환산값이다. 높이는 가정값이다.',
    shapes: [box(12, WINDOWS[1][0], 26, WINDOWS[1][1], SILL, HEAD)],
    dims: [dim('폭', WINDOWS[1][1] - WINDOWS[1][0], 'scaled'), dim('높이', HEAD - SILL, 'assumed')],
  },
  {
    id: 'wall-vent-infill-north', layer: 'wall', name: '환풍기 철거 구간 벽돌쌓기 (북쪽)',
    note: '시멘트벽돌쌓기 (350X350)',
    remark: '도면 좌상단 표의 「※ 환풍기 철거 구간 - 시멘트벽돌쌓기 (건축공사)」에 해당한다. 이 장은 북쪽과 남쪽의 주기가 모두 「시멘트벽돌쌓기 (350X350)」다. 평면 위치는 해치 범위의 환산값이다. 높이는 가정값이다.',
    shapes: [box(-100, VENT_HOLES[0][0], FACE.w, VENT_HOLES[0][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('중심 Y', 1974, 'scaled'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'wall-vent-infill-south', layer: 'wall', name: '환풍기 철거 구간 벽돌쌓기 (남쪽)',
    note: '시멘트벽돌쌓기 (350X350)',
    remark: '도면 좌상단 표의 「※ 환풍기 철거 구간 - 시멘트벽돌쌓기 (건축공사)」에 해당한다. 평면 위치는 해치 범위의 환산값이다. 높이는 가정값이다.',
    shapes: [box(-100, VENT_HOLES[1][0], FACE.w, VENT_HOLES[1][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('중심 Y', 3923, 'scaled'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽 (출입구 구간 포함)',
    remark: `${faceRemark} 동측 마감선의 환산값은 X 4,374다. 칸막이 3개의 선 위치(1,191 / 2,251 / 3,316)와 치수 1,065 체인이 함께 맞도록 4,380에 두었다. 바깥 면 X 4,600은 가로 치수선 4,600의 동쪽 끝이다(선 환산값 4,598). 출입구 구간의 양 끝에서 구조 선(굵은 선)은 Y 2,195와 3,994에서 끝난다. 마감선(가는 선)은 문설주 면으로 꺾여 Y 2,217과 3,970에서 끝나고, 문틀 서쪽 끝(X 4,442)까지 이어진다. 그래서 문틀 서쪽의 벽은 마감 모서리까지 그렸다. 「"A" 단면상세도」에서 문틀 머리(x 3870 ~ 3944px)의 서쪽에는 선이 없다(x 3835 ~ 3866px, y 714 ~ 765px). 화장실 천장 보드는 문틀 머리의 서쪽 면에 닿는다. 그래서 출입구 구간(Y 2,217 ~ 3,970)의 X 4,380 ~ 4,442에는 바닥부터 천장까지 벽이 없다. 개구의 측면은 천장까지 이어진다. 출입구 위에는 문틀 머리(door-entrance, X 4,442 ~ 4,600, Z 2,730 ~ 2,800)만 있다.`,
    shapes: [
      box(FACE.e, FACE.n, 4600, ENTRANCE[0], 0, CH),
      box(FACE.e, ENTRANCE[0], JAMB_X, ENTRANCE_FINISH[0], 0, CH),
      box(FACE.e, ENTRANCE_FINISH[1], JAMB_X, ENTRANCE[1], 0, CH),
      box(FACE.e, ENTRANCE[1], 4600, FACE.s, 0, CH),
    ],
    dims: [
      dim('서측 벽 중심에서 바깥 면까지', 4600, 'drawn'), dim('출입구 구간 (구조 선)', '2,195 ~ 3,994', 'scaled'),
      dim('출입구 구간 (마감 모서리)', '2,217 ~ 3,970', 'scaled'),
    ],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    remark: `${faceRemark} 남측 마감선의 환산값은 Y 6,571이다. 전면 칸막이의 선(5,181)과 표기 치수 1,400이 함께 맞도록 6,575에 두었다. 바깥 면 6,800은 세로 치수선 6,800의 남쪽 끝이다(선 환산값 6,792).`,
    shapes: [box(FACE.w, FACE.s, 4600, 6800, 0, CH)],
    dims: [dim('북측 벽 중심에서 바깥 면까지', 6800, 'drawn'), dim('마감선에서 바깥 면까지', 225, 'scaled')],
  },
  {
    id: 'wall-brick', layer: 'wall', name: '수채기실·PS 동측 조적벽', note: '0.5B 조적벽 신설 (H=3,450)',
    remark: '도면 표기 높이 3,450은 천장고(2,800)보다 높다. 모델은 천장면에서 잘랐다. 벽 중심 X 1,050은 치수 1,050(서측 벽 중심에서)의 끝이다. 선 위치는 서쪽 면 995, 동쪽 면 1,095다. 두께는 선분 환산값이다.',
    shapes: [box(1000, 1596, 1100, 3750, 0, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 1050, 'drawn'), dim('두께', 100, 'scaled'), dim('높이 (도면 표기)', 3450, 'drawn'), dim('높이 (모델, 천장면에서 자름)', CH, 'assumed')],
  },
  {
    id: 'wall-mop-ps', layer: 'wall', name: '수채기실과 PS 사이 벽',
    remark: '벽 중심 Y 2,900은 왼쪽 치수 2,900의 끝이다. 선 위치는 북쪽 이중선 2,776(가는 선, 마감선) / 2,798(굵은 선, 구조선), 남쪽 2,999다. 다른 벽처럼 북쪽 면을 마감선(2,776)에 두었다. 점검구 문틀도 이 마감선에서 시작한다. 치수 1,200의 남쪽 끝은 구조선(2,798) 쪽이다. 점검구 개구의 높이(FL+900, 900)는 도면 표기다. 개구는 PS 안의 치수 600(서쪽 문설주에서 조적벽 서쪽 면까지, 눈금 X 399 ~ 997)을 따라 X 400 ~ 1,000에 두었다.',
    shapes: [
      box(FACE.w, MOP_PS_N, 400, 3000, 0, CH),
      box(400, MOP_PS_N, 1000, 3000, 0, 900), box(400, MOP_PS_N, 1000, 3000, 1800, CH),
    ],
    dims: [dim('북측 벽 중심에서 벽 중심까지', 2900, 'drawn'), dim('두께 (마감선에서 남쪽 면까지)', 224, 'scaled'), dim('점검구 개구', '600 x 900 (FL+900)', 'drawn')],
  },
  {
    id: 'wall-ps-south', layer: 'wall', name: 'PS 남측 벽',
    remark: '벽 중심 Y 3,700은 왼쪽 치수 2,900 + 800의 끝이다. 선 위치는 3,646 ~ 3,747이다. 두께는 선분 환산값이다.',
    shapes: [box(FACE.w, 3650, 1000, 3750, 0, CH)],
    dims: [dim('북측 벽 중심에서 벽 중심까지', '2,900 + 800', 'drawn'), dim('두께', 100, 'scaled')],
  },
];

const stallGapRemark = '「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다.';

// 대변기 칸의 「12mm 지정칸막이 (H=1,950)」 지시선 화살표 끝은 칸막이 2(x 약 2352px, y 2313px)에 닿는다. 주기는 칸막이 2에만 단다.
const stallNoteRemark = '「12mm 지정칸막이 (H=1,950)」 지시선은 칸막이 2만 가리킨다. 이 칸막이는 같은 굵기의 선으로 그려져 있어 같은 높이와 두께로 가정했다.';

const stallPartition = (n: number, x: number): Item => {
  const noted = n === 2;
  return {
    id: `partition-${n}`, layer: 'partition', name: `대변기 칸막이 ${n}`, ...(noted ? { note: '12mm 지정칸막이 (H=1,950)' } : {}),
    remark: `${noted ? stallGapRemark : `${stallNoteRemark} 하부 틈은 도면에 없다. 가정값이다.`} 칸막이 중심 X는 치수 1,065 체인(동측 마감선 기준)의 값이다. 선 위치는 1,191 / 2,251 / 3,316이다.`,
    shapes: [box(x - PT / 2, FRONT, x + PT / 2, FACE.s, GAP, 1950)],
    dims: [
      dim('칸 폭', 1065, 'drawn'), dim('칸 깊이', 1400, 'drawn'),
      dim('높이', 1950, noted ? 'drawn' : 'assumed'), dim('두께', PT, noted ? 'drawn' : 'assumed'), dim('하부 틈', GAP, 'assumed'),
    ],
  };
};

const front = (x0: number, x1: number) => box(x0, FRONT - PT / 2, x1, FRONT + PT / 2, GAP, 1950);

const partitions: Item[] = [
  stallPartition(1, 1185),
  stallPartition(2, 2250),
  stallPartition(3, 3315),
  {
    id: 'partition-front', layer: 'partition', name: '대변기 칸 전면 칸막이',
    remark: '도면의 「12mm 지정칸막이 (H=1,950)」 지시선은 칸막이 2를 가리킨다. 전면 패널에는 주기가 없다. 전면 패널의 높이와 두께는 칸막이 2와 같은 것으로 가정했다. 하부 틈도 가정값이다. 전면 선의 위치(Y 5,181)는 표기 치수(남측 마감선에서 1,400)를 따라 5,175에 두었다. 문 개구의 양 끝은 선분 환산값이다.',
    shapes: STALLS.flatMap((s) => [front(s.west, s.hinge), front(s.open, s.east === FACE.e ? FACE.e : s.east - PT / 2)]),
    dims: [dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('문 개구 폭', '약 543 ~ 553', 'scaled'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-screen', layer: 'partition', name: '세면대 옆 가림 칸막이', note: '12mm 지정칸막이 (800x1,600)',
    remark: '중심 X 2,080은 치수 2,300(동측 마감선에서)의 서쪽 끝이다. 도면의 선 위치는 X 약 2,072다. 표기 치수를 따랐다. 길이 800은 북측 마감선에서 잰다(선의 남쪽 끝은 Y 약 918).',
    shapes: [box(2080 - PT / 2, FACE.n, 2080 + PT / 2, FACE.n + 800, 0, 1600)],
    dims: [dim('길이', 800, 'drawn'), dim('높이', 1600, 'drawn'), dim('두께', PT, 'drawn'), dim('동측 마감선에서의 거리', 2300, 'drawn')],
  },
  {
    id: 'partition-under-basin', layer: 'partition', name: '세면대 하부 칸막이', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에는 동쪽 끝의 굵은 점선 1개(X 3,872 ~ 동측 마감선, Y 704)만 그려져 있다. 상판 앞 선(Y 713) 바로 안쪽에 두었다. 폭은 표기 치수 500을 따랐다.',
    shapes: [box(FACE.e - 500, 698, FACE.e, 710, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('북측 마감선에서의 거리', 594, 'scaled')],
  },
  {
    id: 'partition-mop', layer: 'partition', name: '수채기실 전면 칸막이 (문 동쪽 패널)', note: '12mm 지정칸막이 (H=1,950)',
    remark: `${stallGapRemark} 지시선 화살표 끝은 문 동쪽 패널의 윗선(x 2036px, y 1346px)에 닿는다. 위치는 선분 환산값이다(Y 1,602). 동쪽 패널은 문 호가 닿는 곳(X 825)에서 조적벽까지다.`,
    shapes: [box(825, 1596, 1000, 1608, GAP, 1950)],
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('수채기실 남측 벽까지', 1200, 'drawn'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-mop-west', layer: 'partition', name: '수채기실 전면 칸막이 (문 서쪽 패널)',
    remark: '「12mm 지정칸막이 (H=1,950)」 지시선은 문 동쪽 패널만 가리킨다. 문 서쪽 패널은 같은 굵기의 선으로 그려져 있어 같은 높이와 두께로 가정했다. 하부 틈도 가정값이다. 위치는 선분 환산값이다(서측 마감선에서 문 경첩 X 267까지).',
    shapes: [box(FACE.w, 1596, 267, 1608, GAP, 1950)],
    dims: [dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('하부 틈', GAP, 'assumed')],
  },
];

const stallDoorText = {
  remark: '도면은 문을 칸 안쪽(남쪽)으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 문짝 폭은 문짝 선의 길이(131.5px)를 환산한 값이다. 경첩은 문짝 선의 X다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
};

const doors: Item[] = [
  ...STALLS.map((s) => stallDoor(s.n, s.hinge, FRONT, 90, 575, stallDoorText)),
  stallDoor('mop', 267, 1602, 270, 564, {
    id: 'door-closet', name: '수채기실 문',
    remark: '12mm 칸막이와 같은 선으로 그려진 문이다. 도면은 문을 북쪽(화장실 쪽)으로 90도 연 상태로 그렸다. 경첩 X 267과 문짝 폭 564는 문짝 선(x 1896.75px, y 1219 ~ 1348px)의 환산값이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
  }),
  {
    id: 'door-entrance', layer: 'door', name: '출입문 4/SSD', material: 'steelDoor',
    remark: '도면은 문을 동쪽(바깥)으로 90도 연 상태로 그렸다. 경첩은 개구의 북쪽 끝이다. 경첩 X 4,518과 문짝 폭은 문짝 선의 양 끝(x 2871 ~ 3104px)을 환산한 값이다. 열림 호를 원으로 맞추면 중심 x 2872.4px, 반지름 231px(약 1,008)이다. 문틀(북쪽)은 도면의 외곽만 따랐다. 문 높이(문틀 머리 아래 면 2,730)는 「"A" 단면상세도」에서 환산했다. 상세도의 표기 300이 137px(y 575.5 → 712.5px)이라 세로 축척은 2.190mm/px다. 문틀 머리 윗선(y 712 ~ 716px)은 화장실 쪽 천장선(아랫면 y 709 ~ 713px)과 같은 높이라 천장고 2,800으로 보았다. 문틀 머리 아랫선은 y 744 ~ 746px(중심 745)이다. 2,800 - (745 - 712.5) × 2.190 = 2,729다. 문틀 머리(2,730 ~ 2,800)는 출입구 전체(Y 2,195 ~ 3,994)에 걸쳐 그렸다. 문틀 머리의 폭(상세도 x 3870 ~ 3944px, 약 162)은 평면의 문틀 X 4,442 ~ 4,600과 같다. 화장실 쪽에서는 문틀 머리의 서쪽 면이 천장 아래로 70 드러난다. 상세도는 고정 유리 부분을 자른 것이라 문짝의 상단은 도면에 없다. 문짝 높이를 문틀 머리 아래 면까지로 본 것은 가정이다. 상세도의 주기 「THK.9.5 석고보드2겹 / 퍼티 위 수성광택페인트 2회 (출입구 부분)」는 문틀 머리 위 복도 쪽 석고보드(지시선 점 (3940, 665)px, Z 2,800 위, 슬래브 y 422px에서 문틀 머리 윗선 y 712px까지)를 가리킨다. 모델 범위 밖이라 그리지 않았다. 문짝 아래 끝은 재료분리대 윗면(노출 10)이다.',
    shapes: [
      { type: 'leaf', hx: 4518, hy: 2263, width: 1015, angleDeg: 0, thickness: 40, z0: 10, z1: DOOR_TOP },
      box(JAMB_X, ENTRANCE[0], 4600, 2245, 0, DOOR_TOP),
      // 문틀 머리
      box(JAMB_X, ENTRANCE[0], 4600, ENTRANCE[1], DOOR_TOP, CH),
    ],
    dims: [dim('문짝 폭', 1015, 'scaled'), dim('문짝 높이', DOOR_TOP, 'assumed'), dim('문틀 머리 아래 면 높이', DOOR_TOP, 'scaled'), dim('문틀 머리 두께', 70, 'scaled')],
  },
  {
    id: 'door-entrance-side', layer: 'door', name: '출입문 옆 고정 유리', material: 'glass',
    remark: '출입문 남쪽에 위아래 틀과 가는 이중선(유리, X 4,509 ~ 4,531)이 그려져 있다. 고정 유리로 해석했다. 이름은 도면에 없다. 상단은 출입문과 같은 문틀 머리 아래 면(2,730, 「"A" 단면상세도」 환산값)으로 두었다.',
    shapes: [
      box(4509, 3294, 4531, 3944, 0, DOOR_TOP),
      box(JAMB_X, 3242, 4600, 3294, 0, DOOR_TOP, 'steelDoor'),
      box(JAMB_X, 3944, 4600, ENTRANCE[1], 0, DOOR_TOP, 'steelDoor'),
    ],
    dims: [dim('유리 길이', 650, 'scaled'), dim('높이', DOOR_TOP, 'scaled')],
  },
  {
    id: 'door-ps-hatch', layer: 'door', name: 'PS 점검구 5/SSD', note: "SST'L 점검구 설치 (FL+900) (600x900)", material: 'metal',
    remark: '도면은 점검구 문을 수채기실 쪽으로 45도 연 상태로 그렸다. 문짝은 문틀 안에 그려져 있다. 경첩은 그려진 문짝 이중선의 경첩 쪽 끝 중심 (1936, 1619)px = (438, 2,788)이다. 문짝 폭은 그려진 문짝의 길이(끝 중심 (1935.5, 1619.5) → (2022.5, 1532.5)px)를 환산한 값이다. 문짝 두께 30은 문짝 이중선의 간격(수직 거리 약 7px)이다. 표기 600은 개구 폭(서쪽 문설주 바깥 선에서 조적벽 서쪽 면까지)이다. 문설주는 벽의 마감선(y 1616.5px, Y 2,776)에서 시작해 y 1646px(Y 2,908)까지다. 바깥 선은 서 x 1926.5px, 동 x 2063.5px(조적벽 서쪽 면)다. 마감선 아래 y 1625px(Y 2,815)에 개구를 가로지르는 문짝 홈 선이 있다. 문설주의 안쪽 면은 홈 구간(Y 2,776 ~ 2,815)이 서 x 1933px(X 425), 동 x 2057px(X 966)이고, 그 아래(Y 2,815 ~ 2,908)는 서 x 1936px(X 438), 동 x 2054px(X 951)다. 그래서 문설주마다 홈이 있는 좁은 상자와 넓은 상자 2개로 나눴다. 문짝 뒤 모서리(X 427)는 홈 안에 들어가 문설주와 겹치지 않는다. parts.ts 의 문 부품은 90도 단위만 받아 leaf 도형을 직접 썼다. 문틀 높이는 점검구 높이(FL+900, 900)를 따랐다.',
    shapes: [
      { type: 'leaf', hx: 438, hy: 2788, width: 537, angleDeg: 315, thickness: 30, z0: 900, z1: 1800 },
      // 문틀. 문설주마다 홈 구간(좁은 상자)과 그 아래(넓은 상자)
      box(399, MOP_PS_N, 425, 2815, 900, 1800), box(399, 2815, 438, 2908, 900, 1800),
      box(966, MOP_PS_N, 1000, 2815, 900, 1800), box(951, 2815, 1000, 2908, 900, 1800),
    ],
    dims: [
      dim('개구 폭', 600, 'drawn'), dim('문짝 폭', 537, 'scaled'), dim('점검구 크기 (주기)', '600 x 900', 'drawn'), dim('하단 높이', 'FL+900', 'drawn'),
      dim('열린 각도', '45도', 'scaled'), dim('문설주 폭 (홈 구간 / 그 아래)', '서 26 / 39, 동 34 / 49', 'scaled'), dim('문짝 두께', 30, 'scaled'),
    ],
  },
];

const BASIN_R = 225;
const BASIN_Y = 423;
const BASIN_X = [2523, 3224, 3923];

const fixtures: Item[] = [
  // 양변기는 남측 마감선에 붙어 북쪽을 본다. 중심 X는 물탱크 선의 가운데다. 기호 앞 끝은 Y 5,845(마감선에서 730)다. 740과 20 안쪽이라 기본 길이를 썼다.
  ...STALLS.map((s) => toilet(s.n, s.cx, FACE.s, 270)),
  // 세면기는 북측 마감선에서 313 떨어져 남쪽을 본다. 바깥 원의 지름은 약 102 ~ 104px(약 450)다. 도면의 세면기 기호에 토수구 1개와 손잡이 2개가 그려져 있다.
  ...BASIN_X.map((x, i) => basin(i + 1, x, BASIN_Y, '북측 마감선에서 중심까지', BASIN_Y - FACE.n, BASIN_R)),
  ...BASIN_X.map((x, i) => faucet(i + 1, x, BASIN_Y, 90, BASIN_R)),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 높이와 안쪽 형상은 가정값이다.',
    shapes: [
      rbox(510, 1668, 932, 2228, 0, 260, 30),
      { type: 'plate', x0: 510, y0: 1668, x1: 932, y1: 2228, z0: 260, z1: 350, r: 30, holes: [{ x0: 565, y0: 1709, x1: 914, y1: 2174, r: 50 }] },
      cyl(743, 1944, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭 (동서)', 422, 'scaled'), dim('길이 (남북)', 560, 'scaled'), dim('높이', 350, 'assumed')],
  },
  // 배수구는 구배 바닥(floor-main)의 낮은 점에 있다. 바닥 높이 -10(구배 깊이, 가정)에 둔다.
  floorDrain('fd-main', 2617, 3670, -10),
  floorDrain('fd-basin', 3014, 470, -10),
];

const glassShelfText = {
  note: '유리선반 설치 (r=300) (기계설비공사)',
  remark: '지시선은 칸 2의 남서 모서리를 가리킨다. 4개 칸 모두 같은 점선 1/4 원이 그려져 있다. 설치 높이는 가정값이다.',
};
const stallHookText = {
  note: '가방걸이 설치',
  remark: '지시선은 칸 2 문의 기호를 가리킨다. 칸 문 4개 모두에 같은 기호가 그려져 있다. 기호는 문짝의 서쪽 면에 있다. 경첩에서 약 283(65px) 떨어져 있다. 높이와 형상은 가정값이다.',
};

// 출입구 쪽 2곳의 도면 주기는 「코너 비트 설치」다. 나머지 6곳은 「코너 비드 설치」다.
const cornerBitText = {
  note: '코너 비트 설치',
  remark: '위치는 도면의 지시선 끝 원이 가리키는 문설주의 마감 모서리다(X는 동측 마감선, Y는 마감선이 문설주 면으로 꺾이는 곳). 구조 모서리보다 약 22 안쪽이다. 도면 표기는 「코너 비트」다(다른 6곳은 「코너 비드」). 같은 코너 비드로 보았다. 폭, 두께는 도면에 없다. 가정값이다. 높이는 바닥에서 천장까지다. 「"A" 단면상세도」에서 문틀 머리 서쪽에 벽이 없어 개구의 측면이 천장까지 이어진다.',
};
/** 부품의 높이 치수(바닥에서 천장까지)를 이 비드의 높이로 바꾼다. */
const beadHeight = (item: Item, value: string, source: 'scaled' | 'assumed'): Item => ({
  ...item, dims: item.dims.map((d) => (d.label === '높이' ? dim('높이', value, source) : d)),
});
const windowBeadText = {
  remark: '위치는 도면의 지시선이 가리키는 창 옆 벽 모서리다. 창대 아래와 창 위는 벽면이 이어져 모서리가 없어서 창대 높이에서 창 상단 높이까지(둘 다 가정값)만 그렸다. 폭, 두께는 도면에 없다. 가정값이다.',
};

const accessories: Item[] = [
  ...WINDOWS.map(([y0, y1], i): Item => ({
    id: `window-sill-${i + 1}`, layer: 'accessory', name: `창대석 (${i === 0 ? '북쪽' : '남쪽'} 창)`, note: 'THK20 인조대리석 창대석 설치 (W=100)', material: 'marble',
    remark: '평면 위치는 도면의 점묘 범위(X 39 ~ 140)를 환산한 값이다. 창대석이 벽 마감선 안쪽으로 약 20 나온다. 높이는 가정값이다.',
    shapes: [box(40, y0, 140, y1, SILL - 20, SILL)],
    dims: [dim('폭', 100, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  })),
  {
    id: 'shelf', layer: 'accessory', name: '인조대리석 선반', note: 'THK20 인조대리석 선반 설치 (하부 고정 철물)', material: 'marble',
    remark: '평면 크기는 도면의 선반 선을 환산한 값이다. 설치 높이는 가정값이다.',
    shapes: [box(421, FACE.n, 1323, 313, 830, 850)],
    dims: [dim('길이', 902, 'scaled'), dim('깊이', 203, 'scaled'), dim('두께', 20, 'drawn'), dim('설치 높이', 850, 'assumed')],
  },
  {
    id: 'mirror-shelf', layer: 'accessory', name: '선반 위 방습거울', note: 'THK.5 방습거울 (기계설비공사)', material: 'mirror',
    facing: [0, 1],
    remark: '도면에 거울 크기 표기가 없다. 평면 위치와 길이는 북측 벽면의 굵은 선(X 609 ~ 1,134)을 환산한 값이다. 높이는 가정값이다.',
    shapes: [box(609, FACE.n, 1134, FACE.n + 5, 950, 1850)],
    dims: [dim('길이', '약 525', 'scaled'), dim('두께', 5, 'drawn'), dim('높이', 900, 'assumed')],
  },
  {
    id: 'mirror-basin', layer: 'accessory', name: '세면대 방습거울', note: 'THK.5 방습거울 (기계설비공사) (2,300X1,000)', material: 'mirror',
    facing: [0, 1],
    remark: '평면 범위는 치수 2,300(가림 칸막이 중심에서 동측 마감선까지)을 따랐다. 하단 높이는 가정값이다.',
    shapes: [box(2080, FACE.n, FACE.e, FACE.n + 5, 1000, 2000)],
    dims: [dim('폭', 2300, 'drawn'), dim('높이', 1000, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 1000, 'assumed')],
  },
  {
    id: 'mirror-full', layer: 'accessory', name: '전신 방습거울', note: 'THK.5 방습거울 (기계설비공사) (600X1,500)', material: 'mirror',
    facing: [1, 0],
    remark: '조적벽의 동쪽 면에 있다. 평면 위치는 도면의 굵은 선(Y 2,865 ~ 3,462)을 환산한 값이다. 폭은 표기 600을 따랐다. 하단 높이는 가정값이다.',
    shapes: [box(1100, 2864, 1105, 3464, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, 'assumed')],
  },
  {
    id: 'counter', layer: 'accessory', name: '세면대 상판', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(Y 713의 실선, 가림 칸막이에서 동측 마감선까지)을 환산한 값이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      {
        type: 'plate', x0: 2086, y0: FACE.n, x1: FACE.e, y1: 713, z0: COUNTER - 20, z1: COUNTER,
        holes: BASIN_X.map((cx) => ({ cx, cy: BASIN_Y, r: BASIN_R - 10 })),
      },
      // 뒷턱
      box(2086, FACE.n, FACE.e, FACE.n + 15, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 2294, 'scaled'), dim('깊이', 603, 'scaled'), dim('윗면 높이', COUNTER, 'assumed'), dim('두께', 20, 'assumed')],
  },
  // 유리선반은 칸의 남서 모서리에 있다(도면의 점선 1/4 원, 반지름 약 66px).
  ...STALLS.map((s) => glassShelf(s.n, s.west, FACE.s, 270, 300, glassShelfText)),
  ...STALLS.map((s) => stallHook(s.n, s.hinge, FRONT, 90, 1, 283, stallHookText)),
  {
    id: 'threshold', layer: 'accessory', name: '화강석 재료분리대', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치(출입문 개구, Y 2,245 ~ 3,242)다. 해치의 서쪽 선은 X 4,442다. 폭은 표기 150을 따라 4,450 ~ 4,600에 두었다. 두께 30은 석재 두께다. 바닥 위로 드러나는 높이는 도면에 없다. 10으로 가정했다.',
    shapes: [box(4450, 2245, 4600, 3242, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 997, 'scaled'), dim('노출 높이', 10, 'assumed')],
  },
  {
    id: 'tactile-blocks', layer: 'accessory', name: '점형블럭 2EA', note: '점형블럭 2EA (매립형)', material: 'tactile',
    remark: '동측 벽 바깥 면에서 300(도면 표기) 떨어져 있다. 남북으로 2장이 붙어 있다. 환산 범위는 X 4,900 ~ 5,203, Y 3,294 ~ 3,594 ~ 3,889다.',
    shapes: [box(4900, 3294, 5200, 3592, 0, 5), box(4900, 3596, 5200, 3889, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('벽 바깥 면에서의 거리', 300, 'drawn'), dim('1장 크기', '약 300 x 300', 'scaled')],
  },
  {
    id: 'braille-sign', layer: 'accessory', name: '점자표지판', note: '벽면점자표지판설치', material: 'metal',
    remark: '도면의 표시는 출입문 남쪽 고정 유리 틀의 바깥 면에 그린 굵은 짧은 선(y 1790 ~ 1817px, 약 118)이다. 그 길이를 폭으로 썼다. 두께와 설치 높이는 가정값이다.',
    shapes: [box(4600, 3535, 4616, 3653, 1400, 1550)],
    dims: [dim('위치', '출입구 바깥 면', 'scaled'), dim('폭', 118, 'scaled'), dim('설치 높이', 1400, 'assumed')],
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
  // 코너 비드. 도면의 「코너 비드 설치」 지시선 6개와 「코너 비트 설치」 지시선 2개가 가리키는 벽 모서리에 붙였다.
  // 창 옆 4개는 창대(SILL)에서 창 상단(HEAD)까지다. 창대 아래와 창 위는 벽면이 이어져 모서리가 없다.
  beadHeight(cornerBead(1, '북쪽 창 북단 모서리', [box(FACE.w, 323, FACE.w + 5, 353, SILL, HEAD), box(FACE.w - 25, 348, FACE.w + 5, 353, SILL, HEAD)], windowBeadText), '창대 ~ 창 상단 (1,200 ~ 2,100)', 'assumed'),
  beadHeight(cornerBead(2, '북쪽 창 남단 모서리', [box(FACE.w, 1543, FACE.w + 5, 1573, SILL, HEAD), box(FACE.w - 25, 1543, FACE.w + 5, 1548, SILL, HEAD)], windowBeadText), '창대 ~ 창 상단 (1,200 ~ 2,100)', 'assumed'),
  cornerBead(3, '조적벽 북동 모서리', [box(1100, 1591, 1105, 1621, 0, CH), box(1075, 1591, 1105, 1596, 0, CH)]),
  cornerBead(4, '조적벽 남동 모서리', [box(1100, 3725, 1105, 3755, 0, CH), box(1075, 3750, 1105, 3755, 0, CH)]),
  beadHeight(cornerBead(5, '남쪽 창 북단 모서리', [box(FACE.w, 4323, FACE.w + 5, 4353, SILL, HEAD), box(FACE.w - 25, 4348, FACE.w + 5, 4353, SILL, HEAD)], windowBeadText), '창대 ~ 창 상단 (1,200 ~ 2,100)', 'assumed'),
  beadHeight(cornerBead(6, '남쪽 창 남단 모서리', [box(FACE.w, 5541, FACE.w + 5, 5571, SILL, HEAD), box(FACE.w - 25, 5541, FACE.w + 5, 5546, SILL, HEAD)], windowBeadText), '창대 ~ 창 상단 (1,200 ~ 2,100)', 'assumed'),
  // 출입구 2곳은 지시선 끝 원의 중심((2836.5, 1488), (2837, 1890)px)이 문설주의 마감 모서리((2838.5, 1488.5), (2838.5, 1889.5)px)에 있다.
  // 높이는 바닥에서 천장까지다. 개구의 측면이 천장까지 이어진다.
  cornerBead(7, '출입구 북쪽 마감 모서리', [
    box(FACE.e - 5, ENTRANCE_FINISH[0] - 30, FACE.e, ENTRANCE_FINISH[0] + 5, 0, CH),
    box(FACE.e - 5, ENTRANCE_FINISH[0], FACE.e + 25, ENTRANCE_FINISH[0] + 5, 0, CH),
  ], cornerBitText),
  cornerBead(8, '출입구 남쪽 마감 모서리', [
    box(FACE.e - 5, ENTRANCE_FINISH[1] - 5, FACE.e, ENTRANCE_FINISH[1] + 30, 0, CH),
    box(FACE.e - 5, ENTRANCE_FINISH[1] - 5, FACE.e + 25, ENTRANCE_FINISH[1], 0, CH),
  ], cornerBitText),
];

const lightRemark = '도면에 손으로 적은 「조명」 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-shelf', layer: 'light', name: '조명 표시 (선반·거울 구간)', note: '손글씨 「조명」', remark: `${lightRemark} 선반 위를 형광펜으로 칠했다(X 438 ~ 1,425, Y 116 ~ 369).`,
    lamp: { power: 1.4 },
    shapes: [box(440, 150, 1420, 330, CH - 40, CH)],
    dims: [dim('표시 구간 길이', 980, 'scaled')],
  },
  {
    id: 'light-mop', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 326, cy: 2112, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-ps', layer: 'light', name: '조명 표시 (PS)', note: '손글씨 「조명」', remark: `${lightRemark} 표시는 PS 안에 있다.`,
    lamp: { power: 0.6 },
    shapes: [{ type: 'cylinder', cx: 363, cy: 3317, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

const floorNote = '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)';

// 마감. 도면 좌상단 「지상2층 강의동 화장실 마감 변경부분」 표(4층 도면이지만 표 제목은 이렇게 인쇄돼 있다)와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
const finishes: Item[] = [
  {
    id: 'floor-main', layer: 'finish', name: '바닥 마감 (화장실)', material: 'floorTile', note: floorNote,
    remark: '평면의 주기는 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 출입구 앞의 「+」 표시 구역의 주기는 「기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 구역의 경계선은 서쪽 x 2614px(X 3,397), 북쪽 y 1398.5px(Y 1,823), 남쪽 y 1952px(Y 4,243)다. 북쪽과 남쪽 경계선은 동측 벽의 구조 선(x 약 2846px)까지 그려져 있다. 출입구 구간의 「+」 표시는 재료분리대 해치의 서쪽 끝(X 4,442)까지 있다. 마감 타일이 같아서 나누지 않았다. 도면의 화살표는 물이 빠지는 방향(바닥 구배)이다. 화장실 가운데 배수구(fd-main)에는 네 방향에서 모이는 화살표 4개가 X 모양으로 그려져 있다. 세면대 아래 배수구(fd-basin)에는 남서쪽과 남동쪽에서 모이는 화살표 2개만 있다(꼬리는 Y 약 1,070). 그래서 세면대 앞 구역(Y 1,150까지)과 나머지를 나눠 각각 그 배수구로 기울였다. 나누는 선의 위치와 구배 깊이(10)는 가정이다. 바닥 가장자리는 0, 배수구 위치는 -10이다. 줄눈 위치는 도면의 타일 나누기 선(X 1,719, Y 975에서 600 간격)에 맞췄다. 색과 무늬는 도면에 없다. 가정이다.',
    shapes: [
      { type: 'pan', x0: 2086, y0: FACE.n, x1: FACE.e, y1: 1150, z: 0, drop: 10, cx: 3014, cy: 470 },
      { type: 'pan', x0: 1100, y0: 1150, x1: FACE.e, y1: FACE.s, z: 0, drop: 10, cx: 2617, cy: 3670 },
      box(1100, FACE.n, 2086, 1150, -10, 0),
      box(FACE.w, FACE.n, 1100, 1596, -10, 0),
      box(FACE.w, 3750, 1100, FACE.s, -10, 0),
      box(FACE.e, ENTRANCE[0], 4450, ENTRANCE[1], -10, 0),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이', 10, 'assumed'), dim('줄눈 시작점', 'X 1,719, Y 975', 'scaled')],
  },
  {
    id: 'floor-mop', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'floorTile',
    remark: '수채기실 바닥의 별도 주기는 도면에 없다. 좌상단 표의 바닥 마감과 같은 것으로 가정했다. 평탄하게 그렸다.',
    shapes: [box(FACE.w, 1608, 1000, MOP_PS_N, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'assumed')],
  },
  {
    id: 'wall-finish-main', layer: 'finish', name: '벽 마감 (화장실)', material: 'wall',
    note: '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착',
    remark: '벽의 안쪽 면(마감선)에 얇은 면(3mm)을 붙여 그렸다. 타일 두께 10으로 그리면 벽에 붙은 거울을 덮는다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다. PS 안쪽 면은 그리지 않았다. 수채기실 남측 벽(마감선 Y 2,776)의 면은 점검구 개구(X 400 ~ 1,000, Z 900 ~ 1,800)를 비우고 개구 옆, 아래, 위로 나눴다. 출입구 구간(Y 2,217 ~ 3,970)에는 동측 벽 면이 없다. 문설주 면 2개는 바닥부터 천장까지다.',
    shapes: [
      // 북측 벽
      box(FACE.w, FACE.n, FACE.e, FACE.n + 3, 0, CH),
      // 서측 벽 (창 구간은 창대 아래와 창 위)
      box(FACE.w, FACE.n, FACE.w + 3, WINDOWS[0][0], 0, CH),
      box(FACE.w, WINDOWS[0][0], FACE.w + 3, WINDOWS[0][1], 0, SILL - 20), box(FACE.w, WINDOWS[0][0], FACE.w + 3, WINDOWS[0][1], HEAD, CH),
      box(FACE.w, WINDOWS[0][1], FACE.w + 3, MOP_PS_N, 0, CH),
      box(FACE.w, 3750, FACE.w + 3, WINDOWS[1][0], 0, CH),
      box(FACE.w, WINDOWS[1][0], FACE.w + 3, WINDOWS[1][1], 0, SILL - 20), box(FACE.w, WINDOWS[1][0], FACE.w + 3, WINDOWS[1][1], HEAD, CH),
      box(FACE.w, WINDOWS[1][1], FACE.w + 3, FACE.s, 0, CH),
      // 동측 벽 (출입구 구간에는 면이 없다)
      box(FACE.e - 3, FACE.n, FACE.e, ENTRANCE_FINISH[0], 0, CH), box(FACE.e - 3, ENTRANCE_FINISH[1], FACE.e, FACE.s, 0, CH),
      // 출입구 문설주 면 (마감 모서리에서 문틀까지)
      box(FACE.e, ENTRANCE_FINISH[0], JAMB_X, ENTRANCE_FINISH[0] + 3, 0, CH), box(FACE.e, ENTRANCE_FINISH[1] - 3, JAMB_X, ENTRANCE_FINISH[1], 0, CH),
      // 남측 벽
      box(FACE.w, FACE.s - 3, FACE.e, FACE.s, 0, CH),
      // 조적벽 동쪽 면과 양 끝면, PS 남측 벽의 남쪽 면
      box(1100, 1596, 1103, 3750, 0, CH), box(1000, 1593, 1100, 1596, 0, CH), box(FACE.w, 3750, 1100, 3753, 0, CH),
      // 수채기실 (조적벽 서쪽 면, 남측 벽 북쪽 면). 남측 벽 면은 점검구 개구(X 400 ~ 1,000, Z 900 ~ 1,800)를 비우고 개구 옆, 아래, 위로 나눴다.
      box(997, 1608, 1000, MOP_PS_N, 0, CH),
      box(FACE.w, MOP_PS_N - 3, 399, MOP_PS_N, 0, CH),
      box(399, MOP_PS_N - 3, 1000, MOP_PS_N, 0, 900), box(399, MOP_PS_N - 3, 1000, MOP_PS_N, 1800, CH),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'ceiling', layer: 'finish', name: '천장 마감', material: 'ceiling',
    note: '천장 : 경량철골 천장틀위 금속재 흡음천장 (AL. 600각)',
    remark: '천장고 표기 2곳을 8배로 확대해서 「CH 2,800」으로 읽었다(work/verify/p3/ch_zoom.png). 둘째 자리의 위 고리가 닫혀 있고 오른쪽 획이 이어져 6이 아니라 8이다. 4의 사선이 없고 자리가 2,8·0·0이라 2,400이나 2,450이 아니다. 2F의 표기(2,450)와 350 다르다. 마감 표의 천장 행은 스캔이 흐리다. 「경량철골 천장틀위 금속재 흡음천장 (AL. 600각)」으로 읽었다. 실내에서 볼 때만 그린다. 위에서 내려다볼 때는 그리지 않는다. 수채기실과 PS의 천장 마감은 도면에 없다. 화장실과 같은 것으로 가정했다. 패널 나누기 위치도 가정이다.',
    shapes: [box(-100, -100, 4600, 6800, CH, CH + 30)],
    dims: [dim('천장고', CH, 'drawn'), dim('패널 크기', '600 x 600', 'drawn')],
  },
];

export const lecture4fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1835.5, 981.5],
  mmPerPx: 4.363,
  mmPerPxY: 4.372,
};

export const lecture4fModel: SheetModel = {
  ceilingHeight: CH,
  bounds: { x0: -100, y0: -100, x1: 4600, y1: 6800 },
  eye: { from: [3300, 1600, 1600], to: [1500, 5400, 1100] },
  // 남동쪽에서 본다. 변기(남측 벽)와 세면기(북측 벽)가 마주 보는 벽에 붙어 있다. 벽을 다 세우면 어느 방향에서도 한쪽이 가린다.
  // 기본 절단 높이는 천장고라서 아이소 화면에서는 앞쪽 벽이 실내 일부를 가린다. 슬라이더를 1,200으로 내리면 변기와 세면기가 모두 보인다. 전신 거울(조적벽 동쪽 면)도 보이는 남동쪽을 골랐다.
  isoDir: [1, 1],
  // 창은 서측 벽에 있다. 자연광은 서쪽에서 동쪽으로 들어온다.
  daylightDir: [1, 0.2],
  tileOrigin: { floorTile: [1719, 975] },
  items: [...walls, ...partitions, ...doors, ...fixtures, ...accessories, ...lights, ...finishes],
  // 치수선 위치는 도면의 치수선 위치와 같다. 왼쪽 치수선은 도면에서 기울어 있어 평면 가운데 높이의 위치를 썼다.
  dimLines: [
    { from: [0, -2523], to: [4600, -2523], label: '4,600' },
    { from: [0, 9297], to: [4600, 9297], label: '4,600' },
    { from: [-3158, 0], to: [-3158, 6800], label: '6,800' },
    { from: [-2961, 0], to: [-2961, 2900], label: '2,900' },
    { from: [-2961, 2900], to: [-2961, 6800], label: '3,900' },
    { from: [-2757, 0], to: [-2757, 2000], label: '2,000' },
    { from: [-2757, 2000], to: [-2757, 2900], label: '900' },
    { from: [-2757, 2900], to: [-2757, 3700], label: '800' },
    { from: [-2757, 3700], to: [-2757, 6800], label: '3,100' },
    { from: [7563, 0], to: [7563, 2000], label: '2,000' },
    { from: [7563, 2000], to: [7563, 5000], label: '3,000' },
    { from: [7563, 5000], to: [7563, 6800], label: '1,800' },
    { from: [7760, 0], to: [7760, 6800], label: '6,800' },
    { from: [2080, 938], to: [FACE.e, 938], label: '2,300' },
    { from: [1342, 1596], to: [1342, 2796], label: '1,200' },
    { from: [400, 3211], to: [1000, 3211], label: '600' },
    { from: [0, 4038], to: [1050, 4038], label: '1,050' },
    { from: [1185, 4881], to: [2250, 4881], label: '1,065' },
    { from: [2250, 4881], to: [3315, 4881], label: '1,065' },
    { from: [3315, 4881], to: [FACE.e, 4881], label: '1,065' },
    { from: [999, FRONT], to: [999, FACE.s], label: '1,400' },
    { from: [4600, 4094], to: [4900, 4094], label: '300' },
  ],
  roomLabels: [{ text: '화장실(여)', at: [2376, 1852] }, { text: 'PS', at: [543, 3338] }],
};
