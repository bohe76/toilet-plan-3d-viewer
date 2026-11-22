// 2층 강의동 화장실 확대평면도 (변경후) — PDF 1페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분(300dpi 기울기 보정 이미지, work/measure/p1/full/segments.json)을 mm로 환산했다.
// 측정 환산식: X = (px - 1836) * 4.352, Y = (py - 981) * 4.372.
// 원점 X=0은 가로 치수선 4,600의 서쪽 끝이다(서측 벽 중심). Y=0은 세로 치수선 6,800의 북쪽 끝이다(북측 벽 중심).
// 4,600의 동쪽 끝은 동측 벽 바깥 면이고, 6,800의 남쪽 끝은 남측 벽 바깥 면이다.
// 이 장은 가로와 세로의 축척이 다르다. 세로 치수 13개는 4.372로 7mm 이내다. 가로는 1,065 체인(735px)과 4,600(위아래 평균 1,056.75px)이 4.35 안팎이다.
// 그래서 가로 4.352, 세로 4.372를 따로 쓴다. 보정값(mmPerPx 4.352, mmPerPxY 4.372)도 측정 환산식과 같다.
// 남은 겹침 어긋남은 표기 치수를 따른 곳(가림 칸막이 +3.9px)과 서쪽 선의 기울기(서측 마감선 -2.4px)에서 생긴다.
// 도면의 서쪽 세로선은 아래로 갈수록 오른쪽으로 기운다(서측 벽 바깥 면 1812 → 1815px, 왼쪽 치수선 1105 → 1114px). 동쪽 선은 1px 안쪽이다.
// 벽 안쪽에 이중선이 있다. 굵은 선은 구조면이고, 약 20mm 안쪽의 가는 선은 마감선이다. 1,065, 1,400, 2,300, 800 치수는 마감선 기준이다.
// 그래서 벽 품목의 안쪽 면은 마감선 위치(서 120, 북 120, 동 4,380, 남 6,580)에 둔다.
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/lecture_2f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 lecture_2f_added.ts 에 있다.
// 양변기, 세면기, 수전, 배수구, 칸 문, 가방걸이, 유리선반, 코너 비드의 형상과 가정 높이(SILL, HEAD, GAP, COUNTER)는 parts.ts 에 있다.
import { COUNTER, GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet } from './parts';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2450; // 천장고. 도면 표기 CH 2,450 (2곳)
/** 출입구 문틀 머리의 아랫면 높이. 「"A" 단면상세도」에서 환산했다. 문틀 머리 윗선은 화장실 천장선과 같고, 아랫선은 그보다 약 70 아래다. */
export const ENTRY_HEAD = CH - 70;

/** 벽 안쪽 면(마감선). 서측, 북측, 동측, 남측 */
export const FACE = { w: 120, n: 120, e: 4380, s: 6580 };
/** 대변기 칸 전면 칸막이의 중심 Y. 남측 마감선에서 1,400(도면 표기) */
export const FRONT = FACE.s - 1400;

/**
 * 대변기 칸. 칸은 서쪽부터 1~4다. 모두 남측 벽에 붙고 변기는 북쪽을 본다.
 * west는 칸의 서쪽 면 X, cx는 양변기 중심 X, hinge는 문 경첩 X, open은 문 개구의 동쪽 끝 X, east는 동쪽 칸막이 중심 X다(칸 4는 동측 마감선).
 */
export const STALLS = [
  { n: 1, west: FACE.w, cx: 655, hinge: 381, open: 931, east: 1185 },
  { n: 2, west: 1185 + PT / 2, cx: 1710, hinge: 1440, open: 1993, east: 2250 },
  { n: 3, west: 2250 + PT / 2, cx: 2781, hinge: 2505, open: 3059, east: 3315 },
  { n: 4, west: 3315 + PT / 2, cx: 3846, hinge: 3575, open: 4126, east: FACE.e },
];

/** 서측 벽의 창 구간 [북쪽 끝 Y, 남쪽 끝 Y] */
export const WINDOWS: [number, number][] = [[345, 1548], [4350, 5548]];
/** 서측 벽의 환풍기 철거 구간(350X350) [북쪽 끝 Y, 남쪽 끝 Y]. 높이는 가정이다. */
const VENT_HOLES: [number, number][] = [[1799, 2149], [3750, 4100]];
const HOLE_Z0 = 1900;
const HOLE_Z1 = 2250;

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

const faceRemark = '벽 안쪽 면은 도면의 마감선(구조면에서 약 20mm 안쪽의 가는 선)에 두었다. 치수 1,065, 1,400, 2,300, 800이 이 선을 기준으로 한다.';

