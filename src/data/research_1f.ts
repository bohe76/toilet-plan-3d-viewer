// 1층 연구동 화장실 확대평면도 (변경후) — PDF 4페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분(300dpi 기울기 보정 이미지)과 work/measure/p4/tools/ 의 측정값을 mm로 환산했다.
// 환산식: X = (px - 1543.5) * 4.372, Y = (py - 968.5) * 4.372. 축척 4.372는 이 장의 치수선 6,900(1,578px)으로 구했다.
// 가로 축척은 벽 중심 사이 7,200 / 1,647.2px = 4.371, 동쪽 3,750 / 858.5px = 4.368이다. 세로 4.372와 0.1% 안쪽이라서 mmPerPxY는 두지 않았다.
// 위 치수선 7,200(1,652px, 4.358)과 아래 7,200(1,644.3px, 4.379)은 서쪽 끝이 스캔 뒤틀림으로 3px씩 반대로 치우친 값이다.
// 원점 X=0은 치수선 7,200의 서쪽 끝이다(서측 벽 중심). Y=0은 통심 Ⓖ다(창대석 안쪽 끝).
// 원점 y 968.5는 벽 중심이 표기 치수(4,095 / 5,625 / 6,900)에 맞는 값이다. 왼쪽 치수선의 시작 눈금은 y 971.5, 오른쪽은 969.5다.
// 서측 벽이 스캔에서 4px 기운다. 그래서 위 치수선(7,200 / 3,450 / 3,750)은 환산 오차가 10 ~ 22mm, 아래 전체 7,200은 -12mm다. 나머지 분할은 10mm 이내다.
// 칸 치수(2,006 / 1,023 / 1,017, 1,403 / 1,415)는 벽 선 안쪽의 마감선(약 22mm 안쪽)에서 잰 값이다.
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/research_1f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 research_1f_added.ts 에 있다.
// 여·남 두 실을 한 모델에 넣었다. 실별 품목의 id와 부품 key에 f(여), m(남)을 붙였다.
import { COUNTER, GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet, urinal } from './parts';
import {
  GRAB_REMARK, babySeat, backrest, cornerBeadWings, curtainBox, curtainPocketTop, emergencyBell, foldGrabBar, lowWall, slidingDoor, urinalChase, urinalGrabBar, urinalScreens, wallGrabBar,
} from './parts_extra';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2500; // 천장고. 도면 표기 CH 2,500

// 벽 면 (축척 환산값). 마감선은 벽 선의 안쪽 가는 선이다.
export const W_IN = 101; // 서측 벽 안쪽 면
export const E_IN = 7100; // 동측 벽 안쪽 면
export const N_IN = -52; // 북측 벽 안쪽 면 (대변기 칸 구간)
const N_FIN = -31; // 북측 벽 마감선
const W_FIN = 116; // 서측 벽 마감선
const E_FIN = 7079; // 동측 벽 마감선
export const C_W = 3334; // 중앙 벽 서쪽 면 (여)
export const C_E = 3563; // 중앙 벽 동쪽 면 (남)

// 칸막이 위치 (도면 표기: 마감선에서 2,006, 1,023, 1,017)
const PART_A = N_FIN + 2006; // 1,975. 장애인용 칸과 칸 2 사이
const PART_B = PART_A + 1023; // 2,998. 칸 2와 칸 3 사이
export const STALL_S = PART_B + 1017; // 4,015. 칸 3 남쪽 마감선
// 대변기 칸 전면 칸막이 (도면 표기: 마감선에서 1,403은 가까운 면, 1,415는 먼 면)
export const FRONT_F = W_FIN + 1403 + PT / 2; // 1,525
export const FRONT_M = E_FIN - 1403 - PT / 2; // 5,670

/** 대변기 칸 2, 3. cy는 양변기 중심 Y, hinge는 문 경첩 Y, north는 칸의 북쪽 칸막이 Y다. */
export const STALLS = [
  { n: 2, cy: 2492, hinge: 2761, north: PART_A },
  { n: 3, cy: 3511, hinge: 3785, north: PART_B },
];
/** 장애인용 칸 양변기 중심 X (여, 남). 뒤 벽은 북측 벽 안쪽 면이다. */
export const ACC_WC = { f: 546, m: 6641 };

// 0.5B 조적벽 (도면 표기: 북측 기준선에서 벽 중심까지 4,095)
const BRICK = { y0: 4047, y1: 4143 };
// 세면 구역 남쪽 중간 벽 (도면 표기: 벽 중심 5,625)
const MID = { y0: 5547, y1: 5702 };
// 세면대 칸막이벽의 두겁돌 (도면 표기 W=180. 남쪽 면에서 중간 벽까지 1,500)
const CAP = { y0: MID.y0 - 1500 - 180, y1: MID.y0 - 1500 };
// 창 사이 기둥의 서쪽 면 X(x 2239)와 남쪽 면 Y(y 1082)
const PIER = { x0: 3043, y1: 496 };
// 「"A" 단면상세도」의 커텐박스. 창 위 면은 천장보다 150 높다(표기 150). 창 상단과 창틀 머리는 그 면에 붙는다.
const WIN_TOP = CH + 150;
/** 커텐박스: y는 창틀 안쪽 면(창대석 바깥 끝, 표기 340의 시작), front는 그 면에서 갈바 판까지(표기 340), 여·남은 박스 양 끝 X(평면 점선)다. */
const CURTAIN = { y: -203, front: 340, f: [1738, 1738 + 1300], m: [C_E, 4860] } as const;
/** 갈바 판의 실내 쪽 면 Y. 천장은 여기서 끝난다. */
const CURTAIN_FACE = CURTAIN.y + CURTAIN.front;

const walls: Item[] = [
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽',
    remark: '스캔에서 벽 선이 위아래로 4px 기운다. 중간 높이(y 1700)의 선 위치를 썼다. 도면의 벽은 출입문 밖(복도 쪽)으로 y 2779(Y 7,916)까지 이어진다. 복도 쪽으로 뻗는 부분은 모델 범위 밖이라서 남측 벽 바깥 면(Y 7,003)에서 잘랐다.',
    shapes: [box(-101, -354, W_IN, 7003, 0, CH)],
    dims: [dim('두께', 202, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽',
    remark: '북동 모서리는 바깥 면이 x 3250(X 7,459)까지 두꺼워진다(y 888 ~ 1056, Y −354 ~ 383). 모서리 기둥으로 보고 넣었다. 그 동쪽으로 뻗는 선(x 3410까지)은 방 밖 구조체라서 넣지 않았다.',
    shapes: [box(E_IN, -354, 7303, 7003, 0, CH), box(7303, -354, 7459, 383, 0, CH)],
    dims: [dim('서측 벽 중심에서 동측 벽 중심까지', 7200, 'drawn'), dim('두께', 203, 'scaled'), dim('북동 모서리 바깥 면까지 두께', 359, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽',
    remark: '창대 높이는 도면에 없다. 가정값이다. 창 상단은 「"A" 단면상세도」의 커텐박스 홈 윗면(천장보다 150 높은 면, 2,650)에서 끝냈다. 상세도의 창틀 머리는 보 아래 면(약 2,666)에 붙는다. 150은 천장 면에서 홈 윗면까지의 표기다. 그래서 창 폭 구간에는 천장고 아래에 창 위 벽이 없다. 창 위에는 상세도의 보 아래 끝(홈 윗면 위 18, 상세도 환산값)까지만 그렸다. 커텐박스 길이 구간 가운데 창 폭 밖은 홈의 뒤가 뚫려 보이지 않게 벽을 홈 윗면(2,650)까지 올렸다. 창 구간의 안쪽 면은 창대석 안쪽 끝(Y −2)이다. 여 창 동쪽 끝과 기둥 사이(X 2,942 ~ 3,043)의 벽 면은 대변기 칸 구간과 같은 y 956(Y −52)이다. 서측 벽 밖으로 뻗는 북측 외벽(X −360 ~ −101)과 그 서쪽의 창은 방 밖이라서 넣지 않았다.',
    shapes: [
      // 여 대변기 칸 구간, 남 대변기 칸 구간
      box(W_IN, -354, 1840, N_IN, 0, CH), box(4652, -354, E_IN, N_IN, 0, CH),
      // 창 구간 (창대 아래, 창 위의 보 아래 끝)
      box(1840, -354, 2942, -2, 0, SILL - 20), box(1840, -354, 2942, CURTAIN.y, WIN_TOP, WIN_TOP + 18),
      box(C_E, -354, 4652, -2, 0, SILL - 20), box(C_E, -354, 4652, CURTAIN.y, WIN_TOP, WIN_TOP + 18),
      // 두 창 사이
      box(2942, -354, C_E, N_IN, 0, CH),
      // 커텐박스 길이 구간 가운데 창 폭 밖 (천장고에서 홈 윗면까지)
      box(CURTAIN.f[0], -354, 1840, N_IN, CH, WIN_TOP), box(2942, -354, CURTAIN.f[1], N_IN, CH, WIN_TOP), box(4652, -354, CURTAIN.m[1], N_IN, CH, WIN_TOP),
    ],
    dims: [dim('두께 (대변기 칸 구간)', 302, 'scaled'), dim('창대 높이', SILL, 'assumed'), dim('창 상단 높이 (홈 윗면, 천장고 + 150)', WIN_TOP, 'scaled')],
  },
  {
    id: 'window-f', layer: 'wall', name: '창호 1/CAW (여)', material: 'glass',
    remark: '상세도에서 창틀 머리는 보 아래 면(y 581 ~ 584, 약 2,666)에 붙는다. 모델은 홈 윗면 높이 2,650에서 끝냈다. 150은 천장 면에서 홈 윗면까지의 표기다. 창대 높이는 가정이다.',
    shapes: [box(1840, -264, 2942, -244, SILL, WIN_TOP)],
    dims: [dim('폭', 1102, 'scaled'), dim('상단 높이 (홈 윗면, 천장고 + 150)', WIN_TOP, 'scaled'), dim('창대 높이', SILL, 'assumed')],
  },
  {
    id: 'window-m', layer: 'wall', name: '창호 1/CAW (남)', material: 'glass',
    remark: '창의 서쪽 끝(x 2355.4, X 3,550)은 중앙 벽 동쪽 면(X 3,563)과 13mm 다르다. 벽 면에 맞췄다. 상세도에서 창틀 머리는 보 아래 면(y 581 ~ 584, 약 2,666)에 붙는다. 모델은 홈 윗면 높이 2,650에서 끝냈다. 150은 천장 면에서 홈 윗면까지의 표기다. 창대 높이는 가정이다.',
    shapes: [box(C_E, -264, 4652, -244, SILL, WIN_TOP)],
    dims: [dim('폭', 1089, 'scaled'), dim('상단 높이 (홈 윗면, 천장고 + 150)', WIN_TOP, 'scaled'), dim('창대 높이', SILL, 'assumed')],
  },
  {
    id: 'wall-pier', layer: 'wall', name: '창 사이 기둥',
    remark: '여 실 쪽으로 나온 부분이다. 도면의 외곽선만 따랐다.',
    shapes: [box(PIER.x0, N_IN, C_W, PIER.y1, 0, CH)],
    dims: [dim('폭', 291, 'scaled'), dim('깊이', 548, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-central', layer: 'wall', name: '중앙 벽 (여·남 사이)',
    shapes: [box(C_W, N_IN, C_E, MID.y0, 0, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 3450, 'drawn'), dim('두께', 229, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-central-low', layer: 'wall', name: '수채기실과 작은 실 사이 벽',
    remark: '서쪽 면이 중앙 벽 중심선(X 3,450)에 있다. 동쪽 면은 중앙 벽 동쪽 면과 거의 같다.',
    shapes: [box(3452, MID.y0, 3552, 7003, 0, CH)],
    dims: [dim('서측 벽 중심에서 벽 서쪽 면까지', 3450, 'drawn'), dim('두께', 100, 'scaled')],
  },
  {
    id: 'wall-brick-f', layer: 'wall', name: '0.5B 조적벽 (여)', note: '0.5B 조적벽 신설 (H=3,450)',
    remark: '도면 표기 높이 3,450은 천장 위까지다. 모델은 천장고(2,500)에서 잘랐다. 벽 중심은 표기 치수 4,095를 따랐다(선 위치 4,096).',
    shapes: [box(W_IN, BRICK.y0, 1495, BRICK.y1, 0, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', 4095, 'drawn'), dim('두께', 96, 'scaled'), dim('높이', 3450, 'drawn'), dim('길이', 1394, 'scaled')],
  },
  {
    id: 'wall-brick-m', layer: 'wall', name: '0.5B 조적벽 (남)', note: '0.5B 조적벽 신설 (H=3,450)',
    remark: '도면 표기 높이 3,450은 천장 위까지다. 모델은 천장고(2,500)에서 잘랐다.',
    shapes: [box(5697, BRICK.y0, E_IN, BRICK.y1, 0, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', 4095, 'drawn'), dim('두께', 96, 'scaled'), dim('높이', 3450, 'drawn'), dim('길이', 1403, 'scaled')],
  },
  {
    id: 'wall-mid-f', layer: 'wall', name: '세면 구역 남쪽 벽 (여)',
    remark: '서쪽 끝(X 1,395)과 서측 벽 사이가 세면 구역과 전실을 잇는 통로다.',
    shapes: [box(1395, MID.y0, 3452, MID.y1, 0, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', '4,095 + 1,530', 'drawn'), dim('두께', 155, 'scaled')],
  },
  {
    id: 'wall-mid-m', layer: 'wall', name: '세면 구역 남쪽 벽 (남)',
    remark: '동쪽 끝(X 5,701)과 동측 벽 사이가 세면 구역과 전실을 잇는 통로다.',
    shapes: [box(3552, MID.y0, 5701, MID.y1, 0, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', '4,095 + 1,530', 'drawn'), dim('두께', 155, 'scaled')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    remark: '전실 구간은 두께 204, 수채기실과 작은 실 구간은 두께 106이다. 출입문 위 높이는 도면에 없다. 가정값이다.',
    shapes: [
      box(W_IN, 6799, 1301, 7003, 0, CH), box(5907, 6799, E_IN, 7003, 0, CH),
      box(2549, 6897, 4652, 7003, 0, CH),
      // 출입문 위
      box(1301, 6799, 2549, 7003, HEAD, CH), box(4652, 6799, 5907, 7003, HEAD, CH),
    ],
    dims: [dim('북측 기준선에서 벽 중심까지', 6900, 'drawn'), dim('두께 (전실)', 204, 'scaled'), dim('출입문 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'wall-mop-west', layer: 'wall', name: '수채기실 서측 벽',
    remark: '문 개구 높이는 도면에 없다. 가정값이다.',
    shapes: [box(2549, MID.y1, 2649, 5896, 0, CH), box(2549, 6600, 2649, 6897, 0, CH), box(2549, 5896, 2649, 6600, HEAD, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 2600, 'drawn'), dim('두께', 100, 'scaled'), dim('문 개구 폭', 704, 'scaled')],
  },
  {
    id: 'wall-small-east', layer: 'wall', name: '작은 실 동측 벽 (남 전실 쪽)',
    remark: '점검구 개구 폭은 표기 600을 따랐다. 도면의 문틀 바깥은 y 2316.75 ~ 2454.5(Y 5,895 ~ 6,497, 약 602)이다. 개구는 표기 600으로 5,895 ~ 6,495에 두었다. 개구 높이는 표기 900이다. 하단을 바닥으로 보았다(가정).',
    shapes: [box(4556, MID.y1, 4652, 5895, 0, CH), box(4556, 6495, 4652, 6897, 0, CH), box(4556, 5895, 4652, 6495, 900, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', '3,450 + 1,150', 'drawn'), dim('두께', 96, 'scaled'), dim('점검구 폭', 600, 'drawn'), dim('점검구 높이', 900, 'drawn')],
  },
];

// 세면대 칸막이벽과 소변기 뒤 띠. 「0.5B 칸막이벽 설치 (H=1,400)」은 벽 높이로, 두겁돌 THK20은 그 위에 얹는 것으로 읽었다.
const LOW_H = 1400;
const CHASE_H = 1000; // 소변기 뒤 띠 높이. 가정
/** 남 소변기 중심 Y. 첫째는 장애인용이다. */
const URINAL_YS = [418, 1366, 2372, 3362];
const lowWallNote = '0.5B 칸막이벽 설치 (H=1,400) 상부 THK20 화강석 두겁돌 설치 (W=180)';
const lowWallRemark = '0.5B 벽은 두겁돌 안쪽의 점선(두께 약 100)이다. 두겁돌은 벽 위(1,400 ~ 1,420)에 얹었다. 길이는 표기 750(중앙 벽면에서 끝까지)을 따랐다.';

/** 세면대 칸막이벽 중심 Y(0.5B 벽 점선 3,893 ~ 3,994의 가운데)와 두겁돌 중심까지의 거리 */
const LOW_Y = (3893 + 3994) / 2;
const CAP_OFF = (CAP.y0 + CAP.y1) / 2 - LOW_Y;
/** 소변기 뒤 띠의 북쪽 끝(창대석 안쪽 끝) */
const CHASE_Y0 = -2;

const lowWalls: Item[] = [
  // 여는 중앙 벽 서쪽 면에서 서쪽(rot 180)으로, 남은 동쪽 면에서 동쪽(rot 0)으로 뻗는다. 틀의 +y가 반대라서 두겁돌 쪽 부호가 다르다.
  lowWall('f', C_W, LOW_Y, 180, 750, 101, 180, -CAP_OFF, LOW_H, { name: '세면대 칸막이벽 (여)', note: lowWallNote, remark: lowWallRemark }),
  lowWall('m', C_E, LOW_Y, 0, 750, 101, 180, CAP_OFF, LOW_H, { name: '세면대 칸막이벽 (남)', note: lowWallNote, remark: lowWallRemark }),
  urinalChase('m', C_E, CHASE_Y0, 0, CAP.y0 - CHASE_Y0, 162, CHASE_H, [], 436, {
    name: '소변기 뒤 띠 (남)', note: 'THK20 화강석 두겁돌 설치 (L=4,000)',
    remark: '중앙 벽 동쪽 면의 점묘 띠다(폭 162). 높이는 도면에 없다. 장애인용 소변기 손잡이가 띠 위를 지나게 그려져 있어서 손잡이보다 낮은 1,000으로 가정했다. 띠의 길이는 북측 창대석에서 세면대 칸막이벽까지 3,869다. 세면대 칸막이벽 두겁돌까지 합하면 4,049다. 소변기 뒤판 자리(폭 약 437)에도 점묘가 이어진다(띠 안쪽 x 2361 ~ 2378의 점 밀도: 뒤판 안 1,000px²당 5.9 ~ 9.2개, 소변기 사이 3.4 ~ 4.4개). 그래서 띠와 두겁돌을 끊지 않았다(강의동 3층과 같은 처리). 띠를 가로지르는 선은 소변기 뒤판의 윤곽이다. 소변기 부품의 뒤판과 그릇의 벽 쪽 부분은 띠 안에 묻힌다.',
    dims: [dim('길이 (주기)', 4000, 'drawn'), dim('길이 (선 위치, 칸막이벽까지)', 3869, 'scaled'), dim('폭', 162, 'scaled'), dim('두겁돌 두께', 20, 'drawn'), dim('높이', CHASE_H, 'assumed')],
  }),
];

const partNote = '12mm 지정칸막이 (H=1,950)';
const gapRemark = '「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다. 위치는 표기 치수(마감선에서 2,006, 1,023)를 따랐다.';
const frontRemark = '칸막이 앞 패널이다. 도면의 「(H=1,950)」 지시선은 칸 사이 칸막이를 가리킨다. 높이와 두께는 같은 것으로 가정했다. X는 표기 치수 1,403(가까운 면)과 1,415(먼 면)를 따랐다(선 위치는 여 1,521, 남 5,677).';
/** 전면 칸막이 조각의 Y 구간 (선분 검출값). 장애인용 칸 북쪽, 칸 2 북쪽, 칸 2·3 사이, 칸 3 남쪽 */
const FRONT_SPANS: [number, number][] = [[N_IN, 942], [1851, 2214], [2752, 3233], [3780, 4024]];

const partitions: Item[] = [
  {
    id: 'partition-f', layer: 'partition', name: '대변기 칸막이 (여)', note: partNote, remark: gapRemark,
    shapes: [PART_A, PART_B].map((y) => box(W_IN, y - PT / 2, FRONT_F - PT / 2, y + PT / 2, GAP, 1950)),
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('마감선에서 칸막이 A까지', 2006, 'drawn'), dim('칸 폭 (칸 2)', 1023, 'drawn'), dim('칸 폭 (칸 3)', 1017, 'drawn'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-m', layer: 'partition', name: '대변기 칸막이 (남)', note: partNote, remark: gapRemark,
    shapes: [PART_A, PART_B].map((y) => box(FRONT_M + PT / 2, y - PT / 2, E_IN, y + PT / 2, GAP, 1950)),
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('마감선에서 칸막이 A까지', 2006, 'drawn'), dim('칸 폭 (칸 2)', 1023, 'drawn'), dim('칸 폭 (칸 3)', 1017, 'drawn'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-front-f', layer: 'partition', name: '대변기 칸 전면 칸막이 (여)', remark: frontRemark,
    shapes: FRONT_SPANS.map(([y0, y1]) => box(FRONT_F - PT / 2, y0, FRONT_F + PT / 2, y1, GAP, 1950)),
    dims: [dim('마감선에서 가까운 면까지', 1403, 'drawn'), dim('마감선에서 먼 면까지', 1415, 'drawn'), dim('높이', 1950, 'assumed'), dim('패널 위치', '선분 검출값', 'scaled')],
  },
  {
    id: 'partition-front-m', layer: 'partition', name: '대변기 칸 전면 칸막이 (남)', remark: frontRemark,
    shapes: FRONT_SPANS.map(([y0, y1]) => box(FRONT_M - PT / 2, y0, FRONT_M + PT / 2, y1, GAP, 1950)),
    dims: [dim('마감선에서 가까운 면까지', 1403, 'drawn'), dim('마감선에서 먼 면까지', 1415, 'drawn'), dim('높이', 1950, 'assumed'), dim('패널 위치', '선분 검출값', 'scaled')],
  },
  urinalScreens('m', C_E, [3000, 2000, 1000].map((d) => CAP.y0 - d), 0, 450, 1250, 400, {
    name: '소변기 칸막이 (남)', note: '12mm 지정 칸막이 (450x1,250 - 3개소)',
    remark: '위치는 표기 치수 1,000 × 3(세면대 칸막이벽 북쪽 면에서 1,000 간격)을 따랐다. 길이 450은 중앙 벽면에서 잰다(도면 선 455). 높이 1,250의 하단 높이는 도면에 없다. 400으로 가정했다.',
  }),
];

/** 슬라이딩 도어 문짝의 북쪽 끝 Y, 길이(남쪽 끝 Y 1,917까지), 손잡이 중심(Y 1,882)까지의 거리 */
const SLIDE = { y: 912, length: 1005, handle: 970 };

const stallDoorText = { remark: '도면은 문을 안쪽으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.' };
const entranceRemark = '도면은 문을 남쪽(복도)으로 90도 연 상태로 그렸다. 경첩은 도면 문짝 선의 벽 쪽 끝(마구리)이다. 경첩 X는 문짝 선 두께의 중심이다. 문짝 폭은 마구리에서 문짝 끝까지의 문짝 선 길이다. 열림 호는 확인용으로만 썼다. 문 높이는 가정값이다.';

const doors: Item[] = [
  // 문짝 두께 중심 X: 여 1,480 ~ 1,504, 남 5,681 ~ 5,708의 가운데
  slidingDoor('f', (1480 + 1504) / 2, SLIDE.y, 90, SLIDE.length, 24, SLIDE.handle, { name: '장애인용 칸 슬라이딩 도어 (여)', note: '슬라이딩 도어' }),
  slidingDoor('m', (5681 + 5708) / 2, SLIDE.y, 90, SLIDE.length, 27, SLIDE.handle, { name: '장애인용 칸 슬라이딩 도어 (남)', note: '슬라이딩 도어' }),
  ...STALLS.map((s) => stallDoor(`f${s.n}`, FRONT_F, s.hinge, 180, 580, stallDoorText)),
  ...STALLS.map((s) => stallDoor(`m${s.n}`, FRONT_M, s.hinge, 0, 580, stallDoorText)),
  {
    id: 'door-entrance-f', layer: 'door', name: '출입문 1/SSD (여)', material: 'steelDoor', remark: entranceRemark,
    shapes: [{ type: 'leaf', hx: 1369, hy: 6934, width: 1153, angleDeg: 90, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 1153, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
  {
    id: 'door-entrance-m', layer: 'door', name: '출입문 1/SSD (남)', material: 'steelDoor', remark: entranceRemark,
    shapes: [{ type: 'leaf', hx: 5839, hy: 6930, width: 1154, angleDeg: 90, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 1154, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
  {
    id: 'door-mop', layer: 'door', name: '수채기실 문 2/SD', note: '기존 도어 O.P도장', material: 'paintDoor',
    remark: '도면은 문을 서쪽(여 전실)으로 90도 연 상태로 그렸다. 문 크기 표기는 없다. 문짝 폭은 도면 환산값이다. 높이는 가정값이다.',
    shapes: [{ type: 'leaf', hx: 2534, hy: 5948, width: 651, angleDeg: 180, thickness: 40, z0: 0, z1: HEAD }],
    dims: [dim('문짝 폭', 651, 'scaled'), dim('높이', HEAD, 'assumed')],
  },
  {
    id: 'door-hatch', layer: 'door', name: '점검구 5-1/SSD (작은 실)', note: '기존 점검구 도색 (600X900)', material: 'paintDoor',
    remark: '도면은 문을 동쪽(남 전실)으로 약 43도 연 상태로 그렸다. 모델도 같은 각도다. 표기 600은 개구 폭(문틀 바깥, 도면 약 602)으로 보았다. 문짝 폭은 도면의 문짝 선 길이(556)다. 닫으면 남쪽 문틀 안(Y 6,487)에 들어온다. 하단 높이는 도면에 없다. 바닥에서 900까지로 가정했다.',
    shapes: [{ type: 'leaf', hx: 4654, hy: 5931, width: 556, angleDeg: 43, thickness: 30, z0: 0, z1: 900 }],
    dims: [dim('개구 폭', 600, 'drawn'), dim('문짝 폭', 556, 'scaled'), dim('높이', 900, 'drawn'), dim('열린 각도', 43, 'scaled'), dim('하단 높이', 0, 'assumed')],
  },
];

/** 장애인용 칸 양변기 길이. 벽 선(y 956.5)에서 도면 기호 앞 끝(y 1119.7, 남은 약 1120)까지의 환산값이다. 부품 기본값 740과 27 다르다. */
const ACC_WC_LEN = 713;
const accToiletRemark = '평면 위치와 길이(713)는 도면 환산값이다. 높이와 곡면 형상은 가정값이다. 뚜껑을 닫은 상태로 그렸다.';

const fixtures: Item[] = [
  // 장애인용 칸 양변기는 북측 벽에 붙어 남쪽을 본다.
  toilet('f1', ACC_WC.f, N_IN, 90, { name: '양변기 f1 (장애인용 칸)', remark: accToiletRemark }, ACC_WC_LEN),
  toilet('m1', ACC_WC.m, N_IN, 90, { name: '양변기 m1 (장애인용 칸)', remark: accToiletRemark }, ACC_WC_LEN),
  // 칸 2, 3의 양변기는 외벽에 붙는다. 여는 동쪽, 남은 서쪽을 본다.
  ...STALLS.map((s) => toilet(`f${s.n}`, W_IN, s.cy, 0)),
  ...STALLS.map((s) => toilet(`m${s.n}`, E_IN, s.cy, 180)),
  // 소변기는 중앙 벽 동쪽 면에 붙어 동쪽을 본다. 폭 437은 도면 기호의 뒤판 폭, 벽에서 나온 길이 345(장애인용 356)는 도면 환산값이다.
  ...URINAL_YS.map((y, i) => urinal(`m${i + 1}`, C_E, y, 0, 437, i === 0 ? 356 : 345, i === 0 ? { name: '소변기 m1 (장애인용)' } : {})),
  // 세면기는 중앙 벽면에 붙는다. 여는 서쪽, 남은 동쪽을 본다.
  basin('f1', 3017, 4424, '중앙 벽면에서 중심까지', 317, 230),
  basin('f2', 3017, 5126, '중앙 벽면에서 중심까지', 317, 230),
  basin('m1', 3893, 4424, '중앙 벽면에서 중심까지', 330, 230),
  basin('m2', 3893, 5126, '중앙 벽면에서 중심까지', 330, 230),
  faucet('f1', 3017, 4424, 180, 230),
  faucet('f2', 3017, 5126, 180, 230),
  faucet('m1', 3893, 4424, 0, 230),
  faucet('m2', 3893, 5126, 0, 230),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 수채기실 동측 벽에 붙는다. 높이와 안쪽 형상은 가정값이다.',
    shapes: [
      rbox(2966, 6009, 3452, 6573, 0, 260, 30),
      { type: 'plate', x0: 2966, y0: 6009, x1: 3452, y1: 6573, z0: 260, z1: 350, r: 30, holes: [{ x0: 3019, y0: 6062, x1: 3386, y1: 6525, r: 50 }] },
      cyl(3202, 6302, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭', 564, 'scaled'), dim('깊이', 486, 'scaled'), dim('높이', 350, 'assumed')],
  },
  // 주 배수구는 구배 바닥(pan, drop 10)의 낮은 점에 있다.
  floorDrain('fd-main-f', 2214, 2223, -10),
  floorDrain('fd-main-m', 4984, 2221, -10),
  floorDrain('fd-basin-f', 2820, 4825),
  floorDrain('fd-basin-m', 3981, 4825),
];

const A = 'assumed' as const;

/**
 * 장애인용 칸 부속(parts_extra.ts). key는 f 또는 m, wall은 옆 벽면 X, rot은 옆 벽에서 실내 쪽 방향이다.
 * out은 벽 손잡이 축 X(벽 손잡이 봉 축은 Y 293 ~ 857), fold는 접이식 손잡이 축 X(앞 끝 Y 571), u0·u1은 등받이 봉 축 X, uy는 등받이 앞 봉 축 Y다.
 * bellY는 비상벨 Y, babyX는 영유아 거치대 앞 끝 X다(거치대는 Y 1,408 ~ 1,718).
 */
const accessibleStall = (key: 'f' | 'm', wall: number, rot: 0 | 180, out: number, fold: number, u0: number, u1: number, uy: number, bellY: number, babyX: number): Item[] => {
  const room = key === 'f' ? '여' : '남';
  return [
    // 봉 축은 Y 293(봉 선 y 1031 / 1040의 가운데)에서 남쪽으로 Y 857(y 1160 / 1169의 가운데)까지 뻗는다. 틀의 +y는 rot 0에서 남쪽, rot 180에서 북쪽이다.
    wallGrabBar(key, wall, 293, rot, rot === 0 ? 1 : -1, Math.abs(out - wall), 564, {
      name: `장애인용 칸 벽 손잡이 (${room})`,
      dims: [dim('길이 (봉 축 기준)', 564, 'scaled'), dim('벽에서 축까지', Math.abs(out - wall), 'scaled'), dim('높이', 650, A)],
    }),
    foldGrabBar(key, fold, N_IN, 90, 571 - N_IN, { name: `장애인용 칸 접이식 손잡이 (${room})` }),
    backrest(key, (u0 + u1) / 2, N_IN, 90, u1 - u0, uy - N_IN, { name: `등받이 (${room})`, note: '등받이 설치' }),
    emergencyBell(key, wall, bellY, rot, { name: `비상벨 (${room})`, note: '비상벨 설치 (상,하 2개소) (H600~900, H200)' }),
    babySeat(key, wall, (1408 + 1718) / 2, rot, 310, Math.abs(babyX - wall), { name: `영유아 거치대 (${room})`, note: '영유아 거치대 설치 (기계설비공사)' }),
  ];
};

const glassShelfText = { note: '유리선반 설치 (r=300) (기계설비공사)' };
const hookText = { note: '가방걸이 설치', remark: '도면의 문 2개에 가방걸이 기호가 그려져 있다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면에 달았다.' };
const mirror = 'THK.5 방습거울 (기계설비공사)';

// 커텐박스 주기. 뒤 주기 「THK1.6 갈바위 지정도장」은 「"A" 단면상세도」의 것이다.
const curtainNote = '상부 커텐박스 설치 (L=1,300) / THK1.6 갈바위 지정도장';
const curtainRemark = '주기의 뒤 부분(THK1.6 갈바위 지정도장)은 「"A" 단면상세도」의 주기다. 단면은 그 상세도를 따랐다. 천장 끝에서 위로 150 올라간 갈바 판이다. 판과 창 사이는 천장이 없는 홈이다. 판은 창틀 안쪽 면(창대석 바깥 끝, Y −203)에서 표기 340(Y 137)에 두었다. 평면의 점선(Y 94)과 43 다르다. 표기를 따랐다. 판 위 150 구간의 가는 선은 판의 고정 날개 또는 보 옆면의 마감이다. 상세도로 정할 수 없다. 천장 속이라서 그리지 않았다. 마구리 판은 평면 점선의 꺾인 끝을 따른 가정이다.';
const curtainBoxM = curtainBox('m', (CURTAIN.m[0] + CURTAIN.m[1]) / 2, CURTAIN.y, 90, CURTAIN.m[1] - CURTAIN.m[0], CH, CURTAIN.front, N_IN + 3 - CURTAIN.y, {
  name: '커텐박스 (남)', note: curtainNote,
  remark: `길이는 평면의 점선(위에 있는 것) 범위다. 서쪽 끝은 중앙 벽면, 동쪽 끝은 선 위치(X 4,859)다. 형상의 길이는 1,297이고 주기의 표기는 1,300이다. ${curtainRemark}`,
});

const accessories: Item[] = [
  ...accessibleStall('f', W_IN, 0, 203, 894, 295, 800, 173, 501, 247),
  ...accessibleStall('m', E_IN, 180, 6998, 6291, 6389, 6897, 176, 488, 6945),
  // 좌우 봉 축 Y 115 / 718, 앞 끝 X 4,149, 잇는 봉 축 X 3,828
  urinalGrabBar('m', C_E, (115 + 718) / 2, 0, 4149 - C_E, 718 - 115, 3828 - C_E, {
    name: '장애인용 소변기 손잡이 (남)',
    remark: `${GRAB_REMARK} 좌우 봉 2개와 그 위를 잇는 봉 1개가 그려져 있다. 두겁돌 띠 위를 지난다.`,
  }),
  {
    id: 'window-sill-f', layer: 'accessory', name: '창대석 (여)', note: 'THK20 인조대리석 창대석 설치 (W=200)', material: 'marble',
    shapes: [box(1840, -203, 2942, -2, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  {
    id: 'window-sill-m', layer: 'accessory', name: '창대석 (남)', note: 'THK20 인조대리석 창대석 설치 (W=200)', material: 'marble',
    shapes: [box(C_E, -203, 4652, -2, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  // 「"A" 단면상세도」의 단면이다. 틀의 원점은 창틀 안쪽 면(Y −203)이다. 판은 표기 340(Y 137)에 있다. 박스 양 끝의 마구리 판은 북측 벽 마감 면(Y −49)에서 시작한다.
  curtainBox('f', (CURTAIN.f[0] + CURTAIN.f[1]) / 2, CURTAIN.y, 90, CURTAIN.f[1] - CURTAIN.f[0], CH, CURTAIN.front, N_IN + 3 - CURTAIN.y, {
    name: '커텐박스 (여)', note: curtainNote,
    remark: `길이는 평면의 점선(위에 있는 것) 범위다. 서쪽 끝은 선 위치(X 1,738), 길이는 표기 1,300이다. ${curtainRemark}`,
  }),
  {
    ...curtainBoxM,
    // 형상의 길이는 평면 점선(중앙 벽면에서 X 4,860까지 1,297)이다. 길이 표기 1,300은 주기의 값이다.
    dims: curtainBoxM.dims.map((d) => (d.label === '길이' ? dim('길이', 1300, 'drawn') : d)),
  },
  {
    id: 'shelf-f', layer: 'accessory', name: '인조대리석 선반 (여)', note: 'THK20 인조대리석 선반 설치 (하부 고정 철물)', material: 'marble',
    remark: '평면 범위는 도면 환산값이다. 설치 높이는 가정값이다.',
    shapes: [box(3124, 2370, C_W, 3867, 830, 850)],
    dims: [dim('길이', 1497, 'scaled'), dim('깊이', 210, 'scaled'), dim('두께', 20, 'drawn'), dim('설치 높이', 850, A)],
  },
  {
    id: 'mirror-shelf-f', layer: 'accessory', name: '선반 위 방습거울 (여)', note: mirror, material: 'mirror', facing: [-1, 0],
    remark: '도면에 거울 크기 표기가 없다. 중앙 벽면의 굵은 선 2토막을 환산한 값이다. 형광펜에 가려서 빨강 채널로 읽었다. 도면의 거울 선(x 2300 ~ 2303)은 벽 선(x 2306)에서 약 15 떨어져 있다. 모델은 벽 면에 붙였다. 높이는 가정값이다.',
    shapes: [box(C_W - 5, 2512, C_W, 3028, 950, 1850), box(C_W - 5, 3207, C_W, 3727, 950, 1850)],
    dims: [dim('수량', 2, 'scaled'), dim('1장 길이', '약 516 ~ 520', 'scaled'), dim('두께', 5, 'drawn'), dim('높이', 900, A)],
  },
  {
    id: 'mirror-full-f', layer: 'accessory', name: '전신 방습거울 (여)', note: `${mirror} (600X1,500)`, material: 'mirror', facing: [0, 1],
    remark: '조적벽 남쪽 면에 있다. 폭은 표기 600을 따랐다(도면 선 603). 도면의 거울 선(y 1924)은 벽 선(y 1916.4)에서 약 33 떨어져 있다. 모델은 벽 면에 붙였다. 하단 높이는 가정값이다.',
    shapes: [box(454, BRICK.y1, 1054, BRICK.y1 + 5, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, A)],
  },
  {
    id: 'mirror-full-m', layer: 'accessory', name: '전신 방습거울 (남)', note: `${mirror} (600X1,500)`, material: 'mirror', facing: [0, 1],
    remark: '조적벽 남쪽 면에 있다. 폭은 표기 600을 따랐다(도면 선 603). 도면의 거울 선(y 1924)은 벽 선(y 1916.4)에서 약 33 떨어져 있다. 모델은 벽 면에 붙였다. 하단 높이는 가정값이다.',
    shapes: [box(6064, BRICK.y1, 6664, BRICK.y1 + 5, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, A)],
  },
  {
    id: 'mirror-basin-f', layer: 'accessory', name: '세면대 방습거울 (여)', note: `${mirror} (1,500X1,000)`, material: 'mirror', facing: [-1, 0],
    remark: '중앙 벽면에 세면대 칸막이벽에서 중간 벽까지(1,500) 걸린다. 도면의 거울 선(x 약 2298)은 벽 선(x 2306)에서 약 30 떨어져 있다. 모델은 벽 면에 붙였다. 하단 높이는 가정값이다.',
    shapes: [box(C_W - 5, CAP.y1, C_W, MID.y0, 1000, 2000)],
    dims: [dim('폭', 1500, 'drawn'), dim('높이', 1000, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 1000, A)],
  },
  {
    id: 'mirror-basin-m', layer: 'accessory', name: '세면대 방습거울 (남)', note: `${mirror} (1,500X1,000)`, material: 'mirror', facing: [1, 0],
    remark: '중앙 벽면에 세면대 칸막이벽에서 중간 벽까지(1,500) 걸린다. 도면의 거울 선(x 약 2365)은 벽 선(x 2358.5)에서 약 30 떨어져 있다. 모델은 벽 면에 붙였다. 하단 높이는 가정값이다.',
    shapes: [box(C_E, CAP.y1, C_E + 5, MID.y0, 1000, 2000)],
    dims: [dim('폭', 1500, 'drawn'), dim('높이', 1000, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 1000, A)],
  },
  {
    id: 'counter-f', layer: 'accessory', name: '세면대 상판 (여)', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(x 2167, X 2,727의 가는 실선)을 환산한 값이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      { type: 'plate', x0: 2727, y0: CAP.y1, x1: C_W, y1: MID.y0, z0: COUNTER - 20, z1: COUNTER, holes: [{ cx: 3017, cy: 4424, r: 215 }, { cx: 3017, cy: 5126, r: 215 }] },
      box(C_W - 15, CAP.y1, C_W, MID.y0, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 1500, 'drawn'), dim('깊이', 607, 'scaled'), dim('윗면 높이', COUNTER, A), dim('두께', 20, A)],
  },
  {
    id: 'counter-m', layer: 'accessory', name: '세면대 상판 (남)', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(x 2497.5, X 4,171의 가는 실선)을 환산한 값이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      { type: 'plate', x0: C_E, y0: CAP.y1, x1: 4171, y1: MID.y0, z0: COUNTER - 20, z1: COUNTER, holes: [{ cx: 3893, cy: 4424, r: 215 }, { cx: 3893, cy: 5126, r: 215 }] },
      box(C_E, CAP.y1, C_E + 15, MID.y0, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 1500, 'drawn'), dim('깊이', 608, 'scaled'), dim('윗면 높이', COUNTER, A), dim('두께', 20, A)],
  },
  {
    id: 'partition-under-basin-f', layer: 'partition', name: '세면대 하부 칸막이 (여)', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에서 상판 앞 선 남쪽 끝의 점선 1개(길이 약 507)만 판독된다.',
    shapes: [box(2730, 5024, 2742, 5524, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('두께', PT, 'drawn')],
  },
  {
    id: 'partition-under-basin-m', layer: 'partition', name: '세면대 하부 칸막이 (남)', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: '도면에서 상판 앞 선 남쪽 끝의 점선 1개(길이 약 498)만 판독된다.',
    shapes: [box(4156, 5024, 4168, 5524, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('두께', PT, 'drawn')],
  },
  // 유리선반. 장애인용 칸은 전면 칸막이 쪽 북쪽 모서리, 칸 2, 3은 외벽 쪽 남쪽 모서리에 있다.
  glassShelf('f1', FRONT_F - PT / 2, N_IN, 90, 300, glassShelfText),
  glassShelf('f2', W_IN, PART_B - PT / 2, 270, 300, glassShelfText),
  glassShelf('f3', W_IN, BRICK.y0, 270, 300, glassShelfText),
  glassShelf('m1', FRONT_M + PT / 2, N_IN, 0, 300, glassShelfText),
  glassShelf('m2', E_IN, PART_B - PT / 2, 180, 300, glassShelfText),
  glassShelf('m3', E_IN, BRICK.y0, 180, 300, glassShelfText),
  // 가방걸이. 경첩에서의 거리가 여(약 400)와 남(약 280)이 다르게 그려져 있다.
  ...STALLS.map((s) => stallHook(`f${s.n}`, FRONT_F, s.hinge, 180, -1, 400, hookText)),
  ...STALLS.map((s) => stallHook(`m${s.n}`, FRONT_M, s.hinge, 0, 1, 280, hookText)),
  {
    id: 'threshold-f', layer: 'accessory', name: '화강석 재료분리대 (여)', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치다. 경첩 쪽 끝은 문짝 이중선의 바깥 선(x 1852.5)이다. 폭은 표기 150을 따랐다(선 143). 두께 30은 석재 두께다. 노출 높이는 10으로 가정했다.',
    shapes: [box(1351, 6853, 2499, 7003, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 1148, 'scaled'), dim('노출 높이', 10, A)],
  },
  {
    id: 'threshold-m', layer: 'accessory', name: '화강석 재료분리대 (남)', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치다. 경첩 쪽 끝은 문짝 이중선의 바깥 선(x 2882.5)이다. 폭은 표기 150을 따랐다(선 143). 두께 30은 석재 두께다. 노출 높이는 10으로 가정했다.',
    shapes: [box(4706, 6853, 5854, 7003, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', 1148, 'scaled'), dim('노출 높이', 10, A)],
  },
  {
    id: 'tactile-blocks-f', layer: 'accessory', name: '점형블럭 2EA (여)', note: '점형블럭 2EA (매립형)', material: 'tactile',
    shapes: [box(2553, 7303, 2851, 7596, 0, 5), box(2855, 7303, 3152, 7596, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('벽에서의 거리', 300, 'drawn'), dim('1장 크기', '약 300 x 297', 'scaled')],
  },
  {
    id: 'tactile-blocks-m', layer: 'accessory', name: '점형블럭 2EA (남)', note: '점형블럭 2EA (매립형)', material: 'tactile',
    shapes: [box(4059, 7303, 4355, 7596, 0, 5), box(4359, 7303, 4656, 7596, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('벽에서의 거리', 300, 'drawn'), dim('1장 크기', '약 298 x 297', 'scaled')],
  },
  {
    id: 'braille-sign-f', layer: 'accessory', name: '점자표지판 (여)', note: '벽면점자표지판설치', material: 'metal',
    remark: '수채기실 남측 벽 바깥 면의 굵은 선(폭 약 100)이다. 설치 높이와 세로 크기는 가정값이다.',
    shapes: [box(2800, 7003, 2901, 7025, 1400, 1550)],
    dims: [dim('폭', 101, 'scaled'), dim('설치 높이', 1400, A)],
  },
  {
    id: 'braille-sign-m', layer: 'accessory', name: '점자표지판 (남)', note: '벽면점자표지판설치', material: 'metal',
    remark: '작은 실 남측 벽 바깥 면의 굵은 선(폭 약 96)이다. 설치 높이와 세로 크기는 가정값이다.',
    shapes: [box(4309, 7003, 4405, 7025, 1400, 1550)],
    dims: [dim('폭', 96, 'scaled'), dim('설치 높이', 1400, A)],
  },
];


// 코너 비드. 도면의 「코너 비드 설치」 지시선 원 14개가 가리키는 벽 모서리에 붙였다.
const windowBeadText = { remark: '위치는 도면의 지시선이 가리키는 벽 모서리(창의 옆 모서리)다. 창대 아래는 창 구간의 벽이 이어져 모서리가 없다. 창 위에는 창 위 벽이 없다. 모서리는 커텐박스 홈 안으로 홈 윗면(2,650)까지 이어진다. 그래서 창대 높이(1,200, 가정)에서 홈 윗면(2,650)까지 그렸다. 폭과 두께는 도면에 없다. 가정값이다.' };
const doorBeadText = { remark: '위치는 도면의 지시선이 가리키는 벽 모서리다. 출입문 개구 옆이라서 높이를 개구 상단(2,100, 가정)까지로 두었다. 폭과 두께는 가정값이다.' };
const cornerBeads: Item[] = [
  // 창 옆 3곳(1, 2, 4)은 창대에서 홈 윗면(2,650)까지 그린다. 창대 아래는 창 구간의 벽이 Y −2까지 나와서 모서리가 없다. 모서리는 커텐박스 홈 안으로 이어진다.
  cornerBead(1, '여 창 서쪽 모서리', cornerBeadWings(1840, N_IN, 1, 1, WIN_TOP, SILL), windowBeadText),
  cornerBead(2, '여 창 동쪽 모서리', cornerBeadWings(2942, N_IN, -1, 1, WIN_TOP, SILL), windowBeadText),
  cornerBead(3, '창 사이 기둥 남서 모서리', cornerBeadWings(PIER.x0, PIER.y1, -1, 1, CH)),
  cornerBead(4, '남 창 동쪽 모서리', cornerBeadWings(4652, N_IN, -1, 1, WIN_TOP, SILL), windowBeadText),
  cornerBead(5, '여 조적벽 북동 모서리', cornerBeadWings(1495, BRICK.y0, 1, -1, CH)),
  cornerBead(6, '여 조적벽 남동 모서리', cornerBeadWings(1495, BRICK.y1, 1, 1, CH)),
  cornerBead(7, '남 조적벽 북서 모서리', cornerBeadWings(5697, BRICK.y0, -1, -1, CH)),
  cornerBead(8, '남 조적벽 남서 모서리', cornerBeadWings(5697, BRICK.y1, -1, 1, CH)),
  cornerBead(9, '여 중간 벽 북서 모서리', cornerBeadWings(1395, MID.y0, -1, -1, CH)),
  cornerBead(10, '여 중간 벽 남서 모서리', cornerBeadWings(1395, MID.y1, -1, 1, CH)),
  cornerBead(11, '남 중간 벽 북동 모서리', cornerBeadWings(5701, MID.y0, 1, -1, CH)),
  cornerBead(12, '남 중간 벽 남동 모서리', cornerBeadWings(5701, MID.y1, 1, 1, CH)),
  // 출입문 옆 2곳(13, 14)은 문 상단까지만 모서리가 있다. 그 위는 벽이다.
  cornerBead(13, '여 전실 남측 벽 동쪽 끝', cornerBeadWings(1301, 6799, 1, -1, HEAD), doorBeadText),
  cornerBead(14, '남 전실 남측 벽 서쪽 끝', cornerBeadWings(5907, 6799, -1, -1, HEAD), doorBeadText),
];

const lightRemark = '도면에 손으로 적은 「조명」과 형광펜 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-shelf-f', layer: 'light', name: '조명 표시 (여 선반·거울 구간)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1.6 },
    shapes: [box(3080, 2350, 3300, 3830, CH - 40, CH)],
    dims: [dim('표시 구간 길이', 1480, 'scaled')],
  },
  {
    id: 'light-mop', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 2826, cy: 6180, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
  {
    id: 'light-small', layer: 'light', name: '조명 표시 (작은 실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 4107, cy: 6215, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '표시 중심', 'scaled')],
  },
];

const floorNote = '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)';
const panRemark = '주 배수구(Ø75 F.D)로 모이는 가는 대각선 4개에 화살표가 있다. 바닥 구배 표시로 보고 배수구 쪽으로 기울게 그렸다(작성자 선택). 구배 깊이는 도면에 없다. 가정이다.';
const gridF = '줄눈 위치는 여 실의 타일 나누기 선 교점(x 1980, y 1410 → X 1,908, Y 1,930)에서 600 간격이다(모델의 tileOrigin).';
const gridM = '줄눈 위치는 남 실의 타일 나누기 선 교점(x 2614.5, y 1410 → X 4,682, Y 1,930)에서 600 간격이다(품목의 tileOrigin). 남 실의 세로선은 여 실과 시작점이 다르다.';
/** 남 실 바닥 600 격자의 교점 */
const TILE_M: [number, number] = [4682, 1930];
const vestNote = '기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공';
const vestRemark = '도면의 「+」 해치 범위다. 세면 구역 쪽 통로의 해치는 Y 5,498에서 시작한다. 출입문 개구에서는 재료분리대 북쪽 끝(y 2537)까지 이어진다. 색과 무늬는 도면에 없다. 가정이다.';
const wallNote = '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착';
const wallRemark = '벽의 안쪽 면에 얇은 면(3mm)을 붙여 그렸다. 도면의 마감선은 벽 선에서 약 22mm 안쪽이다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다.';

// 마감. 도면 좌상단 「지상1층 연구동 화장실 마감 변경부분」 표와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
const finishes: Item[] = [
  {
    id: 'floor-f', layer: 'finish', name: '바닥 마감 (화장실 여)', material: 'floorTile', note: floorNote,
    remark: `${panRemark} ${gridF}`,
    shapes: [{ type: 'pan', x0: W_IN, y0: N_IN, x1: C_W, y1: BRICK.y0, z: 0, drop: 10, cx: 2214, cy: 2223 }],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이 (배수구)', 10, A)],
  },
  {
    id: 'floor-m', layer: 'finish', name: '바닥 마감 (화장실 남)', material: 'floorTile', note: floorNote, tileOrigin: TILE_M,
    remark: `${panRemark} 평면의 주기 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이 소변기 구역(y 약 1700)에 있다. ${gridM}`,
    shapes: [{ type: 'pan', x0: C_E, y0: N_IN, x1: E_IN, y1: BRICK.y0, z: 0, drop: 10, cx: 4984, cy: 2221 }],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이 (배수구)', 10, A)],
  },
  {
    id: 'floor-basin-f', layer: 'finish', name: '바닥 마감 (세면 구역 여)', material: 'floorTile', note: floorNote,
    remark: `평면의 주기 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이 세면 구역 서쪽 통로(y 약 2110)에 있다. 평탄하게 그렸다. ${gridF}`,
    shapes: [box(W_IN, BRICK.y0, 1395, 5498, -10, 0), box(1395, BRICK.y0, C_W, MID.y0, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'floor-basin-m', layer: 'finish', name: '바닥 마감 (세면 구역 남)', material: 'floorTile', note: floorNote, tileOrigin: TILE_M,
    remark: `남 세면 구역에는 평면의 바닥 주기가 없다. 마감 표의 바닥과 같다고 보았다. 평탄하게 그렸다. ${gridM}`,
    shapes: [box(5701, BRICK.y0, E_IN, 5498, -10, 0), box(C_E, BRICK.y0, 5701, MID.y0, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'floor-vestibule-f', layer: 'finish', name: '바닥 마감 (전실 여)', material: 'floorTile', note: vestNote, remark: `${vestRemark} ${gridF}`,
    shapes: [box(W_IN, 5498, 1395, 6799, -10, 0), box(1395, MID.y1, 2549, 6799, -10, 0), box(1301, 6799, 1351, 7003, -10, 0), box(1351, 6799, 2499, 6853, -10, 0), box(2499, 6799, 2549, 7003, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn')],
  },
  {
    id: 'floor-vestibule-m', layer: 'finish', name: '바닥 마감 (전실 남)', material: 'floorTile', note: vestNote, tileOrigin: TILE_M, remark: `${vestRemark} ${gridM}`,
    shapes: [box(5701, 5498, E_IN, 6799, -10, 0), box(4652, MID.y1, 5701, 6799, -10, 0), box(5854, 6799, 5907, 7003, -10, 0), box(4706, 6799, 5854, 6853, -10, 0), box(4652, 6799, 4706, 7003, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn')],
  },
  {
    id: 'floor-mop', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'smallTile', note: '기존 바닥 / 고와스 / THK.6 자기질 타일(200X200) 부착',
    remark: '줄눈 위치는 도면의 200 격자(X 2,853, Y 6,097에서 200 간격)에 맞췄다. 색은 도면에 없다. 가정이다. 문 개구(X 2,549 ~ 2,649)에는 문턱과 재료분리대가 그려져 있지 않다. 문은 개구의 전실 쪽 면에서 닫히므로 개구 바닥을 수채기실 바닥으로 이었다(작성자 판단).',
    shapes: [box(2649, MID.y1, 3452, 6897, -6, 0), box(2549, 5896, 2649, 6600, -6, 0)],
    dims: [dim('타일 크기', '200 x 200', 'drawn'), dim('타일 두께', 6, 'drawn'), dim('줄눈 시작점', 'X 2,853, Y 6,097', 'scaled')],
  },
  {
    id: 'floor-small', layer: 'finish', name: '바닥 마감 (작은 실)', material: 'smallTile',
    remark: '실명과 마감 주기가 없다. 수채기실과 같은 타일로 가정했다. 점검구 개구(X 4,556 ~ 4,652)에는 문턱이 그려져 있지 않다. 하단 높이 0(가정)에 맞춰 개구 바닥을 이 실의 바닥으로 이었다. 점검구는 전실 쪽 면에서 닫힌다.',
    shapes: [box(3552, MID.y1, 4556, 6897, -6, 0), box(4556, 5895, 4652, 6495, -6, 0)],
    dims: [dim('타일 크기', '200 x 200', A)],
  },
  {
    id: 'wall-finish-f', layer: 'finish', name: '벽 마감 (화장실 여)', material: 'wall', note: wallNote, remark: wallRemark,
    shapes: [
      // 서측 벽, 북측 벽(대변기 칸 구간), 창 사이 기둥, 중앙 벽
      box(W_IN, N_IN, W_IN + 3, 6799, 0, CH), box(W_IN, N_IN, 1840, N_IN + 3, 0, CH),
      // 창 구간 (창대 아래), 창 옆 면(창틀 안쪽 면에서 벽 면까지, 창대에서 창 상단까지), 창 동쪽 벽
      box(1840, -2, 2942, 1, 0, SILL - 20), box(1840, CURTAIN.y, 1843, N_IN, SILL, WIN_TOP), box(2939, CURTAIN.y, 2942, N_IN, SILL, WIN_TOP),
      box(2942, N_IN, PIER.x0, N_IN + 3, 0, CH),
      // 커텐박스 홈의 뒤 (창 폭 밖, 천장고에서 홈 윗면까지)
      box(CURTAIN.f[0], N_IN, 1840, N_IN + 3, CH, WIN_TOP), box(2942, N_IN, CURTAIN.f[1], N_IN + 3, CH, WIN_TOP),
      box(PIER.x0 - 3, N_IN, PIER.x0, PIER.y1, 0, CH), box(PIER.x0, PIER.y1, C_W, PIER.y1 + 3, 0, CH), box(C_W - 3, PIER.y1 + 3, C_W, MID.y0, 0, CH),
      // 조적벽 세 면
      box(W_IN, BRICK.y0 - 3, 1495, BRICK.y0, 0, CH), box(W_IN, BRICK.y1, 1495, BRICK.y1 + 3, 0, CH), box(1495, BRICK.y0, 1498, BRICK.y1, 0, CH),
      // 중간 벽 세 면, 전실 남측 벽, 수채기실 서측 벽의 바깥 면
      box(1395, MID.y0 - 3, C_W, MID.y0, 0, CH), box(1395, MID.y1, 2549, MID.y1 + 3, 0, CH), box(1392, MID.y0, 1395, MID.y1, 0, CH),
      box(W_IN, 6796, 1301, 6799, 0, CH), box(2546, MID.y1, 2549, 5896, 0, CH), box(2546, 6600, 2549, 6799, 0, CH),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'wall-finish-m', layer: 'finish', name: '벽 마감 (화장실 남)', material: 'wall', note: wallNote, remark: wallRemark,
    shapes: [
      // 동측 벽, 북측 벽(대변기 칸 구간), 중앙 벽(소변기 뒤 띠 위)
      box(E_IN - 3, N_IN, E_IN, 6799, 0, CH), box(4652, N_IN, E_IN, N_IN + 3, 0, CH), box(C_E, -2, C_E + 3, MID.y0, 0, CH),
      // 창 구간 (창대 아래), 창 옆 면(창틀 안쪽 면에서 벽 면까지, 창대에서 창 상단까지), 커텐박스 홈의 뒤 (창 폭 밖)
      box(C_E + 162, -2, 4652, 1, 0, SILL - 20), box(C_E, CURTAIN.y, C_E + 3, N_IN + 3, SILL, WIN_TOP), box(4649, CURTAIN.y, 4652, N_IN, SILL, WIN_TOP),
      box(4652, N_IN, CURTAIN.m[1], N_IN + 3, CH, WIN_TOP),
      // 조적벽 세 면
      box(5697, BRICK.y0 - 3, E_IN, BRICK.y0, 0, CH), box(5697, BRICK.y1, E_IN, BRICK.y1 + 3, 0, CH), box(5694, BRICK.y0, 5697, BRICK.y1, 0, CH),
      // 중간 벽 세 면, 전실 남측 벽, 작은 실 동측 벽의 바깥 면
      box(C_E, MID.y0 - 3, 5701, MID.y0, 0, CH), box(4652, MID.y1, 5701, MID.y1 + 3, 0, CH), box(5701, MID.y0, 5704, MID.y1, 0, CH),
      box(5907, 6796, E_IN, 6799, 0, CH), box(4652, MID.y1, 4655, 5895, 0, CH), box(4652, 6495, 4655, 6799, 0, CH),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'wall-finish-mop', layer: 'finish', name: '벽 마감 (수채기실)', material: 'wainscotTile',
    note: '벽체 : 도막방수(고와스, H=500) 위 THK.6 도기질타일 (H=1,200)',
    remark: '타일 크기는 도면에 없다. 200 x 200으로 가정했다. 높이 1,200 위는 도장으로 가정했다.',
    shapes: [
      box(2649, MID.y1, 3452, MID.y1 + 6, 0, 1200), box(2649, 6891, 3452, 6897, 0, 1200),
      box(2649, MID.y1, 2655, 5896, 0, 1200), box(2649, 6600, 2655, 6897, 0, 1200), box(3446, MID.y1, 3452, 6897, 0, 1200),
      box(2649, MID.y1, 3452, MID.y1 + 3, 1200, CH, 'paint'), box(2649, 6894, 3452, 6897, 1200, CH, 'paint'),
      box(2649, MID.y1, 2652, 5896, 1200, CH, 'paint'), box(2649, 6600, 2652, 6897, 1200, CH, 'paint'), box(3449, MID.y1, 3452, 6897, 1200, CH, 'paint'),
    ],
    dims: [dim('타일 높이', 1200, 'drawn'), dim('타일 두께', 6, 'drawn'), dim('타일 크기', '200 x 200', A)],
  },
  {
    id: 'ceiling', layer: 'finish', name: '천장 마감', material: 'ceiling',
    note: '천장 : 경량철골 천장틀위 금속재 흡음천장 (AL. 600각)',
    remark: '실내에서 볼 때만 그린다. 위에서 내려다볼 때는 그리지 않는다. 「"A" 단면상세도」의 주기 「금속 흡음천장」도 같은 천장이다. 커텐박스 홈(커텐박스 길이 × 북측 벽면에서 갈바 판 Y 137까지)에는 천장이 없다. 수채기실과 작은 실의 천장 마감은 도면에 없다. 화장실과 같은 것으로 가정했다. 패널 나누기 위치도 가정이다.',
    shapes: [
      // 갈바 판 남쪽 전체, 판 북쪽은 커텐박스 홈 2곳을 뺀 나머지
      box(-101, CURTAIN_FACE, 7303, 7003, CH, CH + 30),
      box(-101, -354, CURTAIN.f[0], CURTAIN_FACE, CH, CH + 30), box(CURTAIN.f[1], -354, CURTAIN.m[0], CURTAIN_FACE, CH, CH + 30), box(CURTAIN.m[1], -354, 7303, CURTAIN_FACE, CH, CH + 30),
    ],
    dims: [dim('천장고', CH, 'drawn'), dim('패널 크기', '600 x 600', 'drawn')],
  },
  // 커텐박스 홈의 윗면(창 위 면). 「"A" 단면상세도」의 주기다. 인자는 커텐박스와 같다.
  curtainPocketTop('f', (CURTAIN.f[0] + CURTAIN.f[1]) / 2, CURTAIN.y, 90, CURTAIN.f[1] - CURTAIN.f[0], CH, CURTAIN.front, { name: '커텐박스 홈 윗면 (여)' }),
  curtainPocketTop('m', (CURTAIN.m[0] + CURTAIN.m[1]) / 2, CURTAIN.y, 90, CURTAIN.m[1] - CURTAIN.m[0], CH, CURTAIN.front, { name: '커텐박스 홈 윗면 (남)' }),
];

export const research1fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1543.5, 968.5],
  mmPerPx: 4.372,
};

export const research1fModel: SheetModel = {
  ceilingHeight: CH,
  // 모델 범위: 둘러싼 벽의 바깥 면(서측 −101, 북측 −354, 북동 모서리 기둥 7,459, 남측 7,003)이다. 연구동 3층·5층과 같은 기준이다.
  bounds: { x0: -101, y0: -354, x1: 7459, y1: 7003 },
  // 여 세면 구역에서 조적벽과 세면대 칸막이벽 사이 통로로 북쪽(대변기 칸)을 본다.
  eye: { from: [2050, 5300, 1600], to: [1700, 800, 1100] },
  // 남동쪽에서 본다. 남 실의 양변기(서쪽을 본다)와 여 실의 세면기(서쪽을 본다)가 보인다.
  isoDir: [1, 1],
  // 창은 북측 벽에 있다. 자연광은 북쪽에서 남쪽으로 들어온다.
  daylightDir: [0.2, 1],
  // 줄눈 시작점. 바닥 600 격자는 여 실의 교점이다. 남 실의 바닥 품목은 남 실 교점을 품목의 tileOrigin으로 따로 준다. 200 격자는 수채기실의 교점이다.
  tileOrigin: { floorTile: [1908, 1930], smallTile: [2853, 6097] },
  items: [...walls, ...lowWalls, ...partitions, ...doors, ...fixtures, ...accessories, ...cornerBeads, ...lights, ...finishes],
  // 치수선 위치는 도면의 치수선 위치와 같다.
  dimLines: [
    // 위
    { from: [0, -2514], to: [7200, -2514], label: '7,200' },
    { from: [0, -2313], to: [3450, -2313], label: '3,450' },
    { from: [3450, -2313], to: [7200, -2313], label: '3,750' },
    // 아래
    { from: [0, 8976], to: [2600, 8976], label: '2,600' },
    { from: [2600, 8976], to: [3450, 8976], label: '850' },
    { from: [3450, 8976], to: [4600, 8976], label: '1,150' },
    { from: [4600, 8976], to: [7200, 8976], label: '2,600' },
    { from: [0, 9175], to: [3450, 9175], label: '3,450' },
    { from: [3450, 9175], to: [7200, 9175], label: '3,750' },
    { from: [0, 9376], to: [7200, 9376], label: '7,200' },
    // 왼쪽
    { from: [-3174, 0], to: [-3174, 6900], label: '6,900' },
    { from: [-2977, 0], to: [-2977, 4095], label: '4,095' },
    { from: [-2977, 4095], to: [-2977, 6900], label: '2,805' },
    { from: [-2770, 4095], to: [-2770, 5625], label: '1,530' },
    { from: [-2770, 5625], to: [-2770, 6900], label: '1,275' },
    // 오른쪽
    { from: [10377, 0], to: [10377, 6900], label: '6,900' },
    { from: [10182, 0], to: [10182, 4095], label: '4,095' },
    { from: [10182, 4095], to: [10182, 6900], label: '2,805' },
    { from: [9981, 4095], to: [9981, 5625], label: '1,530' },
    { from: [9981, 5625], to: [9981, 6900], label: '1,275' },
    // 여 대변기 칸
    { from: [1707, N_FIN], to: [1707, PART_A], label: '2,006' },
    { from: [1707, PART_A], to: [1707, PART_B], label: '1,023' },
    { from: [1707, PART_B], to: [1707, STALL_S], label: '1,017' },
    { from: [W_FIN, 2147], to: [W_FIN + 1403, 2147], label: '1,403' },
    { from: [W_FIN, 3911], to: [W_FIN + 1415, 3911], label: '1,415' },
    // 남 대변기 칸
    { from: [5559, N_FIN], to: [5559, PART_A], label: '2,006' },
    { from: [5559, PART_A], to: [5559, PART_B], label: '1,023' },
    { from: [5559, PART_B], to: [5559, STALL_S], label: '1,017' },
    { from: [E_FIN - 1403, 2147], to: [E_FIN, 2147], label: '1,403' },
    { from: [E_FIN - 1415, 3911], to: [E_FIN, 3911], label: '1,415' },
    // 남 소변기
    { from: [4094, CAP.y0 - 3000], to: [4094, CAP.y0 - 2000], label: '1,000' },
    { from: [4094, CAP.y0 - 2000], to: [4094, CAP.y0 - 1000], label: '1,000' },
    { from: [4094, CAP.y0 - 1000], to: [4094, CAP.y0], label: '1,000' },
    // 세면대
    { from: [C_W - 750, 4191], to: [C_W, 4191], label: '750' },
    { from: [C_E, 4186], to: [C_E + 750, 4186], label: '750' },
    { from: [2293, CAP.y1], to: [2293, MID.y0], label: '1,500' },
    { from: [4619, CAP.y1], to: [4619, MID.y0], label: '1,500' },
    // 점형블럭
    { from: [3952, 7003], to: [3952, 7303], label: '300' },
  ],
  roomLabels: [
    { text: '화장실(여)', at: [2193, 1812] },
    { text: '화장실(남)', at: [5012, 1812] },
  ],
};