const walls: Item[] = [
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽',
    remark: `${faceRemark} 바깥 면 Y -100은 선분 환산값(-105)이다.`,
    shapes: [box(-100, -100, 4600, FACE.n, 0, CH)],
    dims: [dim('바깥 면에서 마감선까지', 220, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽 (창 2곳, 환풍기 철거 구간 2곳)',
    remark: `${faceRemark} 창대 높이와 창 상단 높이는 도면에 없다. 가정값이다. 환풍기 철거 구간(350X350)의 높이는 도면에 없다. 바닥에서 1,900 ~ 2,250으로 가정했다.`,
    shapes: westWallShapes,
    dims: [
      dim('바깥 면에서 마감선까지', 220, 'scaled'),
      dim('창 구간 (북쪽)', '345 ~ 1,548', 'scaled'), dim('창 구간 (남쪽)', '4,350 ~ 5,548', 'scaled'),
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
    id: 'wall-vent-infill-north', layer: 'wall', name: '환풍기 철거 구간 벽돌 메우기 (북쪽)',
    note: '10.B 시멘트벽돌 메우기 (350X350)',
    remark: '도면 좌상단 표의 「※ 환풍기 철거 구간 - 시멘트벽돌쌓기 (건축공사)」에 해당한다. 평면 위치는 해치 범위의 환산값이다. 높이는 가정값이다.',
    shapes: [box(-100, VENT_HOLES[0][0], FACE.w, VENT_HOLES[0][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('중심 Y', 1974, 'scaled'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'wall-vent-infill-south', layer: 'wall', name: '환풍기 철거 구간 벽돌쌓기 (남쪽)',
    note: '시멘트벽돌쌓기 (350X350)',
    remark: '도면 좌상단 표의 「※ 환풍기 철거 구간 - 시멘트벽돌쌓기 (건축공사)」에 해당한다. 평면 위치는 해치 범위의 환산값이다. 높이는 가정값이다.',
    shapes: [box(-100, VENT_HOLES[1][0], FACE.w, VENT_HOLES[1][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('중심 Y', 3925, 'scaled'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽 (출입구 구간 포함)',
    remark: `${faceRemark} 바깥 면 X 4,600은 가로 치수선 4,600의 동쪽 끝이다. 출입구 문틀 머리(X 4,443 ~ 4,600)는 door-entrance-head 품목에 있다. 그 안쪽(X 4,380 ~ 4,443)은 천장까지 비어 있다. 단면상세도에서 문틀 머리의 서쪽은 바로 화장실 천장이고 내림벽이 없기 때문이다. 출입구 양 끝의 구조선은 Y 2,195와 3,992다. 마감선은 개구 쪽으로 들어와 Y 2,214와 3,970에서 문틀까지 꺾인다. 그 꺾인 마감을 바닥에서 천장까지 얇은 상자로 넣었다.`,
    shapes: [
      box(FACE.e, FACE.n, 4600, 2195, 0, CH),
      box(FACE.e, 3992, 4600, FACE.s, 0, CH),
      // 출입구 양쪽 문설주의 마감 꺾임. 도면은 마감선이 구조 끝(2,195 / 3,992)보다 개구 쪽으로 들어와 문틀(X 4,443)까지 꺾인다.
      box(FACE.e, 2195, 4443, 2214, 0, CH),
      box(FACE.e, 3970, 4443, 3992, 0, CH),
    ],
    dims: [dim('서측 벽 중심에서 바깥 면까지', 4600, 'drawn'), dim('출입구 구간 (구조)', '2,195 ~ 3,992', 'scaled'), dim('출입구 구간 (마감)', '2,214 ~ 3,970', 'scaled')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    remark: faceRemark,
    shapes: [box(-100, FACE.s, 4600, 6800, 0, CH)],
    dims: [dim('북측 벽 중심에서 바깥 면까지', 6800, 'drawn'), dim('마감선에서 바깥 면까지', 220, 'scaled')],
  },
  {
    id: 'wall-brick', layer: 'wall', name: '수채기실·PS 동측 조적벽', note: '0.5B 조적벽 신설 (H=3,450)',
    remark: '도면 표기 높이 3,450은 천장고(2,450)보다 높다. 모델은 천장면에서 잘랐다. 벽 중심 X 1,050은 치수 1,050(서측 벽 중심에서)의 끝이다. 두께는 선분 환산값이다.',
    shapes: [box(1000, 1600, 1100, 3750, 0, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 1050, 'drawn'), dim('두께', 100, 'scaled'), dim('높이 (도면 표기)', 3450, 'drawn'), dim('높이 (모델, 천장면에서 자름)', CH, 'assumed')],
  },
  {
    id: 'wall-mop-ps', layer: 'wall', name: '수채기실과 PS 사이 벽',
    remark: '벽 중심 Y 2,900은 왼쪽 치수 2,900의 끝이다. 북쪽 면은 다른 벽과 같이 마감선(y 1616.5px, Y 2,778)에 두었다. 구조선은 y 1621.5px(Y 2,800)다. 수채기실 치수 1,200의 아래 보조선(y 1620 ~ 1621px)은 이 구조선에 닿는다. 마감선이 아니다. 남쪽 면 Y 3,000은 벽 중심에서 100이다(도면 구조선 y 1667px, Y 2,999). 점검구 개구의 높이(FL+900, 900)는 도면 표기다. 개구는 PS 안의 치수 600(서쪽 문설주에서 조적벽 서쪽 면까지)을 따라 X 400 ~ 1,000에 두었다. 서쪽 문설주의 선 위치는 X 약 394다.',
    shapes: [
      box(FACE.w, 2778, 400, 3000, 0, CH),
      box(400, 2778, 1000, 3000, 0, 900), box(400, 2778, 1000, 3000, 1800, CH),
    ],
    dims: [dim('북측 벽 중심에서 벽 중심까지', 2900, 'drawn'), dim('구조 두께 (구조선 사이)', 199, 'scaled'), dim('북쪽 마감선에서 남쪽 면까지', 222, 'scaled'), dim('점검구 개구', '600 x 900 (FL+900)', 'drawn')],
  },
  {
    id: 'wall-ps-south', layer: 'wall', name: 'PS 남측 벽',
    remark: '벽 중심 Y 3,700은 왼쪽 치수 2,900 + 800의 끝이다. 두께는 선분 환산값이다.',
    shapes: [box(FACE.w, 3650, 1000, 3750, 0, CH)],
    dims: [dim('북측 벽 중심에서 벽 중심까지', '2,900 + 800', 'drawn'), dim('두께', 100, 'scaled')],
  },
];

const stallGapRemark = '「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다.';

// 주기 「12mm 지정칸막이 (H=1,950)」의 지시선 화살표는 칸막이 2(x 2350 ~ 2354px, y 2313px)에 닿는다. note는 칸막이 2에만 둔다.
const stallPartition = (n: number, x: number): Item => {
  const pointed = n === 2;
  const H = pointed ? 'drawn' : 'assumed';
  return {
    id: `partition-${n}`, layer: 'partition', name: `대변기 칸막이 ${n}`,
    ...(pointed ? { note: '12mm 지정칸막이 (H=1,950)' } : {}),
    remark: pointed
      ? `${stallGapRemark} 칸막이 중심 X는 치수 1,065 체인(동측 마감선 기준)의 값이다.`
      : `도면의 「12mm 지정칸막이 (H=1,950)」 지시선은 칸막이 2를 가리킨다. 이 칸막이는 같은 선으로 그려져 있어 높이와 두께를 칸막이 2와 같게 가정했다. 하부 틈도 가정값이다. 칸막이 중심 X는 치수 1,065 체인(동측 마감선 기준)의 값이다.`,
    shapes: [box(x - PT / 2, FRONT, x + PT / 2, FACE.s, GAP, 1950)],
    dims: [dim('칸 폭', 1065, 'drawn'), dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, H), dim('두께', PT, H), dim('하부 틈', GAP, 'assumed')],
  };
};

const front = (x0: number, x1: number) => box(x0, FRONT - PT / 2, x1, FRONT + PT / 2, GAP, 1950);

const partitions: Item[] = [
  stallPartition(1, 1185),
  stallPartition(2, 2250),
  stallPartition(3, 3315),
  {
    id: 'partition-front', layer: 'partition', name: '대변기 칸 전면 칸막이',
    remark: '도면의 「12mm 지정칸막이 (H=1,950)」 지시선은 칸막이 2를 가리킨다. 그래서 note를 달지 않았다. 전면 패널의 높이와 두께는 같은 것으로 가정했다. 하부 틈도 가정값이다. 전면 선의 위치(Y 5,181)는 표기 치수(남측 마감선에서 1,400)를 따라 5,180에 두었다. 문 개구의 양 끝은 선분 환산값이다.',
    shapes: STALLS.flatMap((s) => [front(s.west, s.hinge), front(s.open, s.east === FACE.e ? FACE.e : s.east - PT / 2)]),
    dims: [dim('칸 깊이', 1400, 'drawn'), dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('문 개구 폭', '약 550 ~ 554', 'scaled'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-screen', layer: 'partition', name: '세면대 옆 가림 칸막이', note: '12mm 지정칸막이 (800x1,600)',
    remark: '중심 X 2,080은 치수 2,300(동측 마감선에서)의 서쪽 끝이다. 도면의 선 위치는 X 약 2,064다. 표기 치수를 따랐다. 길이 800은 북측 마감선에서 잰다.',
    shapes: [box(2080 - PT / 2, FACE.n, 2080 + PT / 2, FACE.n + 800, 0, 1600)],
    dims: [dim('길이', 800, 'drawn'), dim('높이', 1600, 'drawn'), dim('두께', PT, 'drawn'), dim('동측 마감선에서의 거리', 2300, 'drawn')],
  },
  {
    id: 'partition-under-basin', layer: 'partition', name: '세면대 하부 칸막이', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에는 동쪽 끝의 굵은 점선 1개(길이 약 500)만 그려져 있다. 상판 앞 선 바로 안쪽에 두었다.',
    shapes: [box(FACE.e - 500, 701, FACE.e, 713, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('북측 마감선에서의 거리', 593, 'scaled')],
  },
  {
    id: 'partition-mop', layer: 'partition', name: '수채기실 전면 칸막이 (문 동쪽)', note: '12mm 지정칸막이 (H=1,950)',
    remark: `${stallGapRemark} 주기의 지시선 화살표(x 2034 ~ 2037px, 끝 y 약 1340px)는 문 동쪽 패널에만 닿는다. 패널은 문 호가 닿는 곳(X 814)에서 조적벽까지다. 위치는 선분 환산값이다.`,
    shapes: [box(814, 1600, 1000, 1612, GAP, 1950)],
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('수채기실 남측 벽 구조선까지', 1200, 'drawn'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-mop-west', layer: 'partition', name: '수채기실 전면 칸막이 (문 서쪽)',
    remark: '주기의 지시선은 문 동쪽 패널을 가리킨다. 이 패널은 같은 선으로 그려져 있어 높이와 두께를 동쪽 패널과 같게 가정했다. 하부 틈도 가정값이다. 위치는 선분 환산값이다.',
    shapes: [box(FACE.w, 1600, 265, 1612, GAP, 1950)],
    dims: [dim('높이', 1950, 'assumed'), dim('두께', PT, 'assumed'), dim('하부 틈', GAP, 'assumed')],
  },
];

const stallDoorText = {
  remark: '도면은 문을 칸 안쪽(남쪽)으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 문짝 폭은 문짝 선의 길이(약 131px)를 환산한 값이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
};

const doors: Item[] = [
  ...STALLS.map((s) => stallDoor(s.n, s.hinge, FRONT, 90, 575, stallDoorText)),
  stallDoor('mop', 265, 1606, 270, 565, {
    id: 'door-closet', name: '수채기실 문',
    remark: '12mm 칸막이와 같은 선으로 그려진 문이다. 도면은 문을 북쪽(화장실 쪽)으로 90도 연 상태로 그렸다. 문짝 폭은 문짝 선의 환산값이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
  }),
  {
    id: 'door-entrance', layer: 'door', name: '출입문 4/SSD', material: 'steelDoor',
    remark: '도면은 문을 동쪽(바깥)으로 90도 연 상태로 그렸다. 경첩은 개구의 북쪽 끝이다. 문틀(북쪽)은 도면의 외곽만 따랐다. 문틀 머리 아랫면 2,380은 단면상세도의 환산값이다(door-entrance-head). 문짝 높이를 문틀 머리 아랫면까지로 본 것은 가정이다. 문짝 아래 끝은 재료분리대 윗면(노출 10)이다.',
    shapes: [
      { type: 'leaf', hx: 4526, hy: 2264, width: 1000, angleDeg: 0, thickness: 40, z0: 10, z1: ENTRY_HEAD },
      box(4443, 2195, 4594, 2247, 0, ENTRY_HEAD),
    ],
    dims: [dim('문짝 폭', 1000, 'scaled'), dim('문짝 높이', ENTRY_HEAD, 'assumed')],
  },
  {
    id: 'door-entrance-head', layer: 'door', name: '출입구 문틀 머리', material: 'steelDoor',
    remark: '높이는 도면 오른쪽 위 「"A" 단면상세도」에서 환산했다. 상세도의 표기 450의 눈금(y 574.3 / 780.5px)으로 세로 축척 2.182mm/px를 구했다. 복도 쪽 기존 천장선은 y 568.5 ~ 574px, 화장실 천장선은 y 778 ~ 781px(450 아래)다. 문틀 머리의 윗선은 y 779 ~ 784px로 화장실 천장선과 같고, 아랫선은 y 811 ~ 813px다. (812.5 - 780.5) × 2.182 = 70이라서 아랫면을 천장고 2,450 - 70 = 2,380에 두었다. 문틀 머리의 서쪽은 바로 화장실 천장이다. 화장실 천장선은 문틀 머리의 서쪽 면(x 약 3869px)까지 이어지고, 그 서쪽 열(x 3700 / 3760 / 3820px)의 y 811 ~ 814px에는 선이 없다. 상세도의 주기 「THK.9.5 석고보드2겹 / 퍼티 위 수성광택페인트 2회 (출입구 부분)」은 문틀 머리 위 복도 쪽 석고보드(화장실 천장보다 위)를 가리킨다. 모델 범위 밖이라 그리지 않았다. 평면 범위는 문틀 선(X 4,443)에서 동측 벽 바깥 면까지다.',
    shapes: [box(4443, 2195, 4600, 3992, ENTRY_HEAD, CH)],
    dims: [dim('아랫면 높이', ENTRY_HEAD, 'scaled'), dim('두께 (높이 방향)', 70, 'scaled'), dim('상세도 세로 축척', '2.182 mm/px (표기 450)', 'scaled')],
  },
  {
    id: 'door-entrance-side', layer: 'door', name: '출입문 옆 고정 유리', material: 'glass',
    remark: '출입문 남쪽에 위아래 틀과 가는 이중선(유리)이 그려져 있다. 고정 유리로 해석했다. 이름은 도면에 없다. 높이는 문틀 머리 아랫면(단면상세도 환산 2,380)까지로 두었다.',
    shapes: [
      box(4510, 3295, 4530, 3948, 0, ENTRY_HEAD),
      box(4443, 3247, 4594, 3295, 0, ENTRY_HEAD, 'steelDoor'),
      box(4443, 3948, 4594, 3992, 0, ENTRY_HEAD, 'steelDoor'),
    ],
    dims: [dim('유리 길이', 653, 'scaled'), dim('높이 (문틀 머리 아랫면까지)', ENTRY_HEAD, 'scaled')],
  },
  {
    id: 'door-ps-hatch', layer: 'door', name: 'PS 점검구 5/SSD', note: "SST'L 점검구 설치 (FL+900) (600x900)", material: 'metal',
    remark: '도면은 점검구 문을 수채기실 쪽으로 약 45도 연 상태로 그렸다. parts.ts 의 문 부품은 90도 단위만 받아 leaf 도형을 직접 썼다. 문짝은 문틀 안에 있다. 경첩은 문짝 이중선의 중심선 끝(437, 2,782)이고, 문짝 폭은 그 중심선의 길이(약 530)다. 문짝 두께 30은 이중선 간격의 환산값이다. 개구 폭은 태그 아래의 치수 600(서쪽 문설주 X 약 394에서 조적벽 서쪽 면까지)이다. 문틀의 평면 범위는 도면 선의 환산값이다. 문틀 북쪽 끝은 마감선(Y 2,778)이다.',
    shapes: [
      // 경첩점은 도면 문짝 이중선의 중심선 끝 (1936.1, 1618.0)px다.
      { type: 'leaf', hx: 437, hy: 2782, width: 530, angleDeg: 315, thickness: 30, z0: 900, z1: 1800 },
      // 문틀 (서쪽, 동쪽). 북쪽 끝은 마감선 y 1616.5px다. 서쪽 문틀은 턱이 있다(안쪽 면 북쪽 구간 422, 남쪽 구간 435).
      box(400, 2778, 422, 2815, 900, 1800), box(400, 2815, 435, 2910, 900, 1800),
      box(948, 2778, 1000, 2910, 900, 1800),
    ],
    dims: [
      dim('개구 폭', 600, 'drawn'), dim('개구 높이', 900, 'drawn'), dim('하단 높이', 'FL+900', 'drawn'),
      dim('문짝 폭', 530, 'scaled'), dim('열린 각도', '약 45도', 'scaled'), dim('문틀 폭', '서 40, 동 52', 'scaled'), dim('문짝 두께', 30, 'scaled'),
    ],
  },
];

const fixtures: Item[] = [
  // 양변기는 남측 마감선(Y 6,580)에 붙어 북쪽을 본다. 중심 X는 물탱크 선의 환산값이다.
  ...STALLS.map((s) => toilet(s.n, s.cx, FACE.s, 270)),
  // 세면기는 북측 마감선(Y 120)에서 303 떨어져 남쪽을 본다. 도면의 세면기 기호에 토수구 1개와 손잡이 2개가 그려져 있다.
  basin(1, 2514, 423, '북측 마감선에서 중심까지', 303, 220),
  basin(2, 3223, 423, '북측 마감선에서 중심까지', 303, 220),
  basin(3, 3924, 423, '북측 마감선에서 중심까지', 303, 220),
  faucet(1, 2514, 423, 90, 220),
  faucet(2, 3223, 423, 90, 220),
  faucet(3, 3924, 423, 90, 220),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 높이와 안쪽 형상은 가정값이다.',
    shapes: [
      rbox(503, 1666, 925, 2226, 0, 260, 30),
      { type: 'plate', x0: 503, y0: 1666, x1: 925, y1: 2226, z0: 260, z1: 350, r: 30, holes: [{ x0: 561, y0: 1718, x1: 910, y1: 2177, r: 50 }] },
      cyl(740, 1946, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭 (동서)', 422, 'scaled'), dim('길이 (남북)', 560, 'scaled'), dim('높이', 350, 'assumed')],
  },
  // 배수구는 구배 바닥(floor-main)의 낮은 점에 있다. 바닥 높이 -10(구배 깊이, 가정)에 둔다.
  floorDrain('fd-main', 2609, 3670, -10),
  floorDrain('fd-basin', 3007, 470, -10),
];

const glassShelfText = { note: '유리선반 설치 (r=300) (기계설비공사)' };
const stallHookText = {
  note: '가방걸이 설치',
  remark: '도면의 칸 문 4개에 가방걸이 기호가 그려져 있다. 기호는 문짝의 서쪽 면에 있다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다.',
};

// 출입구 쪽 2곳의 도면 주기는 「코너 비트 설치」다. 나머지 6곳은 「코너 비드 설치」다.
const cornerBitText = {
  note: '코너 비트 설치',
  remark: '위치는 도면의 지시선이 가리키는 벽 모서리(문설주의 마감 모서리)다. 도면 표기는 「코너 비트」다(다른 6곳은 「코너 비드」). 같은 코너 비드로 보았다. 높이는 바닥에서 천장까지다. 「"A" 단면상세도」에서 문틀 머리의 서쪽에 벽이 없어 개구의 측면이 천장까지 이어진다. 폭, 두께는 도면에 없다. 가정값이다.',
};
// 창 옆 4곳은 창 구간에만 모서리가 있다. 창대 아래와 창 위는 벽면이 이어진다.
const openingText = {
  remark: '위치는 도면의 지시선이 가리키는 벽 모서리(창의 옆 모서리)다. 창대 아래와 창 위는 벽면이 이어져 모서리가 없어 창대 높이(1,200)에서 창 상단(2,100)까지만 그렸다. 폭, 두께, 높이는 도면에 없다. 가정값이다.',
};

const accessories: Item[] = [
  ...WINDOWS.map(([y0, y1], i): Item => ({
    id: `window-sill-${i + 1}`, layer: 'accessory', name: `창대석 (${i === 0 ? '북쪽' : '남쪽'} 창)`, note: 'THK20 인조대리석 창대석 설치 (W=100)', material: 'marble',
    remark: '평면 위치는 도면의 점묘 범위를 환산한 값이다. 창대석이 벽 마감선 안쪽으로 약 24 나온다. 높이는 가정값이다.',
    shapes: [box(44, y0, 144, y1, SILL - 20, SILL)],
    dims: [dim('폭', 100, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  })),
  {
    id: 'shelf', layer: 'accessory', name: '인조대리석 선반', note: 'THK20 인조대리석 선반 설치 (하부 고정 철물)', material: 'marble',
    remark: '평면 크기는 도면의 선반 선을 환산한 값이다. 설치 높이는 가정값이다.',
    shapes: [box(413, FACE.n, 1314, 315, 830, 850)],
    dims: [dim('길이', 901, 'scaled'), dim('깊이', 195, 'scaled'), dim('두께', 20, 'drawn'), dim('설치 높이', 850, 'assumed')],
  },
  {
    id: 'mirror-shelf', layer: 'accessory', name: '선반 위 방습거울', note: 'THK.5 방습거울 (기계설비공사)', material: 'mirror',
    facing: [0, 1],
    remark: '도면에 거울 크기 표기가 없다. 평면 위치와 길이는 북측 벽면의 선을 환산한 값이다. 높이는 가정값이다.',
    shapes: [box(609, FACE.n, 1127, FACE.n + 5, 950, 1850)],
    dims: [dim('길이', '약 518', 'scaled'), dim('두께', 5, 'drawn'), dim('높이', 900, 'assumed')],
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
    remark: '조적벽의 동쪽 면에 있다. 평면 위치는 도면의 굵은 선(Y 2,868 ~ 3,463)을 환산한 값이다. 하단 높이는 가정값이다.',
    shapes: [box(1100, 2865, 1105, 3465, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, 'assumed')],
  },
  {
    id: 'counter', layer: 'accessory', name: '세면대 상판', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(Y 713의 실선, 가림 칸막이에서 동측 마감선까지)을 환산한 값이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      {
        type: 'plate', x0: 2086, y0: FACE.n, x1: FACE.e, y1: 713, z0: COUNTER - 20, z1: COUNTER,
        holes: [{ cx: 2514, cy: 423, r: 205 }, { cx: 3223, cy: 423, r: 205 }, { cx: 3924, cy: 423, r: 205 }],
      },
      // 뒷턱
      box(2086, FACE.n, FACE.e, FACE.n + 15, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 2294, 'scaled'), dim('깊이', 593, 'scaled'), dim('윗면 높이', COUNTER, 'assumed'), dim('두께', 20, 'assumed')],
  },
  // 유리선반은 칸의 남서 모서리에 있다(도면의 점선 1/4 원).
  ...STALLS.map((s) => glassShelf(s.n, s.west, FACE.s, 270, 300, glassShelfText)),
  ...STALLS.map((s) => stallHook(s.n, s.hinge, FRONT, 90, 1, 290, stallHookText)),
  {
    id: 'threshold', layer: 'accessory', name: '화강석 재료분리대', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치(출입문 개구)다. 두께 30은 석재 두께다. 바닥 위로 드러나는 높이는 도면에 없다. 10으로 가정했다.',
    shapes: [box(4445, 2247, 4595, 3247, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 1000, 'scaled'), dim('노출 높이', 10, 'assumed')],
  },
  {
    id: 'tactile-blocks', layer: 'accessory', name: '점형블럭 2EA', note: '점형블럭 2EA (매립형)', material: 'tactile',
    remark: '동측 벽 바깥 면에서 300(도면 표기) 떨어져 있다. 남북으로 2장이 붙어 있다.',
    shapes: [box(4900, 3292, 5200, 3594, 0, 5), box(4900, 3598, 5200, 3900, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('벽 바깥 면에서의 거리', 300, 'drawn'), dim('1장 크기', '약 300 x 300', 'scaled')],
  },
  {
    id: 'braille-sign', layer: 'accessory', name: '점자표지판', note: '벽면점자표지판설치', material: 'metal',
    remark: '도면의 표시는 출입문 남쪽 고정 유리 틀의 바깥 면에 그린 짧은 선(약 90)이다. 그 길이를 폭으로 썼다. 두께와 설치 높이는 가정값이다.',
    shapes: [box(4594, 3567, 4610, 3655, 1400, 1550)],
    dims: [dim('위치', '출입구 바깥 면', 'scaled'), dim('폭', 88, 'scaled'), dim('설치 높이', 1400, 'assumed')],
  },
  {
    id: 'gallery-north', layer: 'accessory', name: '갤러리창 2/AG (북쪽)', note: '갤러리창 설치 (350X350)', material: 'metal',
    remark: '서측 벽 바깥 면에 그려져 있다. 평면 위치는 환산값이다. 설치 높이는 가정값이다(벽돌 메우기 구간과 같게 두었다).',
    shapes: [box(-140, VENT_HOLES[0][0], -100, VENT_HOLES[0][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  {
    id: 'gallery-south', layer: 'accessory', name: '갤러리창 2/AG (남쪽)', note: '갤러리창 설치 (350X350)', material: 'metal',
    remark: '서측 벽 바깥 면에 그려져 있다. 평면 위치는 환산값이다. 설치 높이는 가정값이다(벽돌쌓기 구간과 같게 두었다).',
    shapes: [box(-140, VENT_HOLES[1][0], -100, VENT_HOLES[1][1], HOLE_Z0, HOLE_Z1)],
    dims: [dim('크기', '350 x 350', 'drawn'), dim('설치 높이', `${HOLE_Z0} ~ ${HOLE_Z1}`, 'assumed')],
  },
  // 코너 비드. 도면의 「코너 비드 설치」 지시선 8개가 가리키는 벽 모서리에 붙였다.
  // 창 옆 4곳(1, 2, 5, 6)은 창 구간(창대 ~ 창 상단)에만 모서리가 있다. 출입구 옆 2곳(7, 8)은 바닥 ~ 천장이다(개구 측면이 천장까지 이어진다).
  cornerBead(1, '북쪽 창 북단 모서리', [box(FACE.w, 320, FACE.w + 5, 350, SILL, HEAD), box(FACE.w - 25, 345, FACE.w + 5, 350, SILL, HEAD)], openingText),
  cornerBead(2, '북쪽 창 남단 모서리', [box(FACE.w, 1543, FACE.w + 5, 1573, SILL, HEAD), box(FACE.w - 25, 1543, FACE.w + 5, 1548, SILL, HEAD)], openingText),
  cornerBead(3, '조적벽 북동 모서리', [box(1100, 1595, 1105, 1625, 0, CH), box(1075, 1595, 1105, 1600, 0, CH)]),
  cornerBead(4, '조적벽 남동 모서리', [box(1100, 3725, 1105, 3755, 0, CH), box(1075, 3750, 1105, 3755, 0, CH)]),
  cornerBead(5, '남쪽 창 북단 모서리', [box(FACE.w, 4325, FACE.w + 5, 4355, SILL, HEAD), box(FACE.w - 25, 4350, FACE.w + 5, 4355, SILL, HEAD)], openingText),
  cornerBead(6, '남쪽 창 남단 모서리', [box(FACE.w, 5543, FACE.w + 5, 5573, SILL, HEAD), box(FACE.w - 25, 5543, FACE.w + 5, 5548, SILL, HEAD)], openingText),
  // 출입구 쪽 2곳은 문설주의 마감 모서리(4,380, 2,214), (4,380, 3,970)에 붙였다.
  cornerBead(7, '출입구 북쪽 모서리', [box(FACE.e - 5, 2189, FACE.e, 2219, 0, CH), box(FACE.e - 5, 2214, FACE.e + 25, 2219, 0, CH)], cornerBitText),
  cornerBead(8, '출입구 남쪽 모서리', [box(FACE.e - 5, 3965, FACE.e, 3995, 0, CH), box(FACE.e - 5, 3965, FACE.e + 25, 3970, 0, CH)], cornerBitText),
];

const lightRemark = '도면에 손으로 적은 「조명」 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-shelf', layer: 'light', name: '조명 표시 (선반·거울 구간)', note: '손글씨 「조명」', remark: `${lightRemark} 선반 위를 형광펜으로 칠했다.`,
    lamp: { power: 1.4 },
    shapes: [box(470, 160, 1330, 330, CH - 40, CH)],
    dims: [dim('표시 구간 길이', 860, 'scaled')],
  },
  {
    id: 'light-mop', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 322, cy: 2174, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-ps', layer: 'light', name: '조명 표시 (PS)', note: '손글씨 「조명」', remark: `${lightRemark} 표시는 PS 안에 있다.`,
    lamp: { power: 0.6 },
    shapes: [{ type: 'cylinder', cx: 373, cy: 3313, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

const floorNote = '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)';

// 마감. 도면 좌상단 「지상2층 강의동 화장실 마감 변경부분」 표와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
const finishes: Item[] = [
  {
    id: 'floor-main', layer: 'finish', name: '바닥 마감 (화장실)', material: 'floorTile', note: floorNote,
    remark: '평면의 주기는 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 출입구 앞의 「+」 표시 구역(X 3,393 ~ 4,443, Y 1,821 ~ 4,239. 동쪽 끝은 출입구 개구 안의 문틀 선이다)의 주기는 「기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이다. 마감 타일이 같아서 나누지 않았다. 도면의 X 표시는 물이 빠지는 방향(바닥 구배)이다. 화장실 가운데에는 배수구(fd-main)로 모이는 X 표시가 있다. 세면대 앞에는 세면대 아래 배수구(fd-basin)로 모이는 화살표 2개가 있다. 그래서 세면대 앞 구역(Y 1,150까지)과 나머지를 나눠 각각 그 배수구로 기울였다. 나누는 선의 위치와 구배 깊이(10)는 가정이다. 바닥 가장자리는 0, 배수구 위치는 -10이다. 줄눈 위치는 도면의 타일 나누기 선(X 513, Y 373에서 600 간격)에 맞췄다. 색과 무늬는 도면에 없다. 가정이다.',
    shapes: [
      { type: 'pan', x0: 2086, y0: FACE.n, x1: FACE.e, y1: 1150, z: 0, drop: 10, cx: 3007, cy: 470 },
      { type: 'pan', x0: 1100, y0: 1150, x1: FACE.e, y1: FACE.s, z: 0, drop: 10, cx: 2609, cy: 3670 },
      box(1100, FACE.n, 2086, 1150, -10, 0),
      box(FACE.w, FACE.n, 1100, 1600, -10, 0),
      box(FACE.w, 3750, 1100, FACE.s, -10, 0),
      box(FACE.e, 2195, 4445, 3992, -10, 0),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이', 10, 'assumed'), dim('줄눈 시작점', 'X 513, Y 373', 'scaled')],
  },
  {
    id: 'floor-mop', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'floorTile',
    remark: '수채기실 바닥의 별도 주기는 도면에 없다. 좌상단 표의 바닥 마감과 같은 것으로 가정했다. 평탄하게 그렸다. 도면에는 칸막이 선 말고 바닥 재료의 경계선이 없다. 화장실의 타일 나누기 선(Y 2,173, y 1478px)은 수채기실 안까지 이어진다. 그래서 칸막이 아래(Y 1,600 ~ 1,612)는 수채기실 바닥에 넣었다. 북쪽 끝은 칸막이의 북쪽 면(Y 1,600)이다.',
    shapes: [box(FACE.w, 1600, 1000, 2778, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'assumed')],
  },
  {
    id: 'wall-finish-main', layer: 'finish', name: '벽 마감 (화장실)', material: 'wall',
    note: '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착',
    remark: '벽의 안쪽 면(마감선)에 얇은 면(3mm)을 붙여 그렸다. 타일 두께 10으로 그리면 벽에 붙은 거울을 덮는다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다. PS 안쪽 면은 그리지 않았다.',
    shapes: [
      // 북측 벽
      box(FACE.w, FACE.n, FACE.e, FACE.n + 3, 0, CH),
      // 서측 벽 (창 구간은 창대 아래와 창 위)
      box(FACE.w, FACE.n, FACE.w + 3, WINDOWS[0][0], 0, CH),
      box(FACE.w, WINDOWS[0][0], FACE.w + 3, WINDOWS[0][1], 0, SILL - 20), box(FACE.w, WINDOWS[0][0], FACE.w + 3, WINDOWS[0][1], HEAD, CH),
      box(FACE.w, WINDOWS[0][1], FACE.w + 3, 2778, 0, CH),
      box(FACE.w, 3750, FACE.w + 3, WINDOWS[1][0], 0, CH),
      box(FACE.w, WINDOWS[1][0], FACE.w + 3, WINDOWS[1][1], 0, SILL - 20), box(FACE.w, WINDOWS[1][0], FACE.w + 3, WINDOWS[1][1], HEAD, CH),
      box(FACE.w, WINDOWS[1][1], FACE.w + 3, FACE.s, 0, CH),
      // 동측 벽 (출입구 구간은 천장까지 비어 있다)
      box(FACE.e - 3, FACE.n, FACE.e, 2214, 0, CH), box(FACE.e - 3, 3970, FACE.e, FACE.s, 0, CH),
      // 남측 벽
      box(FACE.w, FACE.s - 3, FACE.e, FACE.s, 0, CH),
      // 조적벽 동쪽 면과 양 끝면, PS 남측 벽의 남쪽 면
      box(1100, 1600, 1103, 3750, 0, CH), box(1000, 1597, 1100, 1600, 0, CH), box(FACE.w, 3750, 1100, 3753, 0, CH),
      // 수채기실 (조적벽 서쪽 면, 남측 벽 북쪽 면)
      box(997, 1612, 1000, 2778, 0, CH),
      // 남측 벽 북쪽 면은 점검구 개구(X 400 ~ 1,000, z 900 ~ 1,800)를 비운다.
      box(FACE.w, 2775, 400, 2778, 0, CH), box(400, 2775, 1000, 2778, 0, 900), box(400, 2775, 1000, 2778, 1800, CH),
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

export const lecture2fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1836, 981],
  mmPerPx: 4.352,
  mmPerPxY: 4.372,
};

export const lecture2fModel: SheetModel = {
  ceilingHeight: CH,
  bounds: { x0: -100, y0: -100, x1: 4600, y1: 6800 },
  eye: { from: [3300, 1600, 1600], to: [1500, 5400, 1100] },
  // 남동쪽에서 본다. 변기(남측 벽)와 세면기(북측 벽)가 마주 보는 벽에 붙어 있다. 벽을 다 세우면 어느 방향에서도 한쪽이 가린다.
  // 기본 절단 높이는 천장고라서 아이소 화면에서는 앞쪽 벽이 실내 일부를 가린다. 슬라이더를 1,200으로 내리면 변기와 세면기가 모두 보인다. 전신 거울(조적벽 동쪽 면)도 보이는 남동쪽을 골랐다.
  isoDir: [1, 1],
  // 창은 서측 벽에 있다. 자연광은 서쪽에서 동쪽으로 들어온다.
  daylightDir: [1, 0.2],
  tileOrigin: { floorTile: [513, 373] },
  items: [...walls, ...partitions, ...doors, ...fixtures, ...accessories, ...lights, ...finishes],
  // 치수선 위치는 도면의 치수선 위치와 같다. 왼쪽 치수선은 도면에서 기울어 있어 평면 가운데 높이의 위치를 썼다.
  dimLines: [
    { from: [0, -2520], to: [4600, -2520], label: '4,600' },
    { from: [0, 9301], to: [4600, 9301], label: '4,600' },
    { from: [-3162, 0], to: [-3162, 6800], label: '6,800' },
    { from: [-2966, 0], to: [-2966, 2900], label: '2,900' },
    { from: [-2966, 2900], to: [-2966, 6800], label: '3,900' },
    { from: [-2767, 0], to: [-2767, 2000], label: '2,000' },
    { from: [-2767, 2000], to: [-2767, 2900], label: '900' },
    { from: [-2767, 2900], to: [-2767, 3700], label: '800' },
    { from: [-2767, 3700], to: [-2767, 6800], label: '3,100' },
    { from: [7546, 0], to: [7546, 2000], label: '2,000' },
    { from: [7546, 2000], to: [7546, 5000], label: '3,000' },
    { from: [7546, 5000], to: [7546, 6800], label: '1,800' },
    { from: [7745, 0], to: [7745, 6800], label: '6,800' },
    { from: [2080, 936], to: [FACE.e, 936], label: '2,300' },
    { from: [1334, 1600], to: [1334, 2800], label: '1,200' },
    { from: [400, 3213], to: [1000, 3213], label: '600' },
    { from: [0, 4040], to: [1050, 4040], label: '1,050' },
    { from: [1185, 4882], to: [2250, 4882], label: '1,065' },
    { from: [2250, 4882], to: [3315, 4882], label: '1,065' },
    { from: [3315, 4882], to: [FACE.e, 4882], label: '1,065' },
    { from: [994, FRONT], to: [994, FACE.s], label: '1,400' },
    { from: [4600, 4092], to: [4900, 4092], label: '300' },
  ],
  roomLabels: [{ text: '화장실(여)', at: [2685, 1897] }, { text: 'PS', at: [527, 3340] }],
};
