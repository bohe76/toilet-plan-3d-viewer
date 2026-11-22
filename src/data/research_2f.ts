// 2층 연구동 화장실 확대평면도 (변경후) — PDF 5페이지
// 좌표 출처: scripts/measure_plan.py 로 검출한 선분(300dpi 기울기 보정 이미지)과 work/measure/p5/tools/ 의 측정값을 mm로 환산했다.
// 환산식: X = (px - 1548) * 4.371, Y = (py - 978.1) * 4.371.
// 축척: 세로는 왼쪽·오른쪽 치수선 6,900(1,579px / 1,578.8px)으로 4.370, 가로는 가운데 높이의 벽 중심선 사이 7,200(1,646.7px)으로 4.372다. 차이가 0.1% 안쪽이라서 4.371 하나를 쓴다.
// 원점 X=0은 서측 벽 중심선(가운데 높이 y 1767에서 x 1548)이다. Y=0은 통심 Ⓖ(가운데 폭 x 2370에서 y 978.1)다. 창대석 안쪽 끝과 같다.
// 스캔이 사다리꼴로 틀어져 있다. 서측 벽 중심선이 위아래로 6px, 위·아래 치수선의 서쪽 끝이 10px 다르다. 가로선은 서쪽에서 동쪽으로 약 2.5px 올라간다.
// 그래서 중앙 벽 중심선은 가운데 높이에서 X 3,387이다(표기 3,400). 중앙 벽은 표기 3,400에 두었다. 중앙 벽면에 붙는 기구는 도면에서 잰 벽면과의 거리로 모델 벽면에서 띄웠다.
// 칸 치수(1,008 / 1,014 / 1,014 / 1,008)는 마감선에서 칸막이 중심까지, 칸막이 중심 사이다. 칸 깊이 1,400(여)과 1,450(남)은 벽 마감선에서 전면 칸막이의 먼 면까지로 읽었다.
// 도면의 선 위치(축척 환산)와 표기 치수가 다르면 표기 치수를 따른다.
// 측정 근거와 판독 메모는 docs/drawings/research_2f_measurements.md 에 있다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 research_2f_added.ts 에 있다.
// 여·남 두 실을 한 모델에 넣었다. 실별 품목의 id와 부품 key에 f(여), m(남)을 붙였다.
import { COUNTER, GAP, HEAD, PT, SILL, basin, cornerBead, faucet, floorDrain, glassShelf, stallDoor, stallHook, toilet, urinal } from './parts';
import { cornerBeadWings, curtainBox, curtainPocketTop, lowWall, urinalChase, urinalScreens } from './parts_extra';
import { box, cyl, dim, rbox } from './shape_helpers';
import type { Calibration, Item, SheetModel } from './types';

export const CH = 2450; // 천장고. 도면 표기 CH 2,450 (여·남 화장실, 여 전실)

// 벽 면 (축척 환산값). 마감선은 벽 선 안쪽의 가는 선이다.
export const W_IN = 101; // 서측 벽 안쪽 면 (x 1570.7)
const W_FIN = 120; // 서측 벽 마감선 (x 1575.5)
export const E_IN = 7097; // 동측 벽 안쪽 면 (x 3171.4)
const E_OUT = 7295; // 동측 벽 바깥 면 (x 3216.6)
const E_OUT_S = 7273; // 동측 벽 바깥 면, 꺾인 남쪽 구간 (x 3212)
const E_STEP_Y = 5376; // 동측 벽 바깥 면이 꺾이는 곳 (y 2208)
const E_FIN = 7077; // 동측 벽 마감선 (x 3167)
const N_OUT = -351; // 북측 벽 바깥 면 (y 898)
export const N_IN = -50; // 북측 벽 안쪽 면 (대변기 칸 구간, 여 y 967.5 / 남 y 965.7의 가운데)
const N_FIN = -28; // 북측 벽 마감선 (치수선 눈금 여 y 972.2 / 남 y 971.4의 가운데)
export const C_W = 3297; // 중앙 벽 서쪽 면 (중심 3,400, 두께 206)
export const C_E = 3503; // 중앙 벽 동쪽 면

// 창 (여: 서쪽 문설주 x 1888 ~ 동쪽 문설주 x 2231, 남: 중앙 벽면 ~ 동쪽 문설주 x 2691)
const WIN_F = { x0: 1486, x1: 2985 };
const WIN_M = { x0: C_E, x1: 4996 };
// 창 사이 기둥 (여 실 쪽): 서쪽 면 x 2253, 남쪽 면 y 1093
const PIER = { x0: 3082, y1: 502 };

// 칸막이 위치 (도면 표기: 마감선에서 칸막이 중심까지 1,008, 칸막이 중심 사이 1,014, 1,014, 마지막 칸막이 중심에서 조적벽 마감선까지 1,008)
const PART_A = N_FIN + 1008; // 980
const PART_B = PART_A + 1014; // 1,994
const PART_C = PART_B + 1014; // 3,008
const BRICK_FIN = PART_C + 1008; // 4,016. 조적벽 북쪽 마감선
// 0.5B 조적벽 (도면 표기: 북측 기준선에서 벽 중심까지 4,095. 두께는 선 간격 22.5px)
export const BRICK = { y0: 4046, y1: 4144 };
const BRICK_F_X1 = 1482; // 여 조적벽 동쪽 끝 (x 1887)
const BRICK_M_X0 = 5660; // 남 조적벽 서쪽 끝 (x 2843)
// 대변기 칸 전면 칸막이 중심 (도면 표기: 마감선에서 먼 면까지 여 1,400, 남 1,450)
export const FRONT_F = W_FIN + 1400 - PT / 2; // 1,514
export const FRONT_M = E_FIN - 1450 + PT / 2; // 5,633

/** 대변기 칸 1 ~ 4. cyF·cyM은 양변기 중심 Y, hF·hM은 문 경첩 Y(문짝 선의 가운데), north는 칸의 북쪽 경계(벽면 또는 칸막이 중심)다. */
export const STALLS = [
  { n: 1, cyF: 479, cyM: 471, hF: 752, hM: 747, north: N_IN },
  { n: 2, cyF: 1494, cyM: 1487, hF: 1765, hM: 1757, north: PART_A },
  { n: 3, cyF: 2510, cyM: 2503, hF: 2780, hM: 2773, north: PART_B },
  { n: 4, cyF: 3518, cyM: 3515, hF: 3796, hM: 3787, north: PART_C },
];
/** 칸 문짝 폭 (도면의 문짝 선 길이 여 130px, 남 129px) */
export const LEAF = { f: 568, m: 564 };

// 세면 구역 남쪽 중간 벽 (도면 표기: 벽 중심 5,625 = 4,095 + 1,530. 두께는 선 간격 35px)
export const MID = { y0: 5548, y1: 5702 };
const MID_F_X0 = 1547; // 여 중간 벽 서쪽 끝 (x 1902)
const MID_M_X1 = 5665; // 남 중간 벽 동쪽 끝 (x 2844)
// 세면대 칸막이벽의 두겁돌 (도면 표기 W=180. 북쪽 면은 소변기 칸막이 치수 975 × 3의 끝, 남쪽 면에서 중간 벽까지 1,500)
const CAP = { y0: MID.y0 - 1500 - 180, y1: MID.y0 - 1500 };
// 남측 벽 (도면 표기: 벽 중심 6,900. 두께 201)
export const S_IN = 6800;
export const S_OUT = 7001;
const S_SMALL = 6903; // 수채기실·작은 실 남측 벽 안쪽 면 (두께 약 100)
// 아래쪽 벽 (도면 표기: 2,600 / 900 / 1,100 = 수채기실 서측 벽 중심 2,600, 수채기실·작은 실 사이 벽 중심 3,500, 작은 실 동측 벽 중심 4,600)
const MOP_W = { x0: 2550, x1: 2650 };
const LOW_C = { x0: 3450, x1: 3550 };
const SMALL_E = { x0: 4552, x1: 4648 };
// 출입문 개구 (여: 남측 벽 동쪽 끝 x 1881.5 ~ 수채기실 서측 벽, 남: 작은 실 동측 벽 ~ 남측 벽 서쪽 끝 x 2864.4)
const DOOR_F = { x0: 1458, x1: MOP_W.x0 };
const DOOR_M = { x0: SMALL_E.x1, x1: 5752 };
// 수채기실 문 개구 (문틀 블록 바깥 선 y 2328.5 ~ 2489), 점검구 개구 (표기 600. 문틀 바깥 y 2329.4 ~ 2463.5의 중심에 600)
const MOP_OPEN = { y0: 5903, y1: 6600 };
/**
 * 수채기실 문의 경첩과 문짝 폭. 수채기실 서측 벽의 서쪽 면 선(x 2129)을 모델 벽면(X 2,550)에 맞춘 상대값이다.
 * 경첩은 문틀 블록 서쪽 끝 x 2125(벽면에서 −17), 문짝 서쪽 끝은 x 1979.5(−653)다. research_2f_added.ts 의 손잡이도 쓴다.
 */
export const MOP_DOOR = { hx: 2533, hy: 5950, w: 636 };
/** 출입문 문틀 블록의 북쪽 끝. 도면은 재료분리대 북쪽 선(y 2547 ~ 2549)과 같은 선이다. 재료분리대 폭 표기 150을 따랐다. */
const JAMB_Y0 = S_OUT - 150;
const HATCH = { y0: 5900, y1: 6500, h: 900 };
// 「+」 해치 구역의 바깥 경계(점선): 여 x 1862.5, 남 x 2885
const PLUS_F_X0 = 1375;
const PLUS_M_X1 = 5844;
/** 남 「+」 구역 천장고. 도면 표기 CH 2,800 */
const CH_PLUS_M = 2800;
/** 남 「+」 구역(천장고 2,800)의 평면 범위. 도면의 「+」 해치 범위다. */
const ZONE_M = { x0: SMALL_E.x1, y0: MID.y1, x1: PLUS_M_X1, y1: S_IN };
// 창 위 커텐박스 홈(「"A" 단면상세도」). 창틀 안쪽 면(Y −200)에서 갈바 판까지 340, 홈 윗면은 천장보다 150 높다.
const CURTAIN = { y: -200, front: 340, rise: 150, len: 1700 };
const POCKET_Y1 = CURTAIN.y + CURTAIN.front; // 140. 갈바 판
const WIN_TOP = CH + CURTAIN.rise; // 2,600. 창 상단(창 위 면)
/** 커텐박스 길이 구간. 여는 평면 점선의 서쪽 꺾임(x 1859.5, X 1,362)에서, 남은 중앙 벽 동쪽 면에서 1,700 */
const POCKET_F = { x0: 1362, x1: 1362 + CURTAIN.len };
const POCKET_M = { x0: C_E, x1: C_E + CURTAIN.len };

const walls: Item[] = [
  {
    id: 'wall-west', layer: 'wall', name: '서측 벽',
    remark: '스캔에서 벽 선이 위아래로 약 4px 기운다. 가운데 높이(y 1700)의 선 위치를 썼다. 도면의 벽은 출입문 밖(복도 쪽)으로 y 2790(Y 7,924)까지 이어진다. 복도 쪽으로 뻗는 부분은 모델 범위 밖이라서 남측 벽 바깥 면(Y 7,001)에서 잘랐다. 북서 모서리의 바깥 돌출(x 1463 ~ 1522, y 898 ~ 969)은 화장실 벽에 붙은 모서리 기둥으로 보고 넣었다.',
    shapes: [box(-101, N_OUT, W_IN, S_OUT, 0, CH), box(-372, N_OUT, -101, -40, 0, CH)],
    dims: [dim('두께', 202, 'scaled'), dim('북서 모서리 기둥 폭', 271, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-east', layer: 'wall', name: '동측 벽',
    remark: '북동 모서리는 바깥 면이 x 3252(X 7,448)까지 나온다(y 898 ~ 990, Y −351 ~ 52). 모서리 기둥으로 보고 넣었다. 그 동쪽으로 뻗는 선은 이웃 실의 외벽이라서 넣지 않았다. 바깥 면은 y 2208(Y 5,376) 아래에서 x 3217에서 x 3212(X 7,273)로 꺾인다. 그 남쪽 구간은 두께가 176이다.',
    shapes: [box(E_IN, N_OUT, E_OUT, E_STEP_Y, 0, CH), box(E_IN, E_STEP_Y, E_OUT_S, S_OUT, 0, CH), box(E_OUT, N_OUT, 7448, 52, 0, CH)],
    dims: [dim('서측 벽 중심에서 동측 벽 중심까지', 7200, 'drawn'), dim('두께', 198, 'scaled'), dim('두께 (Y 5,376 남쪽)', E_OUT_S - E_IN, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-north', layer: 'wall', name: '북측 벽',
    remark: '창대 높이는 도면에 없다. 가정값이다. 창 상단은 「"A" 단면상세도」의 창 위 면이다(천장보다 150 높은 2,600). 그래서 창 폭 구간에는 천장고 아래에 창 위 벽이 없다. 커텐박스 길이 구간(여 X 1,362 ~ 3,062, 남 X 3,503 ~ 5,203)의 창 폭 밖 벽만 홈의 뒤를 막으려고 2,600까지 올렸다. 그 밖(여 커텐박스 동쪽 끝 ~ 중앙 벽 동쪽 면 등)은 천장고까지다. 다만 남 홈의 서쪽 면(창 서쪽 문설주)은 중앙 벽 폭(X 3,297 ~ 3,503)만 천장 상자 위(2,480)에서 2,600까지 올렸다. 상식 보완 품목(창틀)을 숨겨도 홈이 막히게 하려는 것이다. 상세도에서 창 위의 굵은 덩어리는 두 개다. 실내 쪽의 보(폭 약 300, Y +98 ~ −198)와 바깥 부재(약 150, Y −198 ~ −345)다. 아래 선은 둘 다 마감 선(y 600.6px)보다 약 9px(약 18) 위인 y 591.5px다. 창 폭 구간의 창 위 띠(북측 벽 바깥 면 ~ 창대석 바깥 끝 Y −200, 2,600 ~ 2,618)는 바깥 부재의 아래 끝이다. 보는 홈 윗면 위라서 그리지 않았다. 창 구간의 안쪽 면은 창대석 안쪽 끝(Y 0)이다. 서측 벽 밖으로 뻗는 북측 외벽과 그 서쪽의 창은 방 밖이라서 넣지 않았다.',
    shapes: [
      // 여 대변기 칸 구간, 남 대변기 칸 구간, 두 창 사이(여 창 동쪽 문설주 ~ 중앙 벽 동쪽 면)
      box(W_IN, N_OUT, WIN_F.x0, N_IN, 0, CH), box(WIN_M.x1, N_OUT, E_IN, N_IN, 0, CH), box(WIN_F.x1, N_OUT, C_E, N_IN, 0, CH),
      // 커텐박스 길이 구간의 창 폭 밖 벽 (천장 위 홈 높이까지)
      box(POCKET_F.x0, N_OUT, WIN_F.x0, N_IN, CH, WIN_TOP), box(WIN_F.x1, N_OUT, POCKET_F.x1, N_IN, CH, WIN_TOP), box(WIN_M.x1, N_OUT, POCKET_M.x1, N_IN, CH, WIN_TOP),
      // 남 홈의 서쪽 면. 남 창 서쪽 문설주(중앙 벽 폭)의 천장 위 부분. 천장 상자(2,450 ~ 2,480) 위에 얹는다.
      box(C_W, N_OUT, C_E, N_IN, CH + 30, WIN_TOP),
      // 창 위 바깥 부재의 아래 끝 (창 폭 × 북측 벽 바깥 면 ~ 창대석 바깥 끝, 창 위 면 ~ +18). 연구동 1층과 같은 처리다.
      box(WIN_F.x0, N_OUT, WIN_F.x1, CURTAIN.y, WIN_TOP, WIN_TOP + 18), box(WIN_M.x0, N_OUT, WIN_M.x1, CURTAIN.y, WIN_TOP, WIN_TOP + 18),
      // 창 구간 (창대 아래)
      box(WIN_F.x0, N_OUT, WIN_F.x1, 0, 0, SILL - 20), box(WIN_M.x0, N_OUT, WIN_M.x1, 0, 0, SILL - 20),
    ],
    dims: [dim('두께 (대변기 칸 구간)', 301, 'scaled'), dim('창대 높이', SILL, 'assumed'), dim('창 상단 높이 (천장고 + 상세도 150)', WIN_TOP, 'drawn')],
  },
  {
    id: 'window-f', layer: 'wall', name: '창호 2/CAW (여)', material: 'glass',
    remark: '창호 번호는 도면의 「2 / CAW」 기호를 따랐다. 폭은 문설주 사이의 선 위치다.',
    shapes: [box(WIN_F.x0, -275, WIN_F.x1, -255, SILL, WIN_TOP)],
    dims: [dim('폭', WIN_F.x1 - WIN_F.x0, 'scaled'), dim('창대 높이', SILL, 'assumed'), dim('상단 높이 (천장고 + 상세도 150)', WIN_TOP, 'drawn')],
  },
  {
    id: 'window-m', layer: 'wall', name: '창호 2/CAW (남)', material: 'glass',
    remark: '창호 번호는 도면의 「2 / CAW」 기호를 따랐다. 서쪽 끝은 중앙 벽 동쪽 면이다(도면의 문설주 x 2343, X 3,475).',
    shapes: [box(WIN_M.x0, -275, WIN_M.x1, -255, SILL, WIN_TOP)],
    dims: [dim('폭', WIN_M.x1 - WIN_M.x0, 'scaled'), dim('창대 높이', SILL, 'assumed'), dim('상단 높이 (천장고 + 상세도 150)', WIN_TOP, 'drawn')],
  },
  {
    id: 'wall-pier', layer: 'wall', name: '창 사이 기둥',
    remark: '여 실 쪽으로 나온 부분이다. 도면의 외곽선만 따랐다.',
    shapes: [box(PIER.x0, N_IN, C_W, PIER.y1, 0, CH)],
    dims: [dim('폭', C_W - PIER.x0, 'scaled'), dim('깊이', PIER.y1 - N_IN, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-central', layer: 'wall', name: '중앙 벽 (여·남 사이)',
    remark: '벽 중심은 표기 3,400을 따랐다. 도면의 벽 중심선은 가운데 높이에서 x 2323(X 3,387)이다. 두께는 선 간격 47.3px다.',
    shapes: [box(C_W, N_IN, C_E, MID.y0, 0, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 3400, 'drawn'), dim('두께', C_E - C_W, 'scaled'), dim('높이 (천장고)', CH, 'drawn')],
  },
  {
    id: 'wall-central-low', layer: 'wall', name: '수채기실과 작은 실 사이 벽',
    remark: '벽 중심은 아래 치수선의 합 2,600 + 900을 따랐다(선 위치 3,502). 중앙 벽보다 동쪽에 있다. 도면은 x 2302 ~ 2360, y 2249 ~ 2283(중앙 벽, 세면 구역 남쪽 벽 두 개, 이 벽이 만나는 곳)에 닫는 선이 없다. 한 덩어리 벽으로 보고 이 벽을 세면 구역 남쪽 벽의 북쪽 면(Y 5,548)까지 올렸다.',
    shapes: [box(LOW_C.x0, MID.y0, LOW_C.x1, S_SMALL, 0, CH)],
    dims: [dim('서측 벽 중심에서 벽 중심까지', '2,600 + 900', 'drawn'), dim('두께', 100, 'scaled')],
  },
  {
    id: 'wall-brick-f', layer: 'wall', name: '0.5B 조적벽 (여)', note: '0.5B 조적벽 신설 (H=3,450)',
    remark: '도면 표기 높이 3,450은 천장 위까지다. 모델은 천장고(2,450)에서 잘랐다. 벽 중심은 표기 치수 4,095를 따랐다(선 위치 4,101).',
    shapes: [box(W_IN, BRICK.y0, BRICK_F_X1, BRICK.y1, 0, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', 4095, 'drawn'), dim('두께', 98, 'scaled'), dim('높이', 3450, 'drawn'), dim('길이', BRICK_F_X1 - W_IN, 'scaled')],
  },
  {
    id: 'wall-brick-m', layer: 'wall', name: '0.5B 조적벽 (남)', note: '0.5B 조적벽 신설 (H=3,450)',
    remark: '도면 표기 높이 3,450은 천장 위까지다. 모델은 천장고(2,450)에서 잘랐다. 벽 중심은 표기 치수 4,095를 따랐다(선 위치 4,095).',
    shapes: [box(BRICK_M_X0, BRICK.y0, E_IN, BRICK.y1, 0, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', 4095, 'drawn'), dim('두께', 98, 'scaled'), dim('높이', 3450, 'drawn'), dim('길이', E_IN - BRICK_M_X0, 'scaled')],
  },
  {
    id: 'wall-mid-f', layer: 'wall', name: '세면 구역 남쪽 벽 (여)',
    remark: '서쪽 끝(X 1,547)과 서측 벽 사이가 세면 구역과 남쪽 구역을 잇는 통로다.',
    shapes: [box(MID_F_X0, MID.y0, LOW_C.x0, MID.y1, 0, CH)],
    dims: [dim('북측 기준선에서 벽 중심까지', '4,095 + 1,530', 'drawn'), dim('두께', 154, 'scaled')],
  },
  {
    id: 'wall-mid-m', layer: 'wall', name: '세면 구역 남쪽 벽 (남)',
    remark: '동쪽 끝(X 5,665)과 동측 벽 사이가 세면 구역과 남쪽 구역을 잇는 통로다. 남 「+」 구역(천장고 2,800)에 접한 구간(X 4,648 ~ 5,665)은 2,800까지 올렸다.',
    shapes: [box(LOW_C.x1, MID.y0, MID_M_X1, MID.y1, 0, CH), box(ZONE_M.x0, MID.y0, MID_M_X1, MID.y1, CH + 30, CH_PLUS_M)],
    dims: [dim('북측 기준선에서 벽 중심까지', '4,095 + 1,530', 'drawn'), dim('두께', 154, 'scaled')],
  },
  {
    id: 'wall-south', layer: 'wall', name: '남측 벽',
    remark: '벽 중심은 표기 6,900을 따랐다(선 위치 6,909). 화장실 구간은 두께 201, 수채기실과 작은 실 구간은 두께 약 100이다. 출입문 위 높이는 도면에 없다. 가정값이다. 남 「+」 구역(천장고 2,800)에 접한 구간(X 4,648 ~ 5,844)은 2,800까지 올렸다.',
    shapes: [
      box(W_IN, S_IN, DOOR_F.x0, S_OUT, 0, CH), box(DOOR_M.x1, S_IN, E_IN, S_OUT, 0, CH),
      box(MOP_W.x0, S_SMALL, SMALL_E.x1, S_OUT, 0, CH),
      // 출입문 위
      box(DOOR_F.x0, S_IN, DOOR_F.x1, S_OUT, HEAD, CH), box(DOOR_M.x0, S_IN, DOOR_M.x1, S_OUT, HEAD, CH),
      // 남 「+」 구역의 천장고 차이(2,450 ~ 2,800)
      box(ZONE_M.x0, S_IN, ZONE_M.x1, S_OUT, CH + 30, CH_PLUS_M),
    ],
    dims: [dim('북측 기준선에서 벽 중심까지', 6900, 'drawn'), dim('두께 (화장실)', 201, 'scaled'), dim('출입문 상단 높이', HEAD, 'assumed')],
  },
  {
    id: 'wall-mop-west', layer: 'wall', name: '수채기실 서측 벽',
    remark: '벽 중심은 표기 2,600이다(선 위치 2,589). 문 개구는 문틀 블록의 바깥 선이다(북쪽 y 2328.5 → Y 5,903, 남쪽 y 2489 → 6,604. 남쪽은 6,600으로 두었다). 개구 높이는 도면에 없다. 가정값이다.',
    shapes: [
      box(MOP_W.x0, MID.y1, MOP_W.x1, MOP_OPEN.y0, 0, CH), box(MOP_W.x0, MOP_OPEN.y1, MOP_W.x1, S_SMALL, 0, CH),
      box(MOP_W.x0, MOP_OPEN.y0, MOP_W.x1, MOP_OPEN.y1, HEAD, CH),
    ],
    dims: [dim('서측 벽 중심에서 벽 중심까지', 2600, 'drawn'), dim('두께', 100, 'scaled'), dim('문 개구 폭', MOP_OPEN.y1 - MOP_OPEN.y0, 'scaled')],
  },
  {
    id: 'wall-small-east', layer: 'wall', name: '작은 실 동측 벽 (남 쪽)',
    remark: '점검구 개구 폭은 표기 600을 따랐다. 도면의 문틀 막음 블록 바깥은 y 2327.5 ~ 2466(Y 5,898 ~ 6,505, 607)이다. 개구는 그 중심(6,200)에 600으로 두었다. 개구 높이는 표기 900이다. 하단을 바닥으로 보았다(가정). 남 「+」 구역(천장고 2,800)에 접한 구간은 2,800까지 올렸다.',
    shapes: [
      box(SMALL_E.x0, MID.y1, SMALL_E.x1, HATCH.y0, 0, CH), box(SMALL_E.x0, HATCH.y1, SMALL_E.x1, S_SMALL, 0, CH),
      box(SMALL_E.x0, HATCH.y0, SMALL_E.x1, HATCH.y1, HATCH.h, CH),
      box(SMALL_E.x0, ZONE_M.y0, SMALL_E.x1, ZONE_M.y1, CH + 30, CH_PLUS_M),
    ],
    dims: [dim('서측 벽 중심에서 벽 중심까지', '2,600 + 900 + 1,100', 'drawn'), dim('두께', 96, 'scaled'), dim('점검구 폭', 600, 'drawn'), dim('점검구 높이', 900, 'drawn')],
  },
];

// 세면대 칸막이벽과 소변기 뒤 띠. 「0.5B 칸막이벽 설치 (H=1,400)」은 벽 높이로, 두겁돌 THK20은 그 위에 얹는 것으로 읽었다.
const LOW_H = 1400;
const CHASE_H = 1000; // 소변기 뒤 띠 높이. 가정
/** 남 소변기 중심 Y. 소변기 칸막이(945, 1,920, 2,895)와 창대석·두겁돌 사이의 가운데다. */
const URINAL_YS = [457.5, 1432.5, 2407.5, 3382.5];
const lowWallNote = '0.5B 칸막이벽 설치 (H=1,400) 상부 THK20 화강석 두겁돌 설치 (W=180)';
const lowWallRemark = (fin: number, tick: number, face: number) =>
  `0.5B 벽은 두겁돌 안쪽의 점선(y 1869.7 ~ 1893.5, 두께 104)이다. 두겁돌은 벽 위(1,400 ~ 1,420)에 얹었다. 두겁돌 폭은 표기 180을 따랐다(도면 선 157). 치수 750의 벽 쪽 눈금(x ${tick})은 도면의 중앙 벽 면 선(x ${face})에서 약 ${fin} 떨어진 마감선이다. 그래서 길이는 중앙 벽 마감선(모델 벽면에서 ${fin})에서 끝까지 표기 750을 따랐다. 벽면에서 끝까지는 ${750 + fin}이다.`;
const lowWallDims = (fin: number) => [
  dim('높이', LOW_H, 'drawn'), dim('두겁돌 폭', 180, 'drawn'), dim('두겁돌 두께', 20, 'drawn'),
  dim('길이 (중앙 벽 마감선에서)', 750, 'drawn'), dim('중앙 벽 마감선의 벽면에서 거리', fin, 'scaled'), dim('벽 두께', 104, 'scaled'),
];
/** 중앙 벽 마감선의 벽면에서 거리. 여는 벽 면 선 x 2300.5와 눈금 x 2297(3.5px), 남은 벽 면 선 x 2346.5와 눈금 x 2351.0(4.5px)의 차다. */
const C_FIN = { f: 16, m: 20 };
/** 세면대 칸막이벽 중심 Y와 두겁돌 중심까지의 거리 */
const LOW_Y = (3895 + 3999) / 2;
const CAP_OFF = (CAP.y0 + CAP.y1) / 2 - LOW_Y;
/** 소변기 뒤 띠의 벽에서 나온 폭. 도면의 벽면(x 2346.5)에서 띠 앞 면(x 2386.5)까지 40px다. */
const CHASE_D = 175;

const lowWalls: Item[] = [
  // 여는 중앙 벽 서쪽 면에서 서쪽(rot 180)으로, 남은 동쪽 면에서 동쪽(rot 0)으로 뻗는다. 틀의 +y가 반대라서 두겁돌 쪽 부호가 다르다.
  lowWall('f', C_W, LOW_Y, 180, 750 + C_FIN.f, 104, 180, -CAP_OFF, LOW_H, { name: '세면대 칸막이벽 (여)', note: lowWallNote, remark: lowWallRemark(C_FIN.f, 2297, 2300.5), dims: lowWallDims(C_FIN.f) }),
  lowWall('m', C_E, LOW_Y, 0, 750 + C_FIN.m, 104, 180, CAP_OFF, LOW_H, { name: '세면대 칸막이벽 (남)', note: lowWallNote, remark: lowWallRemark(C_FIN.m, 2351.0, 2346.5), dims: lowWallDims(C_FIN.m) }),
  urinalChase('m', C_E, 0, 0, CAP.y0, CHASE_D, CHASE_H, [], 437, {
    name: '소변기 뒤 띠 (남)', note: 'THK20 화강석 두겁돌 설치 (L=4,000)',
    remark: '중앙 벽 동쪽 면의 점묘 띠다(폭 175). 높이는 도면에 없다. 1,000으로 가정했다. 띠의 길이는 창대석 안쪽 끝(Y 0)에서 세면대 칸막이벽 두겁돌 북쪽 면까지 3,869다. 두겁돌까지 합하면 4,049다. 소변기 4곳의 뒤판 선 안에서도 점묘가 이어진다(띠 안쪽 줄 x 2353 ~ 2368px의 점 개수: 뒤판 안 100줄당 8.8개, 소변기 사이 5.8개). 그래서 띠와 두겁돌을 끊지 않았다(강의동 3층과 같은 처리). 소변기 뒤판과 그릇의 벽 쪽 부분은 띠 안에 묻힌다.',
    dims: [dim('길이 (주기)', 4000, 'drawn'), dim('길이 (선 위치, 칸막이벽까지)', CAP.y0, 'scaled'), dim('폭', CHASE_D, 'scaled'), dim('두겁돌 두께', 20, 'drawn'), dim('높이', CHASE_H, 'assumed')],
  }),
];

const partNote = '12mm 지정칸막이 (H=1,950)';
const gapRemark = '「H=1,950」을 바닥에서 칸막이 상단까지의 높이로 보았다. 하부 틈은 도면에 없다. 가정값이다. 위치는 표기 치수(마감선에서 1,008, 중심 사이 1,014, 1,014)를 따랐다.';
const frontRemark = (room: string, d: number, line: number) =>
  `칸막이 앞 패널이다. 도면의 「(H=1,950)」 지시선은 칸 사이 칸막이를 가리킨다. 높이와 두께는 같은 것으로 가정했다. 중심 X는 표기 ${d.toLocaleString('en-US')}(${room} 벽 마감선에서 먼 면까지)를 따랐다(선 위치 ${line.toLocaleString('en-US')}). 패널 조각은 문 경첩과 닫힌 문의 끝 사이다.${room === '서측' ? ' 첫 조각은 창 구간의 창대 아래 벽 마감 면(Y 3)에서 시작한다.' : ''}`;
/**
 * 전면 칸막이 조각의 Y 구간. 북측 벽면에서 칸 1 문의 닫힌 끝까지, 칸 n 경첩에서 칸 n+1 문의 닫힌 끝까지, 칸 4 경첩에서 조적벽까지.
 * 여 칸막이(X 1,508 ~ 1,520)는 창 구간(X 1,486 ~ 2,985) 안이라서 창대 아래 벽 마감 면(Y 3)에서 시작한다. 남은 대변기 칸 구간 벽면(Y −50)이다.
 */
const frontSpans = (key: 'f' | 'm'): [number, number][] => {
  const h = STALLS.map((s) => (key === 'f' ? s.hF : s.hM));
  const w = LEAF[key];
  const north = key === 'f' ? 3 : N_IN;
  return [[north, h[0] - w], [h[0], h[1] - w], [h[1], h[2] - w], [h[2], h[3] - w], [h[3], BRICK.y0]];
};

const partitions: Item[] = [
  {
    id: 'partition-f', layer: 'partition', name: '대변기 칸막이 (여)', note: partNote, remark: gapRemark,
    shapes: [PART_A, PART_B, PART_C].map((y) => box(W_IN, y - PT / 2, FRONT_F - PT / 2, y + PT / 2, GAP, 1950)),
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('칸 폭 (칸 1, 4)', 1008, 'drawn'), dim('칸 폭 (칸 2, 3)', 1014, 'drawn'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-m', layer: 'partition', name: '대변기 칸막이 (남)', note: partNote, remark: gapRemark,
    shapes: [PART_A, PART_B, PART_C].map((y) => box(FRONT_M + PT / 2, y - PT / 2, E_IN, y + PT / 2, GAP, 1950)),
    dims: [dim('높이', 1950, 'drawn'), dim('두께', PT, 'drawn'), dim('칸 폭 (칸 1, 4)', 1008, 'drawn'), dim('칸 폭 (칸 2, 3)', 1014, 'drawn'), dim('하부 틈', GAP, 'assumed')],
  },
  {
    id: 'partition-front-f', layer: 'partition', name: '대변기 칸 전면 칸막이 (여)', remark: frontRemark('서측', 1400, 1499),
    shapes: frontSpans('f').map(([y0, y1]) => box(FRONT_F - PT / 2, y0, FRONT_F + PT / 2, y1, GAP, 1950)),
    dims: [dim('벽 마감선에서 먼 면까지', 1400, 'drawn'), dim('높이', 1950, 'assumed'), dim('패널 조각', '문 경첩과 문짝 폭으로 정했다', 'scaled')],
  },
  {
    id: 'partition-front-m', layer: 'partition', name: '대변기 칸 전면 칸막이 (남)', remark: frontRemark('동측', 1450, 5635),
    shapes: frontSpans('m').map(([y0, y1]) => box(FRONT_M - PT / 2, y0, FRONT_M + PT / 2, y1, GAP, 1950)),
    dims: [dim('벽 마감선에서 먼 면까지', 1450, 'drawn'), dim('높이', 1950, 'assumed'), dim('패널 조각', '문 경첩과 문짝 폭으로 정했다', 'scaled')],
  },
  urinalScreens('m', C_E, [945, 1920, 2895], 0, 450, 1250, 400, {
    name: '소변기 칸막이 (남)', note: '12mm 지정 칸막이 (450x1,250 - 3개소)',
    remark: '위치는 표기 치수 975 × 3(세면대 칸막이벽 두겁돌 북쪽 면에서 975 간격)을 따랐다. 길이 450은 중앙 벽면에서 잰다(도면 선 466 ~ 477). 높이 1,250의 하단 높이는 도면에 없다. 400으로 가정했다.',
  }),
];

const stallDoorText = { remark: '도면은 문을 칸 안쪽으로 90도 연 상태로 그렸다. 모델도 같은 상태다. 경첩은 문짝 선과 열림 호의 중심이다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.' };
const entranceRemark = (x: number, y0: number, y1: number, r: number) =>
  `도면은 문을 남쪽(복도)으로 90도 연 상태로 그렸다. 경첩은 문짝 이중선의 벽 쪽 끝(마구리 중심 x ${x}, y ${y0}px)이다. 문짝 폭은 문짝 선의 길이(y ${y0} → ${y1}px)다. 열림 호를 원으로 맞춘 반지름(약 ${r}px)으로 확인했다. 문 높이는 가정값이다.`;

const jambRemark = (px: string, mm: string, closed: string) =>
  `문짝 아래 끝은 재료분리대 윗면(노출 10)이다. 문틀 블록은 도면 선(${px}px)이다. 모델은 ${mm}이다. 블록 북쪽 끝은 재료분리대 북쪽 선과 같은 선이라서 표기 150을 따라 Y ${JAMB_Y0.toLocaleString('en-US')}로 두었다(도면 y 2547 → 약 6,858). 모델은 도면이 그린 상태(열린 문)를 그린다. 문을 닫으면 ${closed} 문틀 높이는 문 높이(가정)와 같다.`;
/** 출입문 경첩과 문짝 폭. 문짝 이중선의 벽 쪽 끝과 문짝 선 길이(여 230.9px, 남 229.9px)다. research_2f_added.ts 의 손잡이도 쓴다. */
export const ENTRANCE = { f: { hx: 1523, hy: 6935, w: 1009 }, m: { hx: 5687, hy: 6929, w: 1005 } };

const doors: Item[] = [
  ...STALLS.map((s) => stallDoor(`f${s.n}`, FRONT_F, s.hF, 180, LEAF.f, stallDoorText)),
  ...STALLS.map((s) => stallDoor(`m${s.n}`, FRONT_M, s.hM, 0, LEAF.m, stallDoorText)),
  {
    id: 'door-entrance-f', layer: 'door', name: '출입문 2/SSD (여)', material: 'steelDoor',
    remark: `${entranceRemark(1896, 2564.7, 2795.6, 227)} ${jambRemark('경첩 쪽 x 1880 ~ 1891.5, 손잡이 쪽 x 2117.7 ~ 2129.6, y 2547 ~ 2581', '경첩 쪽 X 1,458 ~ 1,502(벽 끝 ~ 열린 문짝 바깥 면), 손잡이 쪽 X 2,498 ~ 2,550(폭 52, 수채기실 서측 벽 면에서)', '문짝(X 1,523 ~ 2,532, Y 6,915 ~ 6,955)이 손잡이 쪽 블록(X 2,498 ~ 2,550)에 34 × 40 × 2,090 묻힌다(닫힌 상태의 간섭).')}`,
    shapes: [
      { type: 'leaf', hx: ENTRANCE.f.hx, hy: ENTRANCE.f.hy, width: ENTRANCE.f.w, angleDeg: 90, thickness: 40, z0: 10, z1: HEAD },
      // 문틀. 경첩 쪽 블록과 손잡이 쪽 블록(도면의 꽉 찬 블록)
      box(DOOR_F.x0, JAMB_Y0, ENTRANCE.f.hx - 21, S_OUT, 0, HEAD), box(DOOR_F.x1 - 52, JAMB_Y0, DOOR_F.x1, S_OUT, 0, HEAD),
    ],
    dims: [dim('문짝 폭', ENTRANCE.f.w, 'scaled'), dim('개구 폭', DOOR_F.x1 - DOOR_F.x0, 'scaled'), dim('높이', HEAD, 'assumed'), dim('문짝 아래 끝 (재료분리대 윗면)', 10, 'assumed'), dim('문틀 블록 폭 (경첩 쪽 / 손잡이 쪽)', '44 / 52', 'scaled')],
  },
  {
    id: 'door-entrance-m', layer: 'door', name: '출입문 2/SSD (남)', material: 'steelDoor',
    remark: `${entranceRemark(2849, 2563.4, 2793.3, 232)} ${jambRemark('손잡이 쪽 x 2611.7 ~ 2624.0, 경첩 쪽 x 2852.1 ~ 2864.4, y 2547 ~ 2581', '손잡이 쪽 X 4,648 ~ 4,702(폭 54, 작은 실 동측 벽 면에서), 경첩 쪽 X 5,708 ~ 5,752(열린 문짝 바깥 면 ~ 벽 끝)', '문짝(X 4,682 ~ 5,687, Y 6,909 ~ 6,949)이 손잡이 쪽 블록(X 4,648 ~ 4,702)에 20 × 40 × 2,090 묻힌다(닫힌 상태의 간섭).')}`,
    shapes: [
      { type: 'leaf', hx: ENTRANCE.m.hx, hy: ENTRANCE.m.hy, width: ENTRANCE.m.w, angleDeg: 90, thickness: 40, z0: 10, z1: HEAD },
      // 문틀. 경첩 쪽 블록과 손잡이 쪽 블록(도면의 꽉 찬 블록)
      box(ENTRANCE.m.hx + 21, JAMB_Y0, DOOR_M.x1, S_OUT, 0, HEAD), box(DOOR_M.x0, JAMB_Y0, DOOR_M.x0 + 54, S_OUT, 0, HEAD),
    ],
    dims: [dim('문짝 폭', ENTRANCE.m.w, 'scaled'), dim('개구 폭', DOOR_M.x1 - DOOR_M.x0, 'scaled'), dim('높이', HEAD, 'assumed'), dim('문짝 아래 끝 (재료분리대 윗면)', 10, 'assumed'), dim('문틀 블록 폭 (손잡이 쪽 / 경첩 쪽)', '54 / 44', 'scaled')],
  },
  {
    id: 'door-mop', layer: 'door', name: '수채기실 문 2/SD', note: '기존 도어 O.P도장', material: 'paintDoor',
    remark: '도면은 문을 서쪽(여 「+」 구역)으로 90도 연 상태로 그렸다. 문 크기 표기는 없다. 위치는 수채기실 서측 벽의 서쪽 면 선(x 2129)을 모델 벽면(X 2,550)에 맞춘 상대값이다. 경첩은 문틀 블록 서쪽 끝(x 2125, 벽면에서 −17, X 2,533)이고 문짝 이중선(y 2335.5 / 2343.5)의 가운데 Y 5,950이다. 문짝 폭은 문짝 선의 길이(x 1979.5 → 2125, 145.5px = 636)다. 문틀 블록 2개는 도면 선 그대로다. 북쪽 블록은 x 2125 ~ 2154, y 2328.5 ~ 2336(서쪽 x 2134까지) / 2338.5(동쪽)다. 남쪽 블록은 x 2125 ~ 2154, y 2481(서쪽) / 2478.5(동쪽) ~ 2488.5다. 블록의 동쪽 끝은 위아래 선이 끝나는 x 2154(X 2,659)다. 개구 구간의 x 2157 선은 블록과 다른 연한 선이다. 블록은 벽 양쪽으로 조금 나온다. 모델은 도면이 그린 상태(열린 문)를 그린다. 문을 닫으면 문짝(X 2,513 ~ 2,553, Y 5,950 ~ 6,586)이 남쪽 블록의 서쪽 턱(X 2,533 ~ 2,572, Y 6,569 ~ 6,600)에 20 × 17 × 2,100 묻힌다(닫힌 상태의 간섭). 높이와 문틀 높이는 가정값이다.',
    shapes: [
      { type: 'leaf', hx: MOP_DOOR.hx, hy: MOP_DOOR.hy, width: MOP_DOOR.w, angleDeg: 180, thickness: 40, z0: 0, z1: HEAD },
      // 문틀. 블록마다 서쪽 턱 상자와 동쪽 상자
      box(MOP_DOOR.hx, MOP_OPEN.y0, 2572, 5936, 0, HEAD), box(2572, MOP_OPEN.y0, 2659, 5946, 0, HEAD),
      box(MOP_DOOR.hx, 6569, 2572, MOP_OPEN.y1, 0, HEAD), box(2572, 6558, 2659, MOP_OPEN.y1, 0, HEAD),
    ],
    dims: [dim('문짝 폭', MOP_DOOR.w, 'scaled'), dim('개구 폭', MOP_OPEN.y1 - MOP_OPEN.y0, 'scaled'), dim('높이', HEAD, 'assumed'), dim('문틀 블록 X 범위', '2,533 ~ 2,659', 'scaled')],
  },
  {
    id: 'door-hatch', layer: 'door', name: '점검구 5-1/SSD (작은 실)', note: '기존 점검구 도색 (600X900)', material: 'paintDoor',
    remark: '도면은 문을 동쪽(남 「+」 구역)으로 약 44.5도 연 상태로 그렸다. 모델도 같은 각도다. 문짝은 도면 이중선의 중심선(x = 2628.5 + 1.016(y − 2352)px) 위에 두었다. 경첩은 문짝 선의 벽 쪽 마구리 중심 (2612, 2335)px다. 문짝 폭은 문짝 선의 길이(끝 (2697, 2425)px까지 약 124px)다. 열림 호를 원으로 맞추면 중심 (2617, 2337.8)px, 반지름 약 522다. 문짝 두께 30은 이중선의 수직 간격(약 7.5px)이다. 표기 600은 개구 폭(문틀 막음 블록 바깥, 도면 607)으로 보았다. 문틀은 문설주마다 상자 2개로 그렸다. 도면의 막음 블록은 바깥 쪽(x 2607 ~ 2612)이 턱으로 비어 있다. 넓은 상자(y 2327.5 ~ 2336.5, 2456 ~ 2466px)는 닫힌 문짝의 뒷면(X 4,633)까지, 턱 상자(y 2336.5 ~ 2341, 2451 ~ 2456px)는 턱 선(x 2607, X 4,629)까지다. 닫힌 문짝(X 4,633 ~ 4,663)과 문틀이 겹치지 않는다. 남 「+」 구역의 형광펜 하나가 이 문짝 끝과 주기 「기존 점검구 도색 (600X900)」 글자 위((2717, 2415)px 부근)에 칠해져 있다. 손글씨 「조명」은 없다. 하단 높이는 도면에 없다. 바닥에서 900까지로 가정했다.',
    shapes: [
      { type: 'leaf', hx: 4648, hy: 5931, width: 541, angleDeg: 44.5, thickness: 30, z0: 0, z1: HATCH.h },
      // 문틀. 문설주마다 넓은 상자와 턱 상자
      box(4537, HATCH.y0, 4633, 5938, 0, HATCH.h), box(4537, 5938, 4629, 5958, 0, HATCH.h),
      box(4537, 6460, 4633, HATCH.y1, 0, HATCH.h), box(4537, 6440, 4629, 6460, 0, HATCH.h),
    ],
    dims: [
      dim('개구 폭', 600, 'drawn'), dim('문짝 폭', 541, 'scaled'), dim('높이', 900, 'drawn'), dim('열린 각도', 44.5, 'scaled'), dim('하단 높이', 0, 'assumed'),
      dim('문짝 두께', 30, 'scaled'), dim('문설주 폭 (넓은 상자 / 턱 상자)', '96 / 92', 'scaled'),
    ],
  },
];

/** 세면기 중심 X. 도면에서 잰 벽면과의 거리(여 327, 남 341)로 모델 벽면에서 띄웠다. */
const BASIN_X = { f: C_W - 327, m: C_E + 341 };
const BASIN_YS = [4425, 5129];
/** 여 세면기 반지름. 바깥 원 지름이 위 105px(459), 아래 102px(446)로 다르다. */
const BASIN_R_F = [229, 223];

const fixtures: Item[] = [
  // 양변기는 외벽에 붙는다. 여는 동쪽, 남은 서쪽을 본다.
  ...STALLS.map((s) => toilet(`f${s.n}`, W_IN, s.cyF, 0)),
  ...STALLS.map((s) => toilet(`m${s.n}`, E_IN, s.cyM, 180)),
  // 소변기는 중앙 벽 동쪽 면에 붙어 동쪽을 본다. 폭 437은 도면 기호의 뒤판 폭, 벽에서 나온 길이 356은 도면 환산값이다.
  ...URINAL_YS.map((y, i) => urinal(`m${i + 1}`, C_E, y, 0, 437, 356)),
  // 세면기는 중앙 벽면 앞 상판에 얹는다. 여는 서쪽, 남은 동쪽을 본다.
  ...BASIN_YS.map((y, i) => basin(`f${i + 1}`, BASIN_X.f, y, '중앙 벽면에서 중심까지', 327, BASIN_R_F[i])),
  ...BASIN_YS.map((y, i) => basin(`m${i + 1}`, BASIN_X.m, y, '중앙 벽면에서 중심까지', 341, 227)),
  ...BASIN_YS.map((y, i) => faucet(`f${i + 1}`, BASIN_X.f, y, 180, BASIN_R_F[i])),
  ...BASIN_YS.map((y, i) => faucet(`m${i + 1}`, BASIN_X.m, y, 0, 227)),
  {
    id: 'mop-sink', layer: 'fixture', name: '수채기', note: '수채기 신설 (기계설비공사)',
    remark: '평면 크기는 도면 축척 환산값이다. 수채기실 동측 벽(수채기실과 작은 실 사이 벽)에 붙는다. 높이와 안쪽 형상은 가정값이다. 주기는 작은 실 안에 적혀 있고 지시선이 수채기실의 수채기를 가리킨다.',
    shapes: [
      rbox(2959, 6021, LOW_C.x0, 6580, 0, 260, 30),
      { type: 'plate', x0: 2959, y0: 6021, x1: LOW_C.x0, y1: 6580, z0: 260, z1: 350, r: 30, holes: [{ x0: 3012, y0: 6074, x1: 3397, y1: 6527, r: 50 }] },
      cyl(3164, 6299, 32, 260, 265, 'metal'),
    ],
    dims: [dim('폭', 559, 'scaled'), dim('깊이', 491, 'scaled'), dim('높이', 350, 'assumed')],
  },
  // 배수구는 구배 바닥(pan, drop 10)의 낮은 점에 있다. 세면 구역 바닥도 배수구로 모이는 화살표 2개가 있어서 구배로 그렸다.
  floorDrain('fd-main-f', 2203, 2232, -10),
  floorDrain('fd-main-m', 4976, 2227, -10),
  floorDrain('fd-basin-f', 2807, 4830, -10),
  floorDrain('fd-basin-m', 3979, 4829, -10),
];

const A = 'assumed' as const;
const glassShelfText = { note: '유리선반 설치 (r=300) (기계설비공사)' };
const shelfRemark = '도면의 칸 모서리에 1/4 원 점선이 그려져 있다. 주기 지시선은 다른 칸을 가리킨다. 설치 높이는 가정값이다.';
const hookNote = { note: '가방걸이 설치', remark: '도면의 칸 문 4개에 가방걸이 기호가 그려져 있다. 주기 지시선이 이 문의 기호를 가리킨다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면에 달았다.' };
const hookPlain = { remark: '도면의 문에 가방걸이 기호가 그려져 있다. 주기 지시선은 다른 문을 가리킨다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면에 달았다.' };
const mirror = 'THK.5 방습거울 (기계설비공사)';
const curtainNote = '상부 커텐박스 설치 (L=1,700) / THK1.6 갈바위 지정도장';
const curtainRemark = 'note의 앞 주기는 평면의 것이고, 뒤 주기 「THK1.6 갈바위 지정도장」은 도면 오른쪽 위 「"A" 단면상세도」의 것이다. 단면은 상세도를 따랐다. 천장 끝에서 위로 150 올라간 갈바 판(THK1.6)이고, 판과 창 사이는 천장이 없는 홈이다. 판의 위치는 창틀 안쪽 면(Y −200, 창대석 바깥 끝)에서 표기 340이라 Y 140이다. 평면 점선(y 1001, Y 100)과 40 다르다. 표기 340을 따랐다. 판 위의 고정 날개(150)는 천장 속이라서 그리지 않았다.';
/** 선반 앞 끝. 도면의 벽면에서 선반 앞 선(x 2250)까지 49px다. */
const SHELF_X0 = C_W - 214;
/** 세면대 상판 앞 끝. 도면의 벽면에서 상판 앞 선(여 x 2158, 남 x 2490)까지의 거리로 띄웠다. */
const COUNTER_X = { f: C_W - 618, m: C_E + 627 };
const underBasinYRemark = '도면의 점선은 중간 벽 마감선(y 2243 ~ 2244)에서 끝난다. 벽 면 선(y 2248) 기준으로 Y 5,026 ~ 5,528이다. 모델은 중간 벽 면(Y 5,548)에서 북쪽으로 500(Y 5,048 ~ 5,548)이라서 약 20 남쪽이다. 1,500 치수를 벽 면 기준으로 둔 것과 같은 처리다.';
/** 남 세면대 하부 칸막이 중심 X. 도면의 벽면(x 2347)에서 점선 중심(x 2487.5)까지 140.5px다. */
const UNDER_BASIN_M_X = C_E + 614;

const accessories: Item[] = [
  {
    id: 'window-sill-f', layer: 'accessory', name: '창대석 (여)', note: 'THK20 인조대리석 창대석 설치 (W=200)', material: 'marble',
    shapes: [box(WIN_F.x0, -200, WIN_F.x1, 0, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  {
    id: 'window-sill-m', layer: 'accessory', name: '창대석 (남)', note: 'THK20 인조대리석 창대석 설치 (W=200)', material: 'marble',
    shapes: [box(WIN_M.x0, -200, WIN_M.x1, 0, SILL - 20, SILL)],
    dims: [dim('폭', 200, 'drawn'), dim('두께', 20, 'drawn'), dim('높이', SILL, 'assumed')],
  },
  // 창틀 안쪽 면(Y −200)에서 갈바 판까지 340(「"A" 단면상세도」). 여는 창 사이 기둥 서쪽 면에서, 남은 중앙 벽 동쪽 면에서 표기 1,700만큼 뻗는다.
  curtainBox('f', (POCKET_F.x0 + POCKET_F.x1) / 2, CURTAIN.y, 90, CURTAIN.len, CH, CURTAIN.front, N_IN + 3 - CURTAIN.y, {
    name: '커텐박스 (여)', note: curtainNote,
    remark: `${curtainRemark} 서쪽 끝은 평면 점선의 서쪽 꺾임(x 1859.5, X 1,362)이다. 창 서쪽 문설주보다 124 서쪽이다. 길이는 표기 1,700이다(그린 길이 x 1859.5 ~ 2248, 1,698). 동쪽 끝(X 3,062)과 창 사이 기둥 서쪽 면(X 3,082) 사이 20은 천장이 덮는다. 서쪽 마구리 판은 평면 점선의 꺾인 끝(x 1859.5)이다. 동쪽 끝의 점선은 꺾이지 않는다. 동쪽 마구리 판은 가정이다.`,
  }),
  curtainBox('m', (POCKET_M.x0 + POCKET_M.x1) / 2, CURTAIN.y, 90, CURTAIN.len, CH, CURTAIN.front, N_IN + 3 - CURTAIN.y, {
    name: '커텐박스 (남)', note: curtainNote,
    remark: `${curtainRemark} 길이는 표기 1,700이다(평면 점선 x 2350 ~ 2741.5, 1,711). 서쪽 끝은 중앙 벽 동쪽 면이다. 동쪽 끝은 창 동쪽 문설주보다 207 동쪽이다. 단면 표시 Ⓐ는 남 창에 있다. 동쪽 마구리 판은 평면 점선의 꺾인 끝(x 2741)이다. 서쪽 끝(중앙 벽 동쪽 면)의 점선은 꺾이지 않는다. 서쪽 마구리 판은 가정이다.`,
  }),
  curtainPocketTop('f', (POCKET_F.x0 + POCKET_F.x1) / 2, CURTAIN.y, 90, CURTAIN.len, CH, CURTAIN.front, { name: '커텐박스 홈 윗면 (여)' }),
  curtainPocketTop('m', (POCKET_M.x0 + POCKET_M.x1) / 2, CURTAIN.y, 90, CURTAIN.len, CH, CURTAIN.front, { name: '커텐박스 홈 윗면 (남)' }),
  {
    id: 'shelf-f', layer: 'accessory', name: '인조대리석 선반 (여)', note: 'THK20 인조대리석 선반 설치 (하부 고정 철물)', material: 'marble',
    remark: '평면 범위는 도면 환산값이다(북쪽 끝 y 1521.2, 남쪽 끝은 세면대 칸막이벽 두겁돌). 설치 높이는 가정값이다.',
    shapes: [box(SHELF_X0, 2374, C_W, CAP.y0, 830, 850)],
    dims: [dim('길이', CAP.y0 - 2374, 'scaled'), dim('깊이', 214, 'scaled'), dim('두께', 20, 'drawn'), dim('설치 높이', 850, A)],
  },
  {
    id: 'mirror-shelf-f', layer: 'accessory', name: '선반 위 방습거울 (여)', note: mirror, material: 'mirror', facing: [-1, 0],
    remark: '도면에 거울 크기 표기가 없다. 중앙 벽면의 굵은 선 2토막(y 1555 ~ 1673, 1714 ~ 1834)을 환산한 값이다. 형광펜이 일부를 가린다. 모델은 벽 면에 붙였다. 높이는 가정값이다.',
    shapes: [box(C_W - 5, 2522, C_W, 3038, 950, 1850), box(C_W - 5, 3217, C_W, 3741, 950, 1850)],
    dims: [dim('수량', 2, 'scaled'), dim('1장 길이', '약 516 ~ 524', 'scaled'), dim('두께', 5, 'drawn'), dim('높이', 900, A)],
  },
  {
    id: 'mirror-full-f', layer: 'accessory', name: '전신 방습거울 (여)', note: `${mirror} (600X1,500)`, material: 'mirror', facing: [0, 1],
    remark: '조적벽 남쪽 면에 있다. 폭은 표기 600을 따랐다(도면 선 x 1650.6 ~ 1788.6, 603). 도면의 거울 선(y 1935)은 벽 선(y 1928.4)에서 약 29 떨어져 있다. 모델은 벽 면에 붙였다. 하단 높이는 가정값이다.',
    shapes: [box(450, BRICK.y1, 1050, BRICK.y1 + 5, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, A)],
  },
  {
    id: 'mirror-full-m', layer: 'accessory', name: '전신 방습거울 (남)', note: `${mirror} (600X1,500)`, material: 'mirror', facing: [0, 1],
    remark: '조적벽 남쪽 면에 있다. 폭은 표기 600을 따랐다(도면 선 x 2937.7 ~ 3074.7, 599). 도면의 거울 선(y 1932 ~ 1935)은 벽 선(y 1926.4)에서 약 30 떨어져 있다. 모델은 벽 면에 붙였다. 하단 높이는 가정값이다.',
    shapes: [box(6074, BRICK.y1, 6674, BRICK.y1 + 5, 300, 1800)],
    dims: [dim('폭', 600, 'drawn'), dim('높이', 1500, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 300, A)],
  },
  {
    id: 'mirror-basin-f', layer: 'accessory', name: '세면대 방습거울 (여)', note: `${mirror} (1,500X1,000)`, material: 'mirror', facing: [-1, 0],
    remark: '중앙 벽면에 세면대 칸막이벽에서 중간 벽까지(1,500) 걸린다. 주기의 지시선 하나에 화살표가 2개 있다. 여 쪽 벽면(x 2296)과 남 쪽 벽면(x 2346)을 가리킨다. 그래서 여·남 거울에 같은 주기를 달았다. 하단 높이는 가정값이다.',
    shapes: [box(C_W - 5, CAP.y1, C_W, MID.y0, 1000, 2000)],
    dims: [dim('폭', 1500, 'drawn'), dim('높이', 1000, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 1000, A)],
  },
  {
    id: 'mirror-basin-m', layer: 'accessory', name: '세면대 방습거울 (남)', note: `${mirror} (1,500X1,000)`, material: 'mirror', facing: [1, 0],
    remark: '중앙 벽면에 세면대 칸막이벽에서 중간 벽까지(1,500) 걸린다. 여 쪽 주기의 지시선 끝 화살표가 남 쪽 벽면(x 2346)을 가리킨다. 도면의 벽면 선도 여 쪽처럼 굵다(w8). 하단 높이는 가정값이다.',
    shapes: [box(C_E, CAP.y1, C_E + 5, MID.y0, 1000, 2000)],
    dims: [dim('폭', 1500, 'drawn'), dim('높이', 1000, 'drawn'), dim('두께', 5, 'drawn'), dim('하단 높이', 1000, A)],
  },
  {
    id: 'counter-f', layer: 'accessory', name: '세면대 상판 (여)', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(x 2158 ~ 2158.5의 가는 실선)이다. 도면의 중앙 벽 면 선(x 2299.5 ~ 2300.5)에서 141 ~ 142.5px(618 ~ 623) 떨어져 있다. 모델은 벽면에서 618이다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      { type: 'plate', x0: COUNTER_X.f, y0: CAP.y1, x1: C_W, y1: MID.y0, z0: COUNTER - 20, z1: COUNTER, holes: BASIN_YS.map((cy) => ({ cx: BASIN_X.f, cy, r: 215 })) },
      box(C_W - 15, CAP.y1, C_W, MID.y0, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 1500, 'drawn'), dim('깊이', 618, 'scaled'), dim('윗면 높이', COUNTER, A), dim('두께', 20, A)],
  },
  {
    id: 'counter-m', layer: 'accessory', name: '세면대 상판 (남)', material: 'marble',
    remark: '평면 범위는 도면의 상판 앞 선(x 2490의 가는 실선)이다. 벽면에서 627 떨어져 있다. 도면에 주기는 없다. 높이, 두께, 재질, 뒷턱, 세면기 구멍은 가정이다.',
    shapes: [
      { type: 'plate', x0: C_E, y0: CAP.y1, x1: COUNTER_X.m, y1: MID.y0, z0: COUNTER - 20, z1: COUNTER, holes: BASIN_YS.map((cy) => ({ cx: BASIN_X.m, cy, r: 215 })) },
      box(C_E, CAP.y1, C_E + 15, MID.y0, COUNTER, COUNTER + 100),
    ],
    dims: [dim('길이', 1500, 'drawn'), dim('깊이', 627, 'scaled'), dim('윗면 높이', COUNTER, A), dim('두께', 20, A)],
  },
  {
    id: 'partition-under-basin-f', layer: 'partition', name: '세면대 하부 칸막이 (여)', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: `도면에서 상판 앞 선 남쪽 끝의 점선 1개(x 2159, y 2128 ~ 2243, 약 503)만 판독된다. 폭은 표기 500을 따랐다. ${underBasinYRemark}`,
    shapes: [box(COUNTER_X.f, MID.y0 - 500, COUNTER_X.f + PT, MID.y0, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('두께', PT, 'drawn')],
  },
  {
    id: 'partition-under-basin-m', layer: 'partition', name: '세면대 하부 칸막이 (남)', note: '세면대 하부 12mm 지정칸막이설치 (500x800)',
    remark: `도면에서 상판 앞 선 남쪽 끝의 점선 1개(x 2487 ~ 2488, y 2128 ~ 2243, 약 503)만 판독된다. 점선은 상판 앞 선(x 2490)보다 약 2.5px 안쪽이다. 중심은 도면의 중앙 벽 면 선(x 2347)에서 점선까지 140.5px(614)를 모델 벽면에서 띄운 X 4,117이다(다른 중앙 벽면 품목과 같은 기준). 전역 환산으로는 4,106이다. 폭은 표기 500을 따랐다. ${underBasinYRemark}`,
    shapes: [box(UNDER_BASIN_M_X - PT / 2, MID.y0 - 500, UNDER_BASIN_M_X + PT / 2, MID.y0, 0, 800)],
    dims: [dim('폭', 500, 'drawn'), dim('높이', 800, 'drawn'), dim('두께', PT, 'drawn')],
  },
  // 유리선반. 여는 칸의 북서 모서리(외벽과 북쪽 칸막이), 남은 칸의 남동 모서리(외벽과 남쪽 칸막이)에 있다.
  ...STALLS.map((s) => glassShelf(`f${s.n}`, W_IN, s.n === 1 ? N_IN : s.north + PT / 2, 0, 300, s.n === 3 ? glassShelfText : { remark: shelfRemark })),
  ...STALLS.map((s) => glassShelf(`m${s.n}`, E_IN, s.n === 4 ? BRICK.y0 : [PART_A, PART_B, PART_C][s.n - 1] - PT / 2, 180, 300, s.n === 2 ? glassShelfText : { remark: shelfRemark })),
  // 가방걸이. 경첩에서의 거리는 여 약 288(기호 x 1825), 남 약 284(기호 x 2902)다. 주기 지시선은 여 칸 3, 남 칸 1과 3의 기호를 가리킨다.
  ...STALLS.map((s) => stallHook(`f${s.n}`, FRONT_F, s.hF, 180, -1, 288, s.n === 3 ? hookNote : hookPlain)),
  ...STALLS.map((s) => stallHook(`m${s.n}`, FRONT_M, s.hM, 0, 1, 284, s.n === 1 || s.n === 3 ? hookNote : hookPlain)),
  {
    id: 'threshold-f', layer: 'accessory', name: '화강석 재료분리대 (여)', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치다. 점묘는 출입문 문틀 블록 2개 사이(x 1891.5 ~ 2117.7)에만 있다. 모델은 경첩 쪽 블록 끝(X 1,502)에서 손잡이 쪽 블록(X 2,498)까지다. 북쪽 선(y 2547 ~ 2549)은 개구 전체에 그어져 있다. 폭은 표기 150을 따랐다(선 140 ~ 153). 두께 30은 석재 두께다. 노출 높이는 10으로 가정했다.',
    shapes: [box(ENTRANCE.f.hx - 21, S_OUT - 150, DOOR_F.x1 - 52, S_OUT, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', DOOR_F.x1 - 52 - (ENTRANCE.f.hx - 21), 'scaled'), dim('노출 높이', 10, A)],
  },
  {
    id: 'threshold-m', layer: 'accessory', name: '화강석 재료분리대 (남)', note: 'THK30 화강석 재료분리대 설치 (W=150)', material: 'granite',
    remark: '범위는 도면의 점묘 해치다. 점묘는 출입문 문틀 블록 2개 사이(x 2624.0 ~ 2852.1)에만 있다. 모델은 손잡이 쪽 블록(X 4,702)에서 경첩 쪽 블록 끝(X 5,708)까지다. 폭은 표기 150을 따랐다(선 146). 두께 30은 석재 두께다. 노출 높이는 10으로 가정했다.',
    shapes: [box(DOOR_M.x0 + 54, S_OUT - 150, ENTRANCE.m.hx + 21, S_OUT, 0, 10)],
    dims: [dim('폭', 150, 'drawn'), dim('두께', 30, 'drawn'), dim('길이', ENTRANCE.m.hx + 21 - (DOOR_M.x0 + 54), 'scaled'), dim('노출 높이', 10, A)],
  },
  {
    id: 'tactile-blocks-f', layer: 'accessory', name: '점형블럭 2EA (여)', note: '점형블럭 2EA (매립형)', material: 'tactile',
    remark: '서쪽 블록에는 300 치수가 인쇄돼 있지 않다(장에 인쇄된 300은 남 블록 옆 하나다). 위치는 선 위치(외곽 x 2130 ~ 2268, y 2649.4 ~ 2716.6, 가운데 나눔 선 x 2198.5)의 환산값이다.',
    shapes: [box(2544, 7306, 2841, 7600, 0, 5), box(2845, 7306, 3145, 7600, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('벽에서의 거리', 305, 'scaled'), dim('1장 크기', '약 300 x 294', 'scaled')],
  },
  {
    id: 'tactile-blocks-m', layer: 'accessory', name: '점형블럭 2EA (남)', note: '점형블럭 2EA (매립형)', material: 'tactile',
    remark: '벽에서의 거리는 표기 300을 따랐다(선 302). 외곽 x 2476.5 ~ 2611.5, 가운데 나눔 선 x 2543.9의 환산값이다.',
    shapes: [box(4061, S_OUT + 300, 4351, 7597, 0, 5), box(4355, S_OUT + 300, 4649, 7597, 0, 5)],
    dims: [dim('수량', '2EA', 'drawn'), dim('벽에서의 거리', 300, 'drawn'), dim('1장 크기', '약 292 x 296', 'scaled')],
  },
  {
    id: 'braille-sign-f', layer: 'accessory', name: '점자표지판 (여)', note: '벽면점자표지판설치',
    material: 'metal',
    remark: '수채기실 남측 벽 바깥 면의 굵은 선(x 2188 ~ 2211, 폭 약 100)이다. 설치 높이와 세로 크기는 가정값이다.',
    shapes: [box(2797, S_OUT, 2898, S_OUT + 22, 1400, 1550)],
    dims: [dim('폭', 101, 'scaled'), dim('설치 높이', 1400, A)],
  },
  {
    id: 'braille-sign-m', layer: 'accessory', name: '점자표지판 (남)', note: '벽면점자표지판설치', material: 'metal',
    remark: '작은 실 남측 벽 바깥 면의 굵은 선(x 2533 ~ 2555, 폭 약 96)이다. 설치 높이와 세로 크기는 가정값이다.',
    shapes: [box(4305, S_OUT, 4401, S_OUT + 22, 1400, 1550)],
    dims: [dim('폭', 96, 'scaled'), dim('설치 높이', 1400, A)],
  },
];

// 코너 비드. 도면의 「코너 비드 설치」 지시선 원 14개가 가리키는 벽 모서리에 붙였다. 출입문 개구 옆의 비드는 개구 높이(HEAD)까지다.
const winBeadRemark = '위치는 도면의 지시선이 가리키는 벽 모서리(창 문설주와 북측 벽 안쪽 면)다. 창대 아래는 창 구간 벽(안쪽 면 Y 0)이 모서리 앞을 덮어 모서리가 없다. 창 문설주 모서리는 천장 위 커텐박스 홈 안에서 창 위 면(2,600)까지 이어진다. 그래서 창대(1,200, 가정)에서 창 위 면(천장고 + 상세도 150)까지 두었다. 폭과 두께는 가정값이다.';
const cornerBeads: Item[] = [
  cornerBead(1, '여 창 서쪽 모서리', cornerBeadWings(WIN_F.x0, N_IN, 1, 1, WIN_TOP, SILL), { remark: winBeadRemark }),
  cornerBead(2, '여 창 동쪽 모서리', cornerBeadWings(WIN_F.x1, N_IN, -1, 1, WIN_TOP, SILL), { remark: winBeadRemark }),
  cornerBead(3, '창 사이 기둥 남서 모서리', cornerBeadWings(PIER.x0, PIER.y1, -1, 1, CH)),
  cornerBead(4, '남 창 동쪽 모서리', cornerBeadWings(WIN_M.x1, N_IN, -1, 1, WIN_TOP, SILL), { remark: winBeadRemark }),
  cornerBead(5, '여 조적벽 북동 모서리', cornerBeadWings(BRICK_F_X1, BRICK.y0, 1, -1, CH)),
  cornerBead(6, '여 조적벽 남동 모서리', cornerBeadWings(BRICK_F_X1, BRICK.y1, 1, 1, CH)),
  cornerBead(7, '남 조적벽 북서 모서리', cornerBeadWings(BRICK_M_X0, BRICK.y0, -1, -1, CH)),
  cornerBead(8, '남 조적벽 남서 모서리', cornerBeadWings(BRICK_M_X0, BRICK.y1, -1, 1, CH)),
  cornerBead(9, '여 중간 벽 북서 모서리', cornerBeadWings(MID_F_X0, MID.y0, -1, -1, CH)),
  cornerBead(10, '여 중간 벽 남서 모서리', cornerBeadWings(MID_F_X0, MID.y1, -1, 1, CH)),
  cornerBead(11, '남 중간 벽 북동 모서리', cornerBeadWings(MID_M_X1, MID.y0, 1, -1, CH)),
  cornerBead(12, '남 중간 벽 남동 모서리', cornerBeadWings(MID_M_X1, MID.y1, 1, 1, CH)),
  cornerBead(13, '여 남측 벽 동쪽 끝 (출입문 옆)', cornerBeadWings(DOOR_F.x0, S_IN, 1, -1, HEAD), { remark: '위치는 도면의 지시선이 가리키는 벽 모서리다. 출입문 개구 옆이라서 높이를 개구 상단(2,100, 가정)까지로 두었다. 폭과 두께는 가정값이다.' }),
  cornerBead(14, '남 남측 벽 서쪽 끝 (출입문 옆)', cornerBeadWings(DOOR_M.x1, S_IN, -1, -1, HEAD), { remark: '위치는 도면의 지시선이 가리키는 벽 모서리다. 출입문 개구 옆이라서 높이를 개구 상단(2,100, 가정)까지로 두었다. 폭과 두께는 가정값이다.' }),
];

const lightRemark = '도면에 손으로 적은 「조명」과 형광펜 위치다. 기구 종류와 설치 높이는 도면에 없다. 천장면에 위치만 표시했다. 실사 모드는 이 위치에 광원을 놓는다.';

const lights: Item[] = [
  {
    id: 'light-shelf-f', layer: 'light', name: '조명 표시 (여 선반·거울 구간)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1.6 },
    shapes: [box(3000, 2420, 3250, 3720, CH - 40, CH)],
    dims: [dim('표시 구간 길이', 1300, 'scaled')],
  },
  {
    id: 'light-mop', layer: 'light', name: '조명 표시 (수채기실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 2816, cy: 6237, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '형광펜 중심', 'scaled')],
  },
  {
    id: 'light-small', layer: 'light', name: '조명 표시 (작은 실)', note: '손글씨 「조명」', remark: lightRemark,
    lamp: { power: 1 },
    shapes: [{ type: 'cylinder', cx: 4144, cy: 6316, rx: 120, ry: 120, z0: CH - 40, z1: CH }],
    dims: [dim('위치', '형광펜 중심', 'scaled')],
  },
];

const floorNote = '바닥 : 기존 바닥타일 / 고와스방수 / THK90 몰탈 / T10 포세린타일(600×600)';
const panRemark = '주 배수구(Ø75 F.D)로 모이는 가는 대각선 4개에 화살표가 있다(X 표시). 바닥 구배 표시로 보고 배수구 쪽으로 기울게 그렸다. 구배 깊이는 도면에 없다. 가정이다.';
const basinPanRemark = '세면 구역 배수구(Ø75 F.D)로 향하는 화살표 2개가 있다(여는 서쪽에서, 남은 동쪽에서). 바닥 구배 표시로 보고 배수구 쪽으로 기울게 그렸다(작성자 선택). 구배 깊이는 도면에 없다. 가정이다.';
const gridF = '줄눈 위치는 여 실의 타일 나누기 선 교점(x 1982.3, y 1146.5 → X 1,899, Y 736)에서 600 간격이다(모델의 tileOrigin).';
const gridM = '줄눈 위치는 남 실의 타일 나누기 선 교점(x 2616.3, y 1145.4 → X 4,670, Y 731)에서 600 간격이다(품목의 tileOrigin). 남 실의 세로선은 여 실과 시작점이 다르다.';
/** 남 실 바닥 600 격자의 교점 */
const TILE_M: [number, number] = [4670, 731];
const vestNote = '기존 바닥 / 고와스 / 몰탈 / 포세린타일(600X600) 시공';
const wallNote = '벽 : 기존 벽타일 / T10 포세린타일(600×600) 본드 부착';
const wallRemark = '벽의 안쪽 면에 얇은 면(3mm)을 붙여 그렸다. 도면의 마감선은 벽 선에서 약 20mm 안쪽이다. 줄눈 위치, 색, 무늬는 도면에 없다. 가정이다.';

// 마감. 도면 좌상단 「지상2층 연구동 화장실 마감 변경부분」 표와 평면의 주기를 따랐다. 실사 모드에서만 그린다.
const finishes: Item[] = [
  {
    id: 'floor-f', layer: 'finish', name: '바닥 마감 (화장실 여)', material: 'floorTile', note: floorNote,
    remark: `${panRemark} 여 화장실에는 평면의 바닥 주기가 없다. 마감 표의 바닥을 따랐다. ${gridF}`,
    shapes: [{ type: 'pan', x0: W_IN, y0: N_IN, x1: C_W, y1: BRICK.y0, z: 0, drop: 10, cx: 2203, cy: 2232 }],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이 (배수구)', 10, A)],
  },
  {
    id: 'floor-m', layer: 'finish', name: '바닥 마감 (화장실 남)', material: 'floorTile', note: floorNote, tileOrigin: TILE_M,
    remark: `${panRemark} ${gridM}`,
    shapes: [{ type: 'pan', x0: C_E, y0: N_IN, x1: E_IN, y1: BRICK.y0, z: 0, drop: 10, cx: 4976, cy: 2227 }],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이 (배수구)', 10, A)],
  },
  {
    id: 'floor-basin-f', layer: 'finish', name: '바닥 마감 (세면 구역 여)', material: 'floorTile', note: floorNote,
    remark: `${basinPanRemark} 여 세면 구역에는 평면의 바닥 주기가 없다. 마감 표의 바닥을 따랐다. ${gridF}`,
    shapes: [{ type: 'pan', x0: W_IN, y0: BRICK.y0, x1: C_W, y1: MID.y0, z: 0, drop: 10, cx: 2807, cy: 4830 }],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이 (배수구)', 10, A)],
  },
  {
    id: 'floor-basin-m', layer: 'finish', name: '바닥 마감 (세면 구역 남)', material: 'floorTile', note: floorNote, tileOrigin: TILE_M,
    remark: `${basinPanRemark} 평면의 주기 「기존 바닥타일 / 고와스 / 몰탈 / 포세린타일(600X600) 시공」이 남 세면 구역(x 2620, y 2117)을 가리킨다. ${gridM}`,
    shapes: [{ type: 'pan', x0: C_E, y0: BRICK.y0, x1: E_IN, y1: MID.y0, z: 0, drop: 10, cx: 3979, cy: 4829 }],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn'), dim('구배 깊이 (배수구)', 10, A)],
  },
  {
    id: 'floor-south-f', layer: 'finish', name: '바닥 마감 (남쪽 통로 여)', material: 'floorTile', note: floorNote,
    remark: `중간 벽 서쪽 끝과 서측 벽 사이, 「+」 구역 서쪽 경계(x 1862.5, X 1,375)의 서쪽이다. 해치와 주기가 없다. 마감 표의 바닥과 같다고 보았다. 평탄하게 그렸다. ${gridF}`,
    shapes: [box(W_IN, MID.y0, MID_F_X0, MID.y1, -10, 0), box(W_IN, MID.y1, PLUS_F_X0, S_IN, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn')],
  },
  {
    id: 'floor-south-m', layer: 'finish', name: '바닥 마감 (남쪽 통로 남)', material: 'floorTile', note: floorNote, tileOrigin: TILE_M,
    remark: `중간 벽 동쪽 끝과 동측 벽 사이, 「+」 구역 동쪽 경계(x 2885, X 5,844)의 동쪽이다. 해치와 주기가 없다. 마감 표의 바닥과 같다고 보았다. 평탄하게 그렸다. ${gridM}`,
    shapes: [box(MID_M_X1, MID.y0, E_IN, MID.y1, -10, 0), box(PLUS_M_X1, MID.y1, E_IN, S_IN, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn')],
  },
  {
    id: 'floor-vestibule-f', layer: 'finish', name: '바닥 마감 (「+」 구역 여)', material: 'floorTile', note: vestNote,
    remark: `도면의 「+」 해치 범위다. 경계는 서쪽 점선 x 1862.5(X 1,375), 북쪽 중간 벽 남쪽 면, 동쪽 수채기실 서측 벽, 남쪽 남측 벽이다. 출입문 개구에서는 재료분리대 북쪽 끝까지 이어진다. 주기의 지시선 점이 이 구역(x 2007, y 2383)에 있다. 색과 무늬는 도면에 없다. 가정이다. ${gridF}`,
    shapes: [box(PLUS_F_X0, MID.y1, MOP_W.x0, S_IN, -10, 0), box(DOOR_F.x0, S_IN, DOOR_F.x1, S_OUT - 150, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn')],
  },
  {
    id: 'floor-vestibule-m', layer: 'finish', name: '바닥 마감 (「+」 구역 남)', material: 'floorTile', note: vestNote, tileOrigin: TILE_M,
    remark: `도면의 「+」 해치 범위다. 경계는 서쪽 작은 실 동측 벽, 북쪽 중간 벽 남쪽 면, 동쪽 점선 x 2885(X 5,844), 남쪽 남측 벽이다. 출입문 개구에서는 재료분리대 북쪽 끝까지 이어진다. 주기의 지시선 점이 이 구역(x 2680, y 2375)에 있다. 색과 무늬는 도면에 없다. 가정이다. ${gridM}`,
    shapes: [box(SMALL_E.x1, MID.y1, PLUS_M_X1, S_IN, -10, 0), box(DOOR_M.x0, S_IN, DOOR_M.x1, S_OUT - 150, -10, 0)],
    dims: [dim('타일 크기', '600 x 600', 'drawn')],
  },
  {
    id: 'floor-mop', layer: 'finish', name: '바닥 마감 (수채기실)', material: 'smallTile', note: '기존 바닥 / 고와스 / THK.6 자기질 타일(200X200) 부착',
    remark: '주기는 작은 실 안에 적혀 있고 지시선이 수채기실(x 2310, y 2335)을 가리킨다. 도면에 200 타일 나누기 선이 판독되지 않는다. 줄눈 위치와 색은 가정이다.',
    shapes: [box(MOP_W.x1, MID.y1, LOW_C.x0, S_SMALL, -6, 0)],
    dims: [dim('타일 크기', '200 x 200', 'drawn'), dim('타일 두께', 6, 'drawn')],
  },
  {
    id: 'floor-small', layer: 'finish', name: '바닥 마감 (작은 실)', material: 'smallTile',
    remark: '실명과 마감 주기가 없다. 수채기실과 같은 타일로 가정했다.',
    shapes: [box(LOW_C.x1, MID.y1, SMALL_E.x0, S_SMALL, -6, 0)],
    dims: [dim('타일 크기', '200 x 200', A)],
  },
  {
    id: 'wall-finish-f', layer: 'finish', name: '벽 마감 (화장실 여)', material: 'wall', note: wallNote, remark: wallRemark,
    shapes: [
      // 서측 벽, 북측 벽(대변기 칸 구간), 창 구간(창대 아래), 창 동쪽 벽
      box(W_IN, N_IN, W_IN + 3, S_IN, 0, CH), box(W_IN, N_IN, WIN_F.x0, N_IN + 3, 0, CH),
      box(WIN_F.x0, 0, WIN_F.x1, 3, 0, SILL - 20), box(WIN_F.x1, N_IN, PIER.x0, N_IN + 3, 0, CH),
      // 창대 아래 벽이 대변기 칸 구간 벽 면보다 50 나온 꺾임 면 (서쪽 끝 서향, 동쪽 끝 동향)
      box(WIN_F.x0 - 3, N_IN + 3, WIN_F.x0, 3, 0, SILL - 20), box(WIN_F.x1, N_IN + 3, WIN_F.x1 + 3, 3, 0, SILL - 20),
      // 커텐박스 홈의 뒤 면(창 폭 밖)과 창 문설주 면(창대 ~ 창 위 면, 창틀 안쪽 면 Y −200 ~ 벽 면)
      box(POCKET_F.x0, N_IN, WIN_F.x0, N_IN + 3, CH, WIN_TOP), box(WIN_F.x1, N_IN, POCKET_F.x1, N_IN + 3, CH, WIN_TOP),
      box(WIN_F.x0, CURTAIN.y, WIN_F.x0 + 3, N_IN, SILL, WIN_TOP), box(WIN_F.x1 - 3, CURTAIN.y, WIN_F.x1, N_IN, SILL, WIN_TOP),
      // 창 사이 기둥, 중앙 벽
      box(PIER.x0 - 3, N_IN, PIER.x0, PIER.y1, 0, CH), box(PIER.x0, PIER.y1, C_W, PIER.y1 + 3, 0, CH), box(C_W - 3, PIER.y1 + 3, C_W, MID.y0, 0, CH),
      // 조적벽 세 면
      box(W_IN, BRICK.y0 - 3, BRICK_F_X1, BRICK.y0, 0, CH), box(W_IN, BRICK.y1, BRICK_F_X1, BRICK.y1 + 3, 0, CH), box(BRICK_F_X1, BRICK.y0, BRICK_F_X1 + 3, BRICK.y1, 0, CH),
      // 중간 벽 세 면, 남측 벽, 수채기실 서측 벽의 바깥 면(문 개구 둘레)
      box(MID_F_X0, MID.y0 - 3, C_W, MID.y0, 0, CH), box(MID_F_X0, MID.y1, MOP_W.x0, MID.y1 + 3, 0, CH), box(MID_F_X0 - 3, MID.y0, MID_F_X0, MID.y1, 0, CH),
      box(W_IN, S_IN - 3, DOOR_F.x0, S_IN, 0, CH),
      box(MOP_W.x0 - 3, MID.y1, MOP_W.x0, MOP_OPEN.y0, 0, CH), box(MOP_W.x0 - 3, MOP_OPEN.y1, MOP_W.x0, S_IN, 0, CH), box(MOP_W.x0 - 3, MOP_OPEN.y0, MOP_W.x0, MOP_OPEN.y1, HEAD, CH),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'wall-finish-m', layer: 'finish', name: '벽 마감 (화장실 남)', material: 'wall', note: wallNote, remark: wallRemark,
    shapes: [
      // 동측 벽, 북측 벽(대변기 칸 구간), 창 구간(창대 아래, 소변기 뒤 띠의 동쪽 면부터), 중앙 벽(소변기 뒤 띠 위)
      box(E_IN - 3, N_IN, E_IN, S_IN, 0, CH), box(WIN_M.x1, N_IN, E_IN, N_IN + 3, 0, CH),
      box(C_E + CHASE_D, 0, WIN_M.x1, 3, 0, SILL - 20), box(C_E, 0, C_E + 3, MID.y0, 0, CH),
      // 소변기 뒤 띠 두겁돌 위의 창대 아래 벽 면, 창대 아래 벽 동쪽 끝의 꺾임 면(동향), 창 서쪽의 중앙 벽 동쪽 면(창대 ~ 천장)
      box(C_E + 3, 0, C_E + CHASE_D, 3, CHASE_H + 20, SILL - 20), box(WIN_M.x1, N_IN + 3, WIN_M.x1 + 3, 3, 0, SILL - 20),
      box(C_E, N_IN, C_E + 3, 0, SILL, CH),
      // 커텐박스 홈의 뒤 면(창 폭 밖)과 창 문설주 면(창대 ~ 창 위 면, 창틀 안쪽 면 Y −200 ~ 벽 면). 홈 서쪽 끝의 벽 마감 두께(Y −50 ~ −47)도 막는다.
      box(WIN_M.x1, N_IN, POCKET_M.x1, N_IN + 3, CH, WIN_TOP), box(C_E, N_IN, C_E + 3, N_IN + 3, CH, WIN_TOP),
      box(WIN_M.x0, CURTAIN.y, WIN_M.x0 + 3, N_IN, SILL, WIN_TOP), box(WIN_M.x1 - 3, CURTAIN.y, WIN_M.x1, N_IN, SILL, WIN_TOP),
      // 남 「+」 구역(천장고 2,800)을 둘러싼 벽 면의 2,450 ~ 2,800 띠
      box(SMALL_E.x1, ZONE_M.y0, SMALL_E.x1 + 3, ZONE_M.y1, CH, CH_PLUS_M), box(ZONE_M.x0, MID.y1, MID_M_X1, MID.y1 + 3, CH, CH_PLUS_M),
      box(ZONE_M.x0, S_IN - 3, ZONE_M.x1, S_IN, CH, CH_PLUS_M),
      // 조적벽 세 면
      box(BRICK_M_X0, BRICK.y0 - 3, E_IN, BRICK.y0, 0, CH), box(BRICK_M_X0, BRICK.y1, E_IN, BRICK.y1 + 3, 0, CH), box(BRICK_M_X0 - 3, BRICK.y0, BRICK_M_X0, BRICK.y1, 0, CH),
      // 중간 벽 세 면, 남측 벽, 작은 실 동측 벽의 바깥 면(점검구 개구 둘레)
      box(C_E, MID.y0 - 3, MID_M_X1, MID.y0, 0, CH), box(SMALL_E.x1, MID.y1, MID_M_X1, MID.y1 + 3, 0, CH), box(MID_M_X1, MID.y0, MID_M_X1 + 3, MID.y1, 0, CH),
      box(DOOR_M.x1, S_IN - 3, E_IN, S_IN, 0, CH),
      box(SMALL_E.x1, MID.y1, SMALL_E.x1 + 3, HATCH.y0, 0, CH), box(SMALL_E.x1, HATCH.y1, SMALL_E.x1 + 3, S_IN, 0, CH), box(SMALL_E.x1, HATCH.y0, SMALL_E.x1 + 3, HATCH.y1, HATCH.h, CH),
    ],
    dims: [dim('타일 크기', '600 x 600', 'drawn'), dim('타일 두께', 10, 'drawn')],
  },
  {
    id: 'wall-finish-mop', layer: 'finish', name: '벽 마감 (수채기실)', material: 'wainscotTile',
    note: '벽체 : 도막방수(고와스, H=500) 위 THK.6 도기질타일 (H=1,200)',
    remark: '주기는 작은 실 안에 적혀 있고 지시선이 수채기실을 가리킨다. 타일 크기는 도면에 없다. 200 x 200으로 가정했다. 높이 1,200 위는 도장으로 가정했다. 서측 벽 면은 문 개구 둘레로 나눴다.',
    shapes: [
      box(MOP_W.x1, MID.y1, LOW_C.x0, MID.y1 + 6, 0, 1200), box(MOP_W.x1, S_SMALL - 6, LOW_C.x0, S_SMALL, 0, 1200),
      box(MOP_W.x1, MID.y1, MOP_W.x1 + 6, MOP_OPEN.y0, 0, 1200), box(MOP_W.x1, MOP_OPEN.y1, MOP_W.x1 + 6, S_SMALL, 0, 1200), box(LOW_C.x0 - 6, MID.y1, LOW_C.x0, S_SMALL, 0, 1200),
      box(MOP_W.x1, MID.y1, LOW_C.x0, MID.y1 + 3, 1200, CH, 'paint'), box(MOP_W.x1, S_SMALL - 3, LOW_C.x0, S_SMALL, 1200, CH, 'paint'),
      box(MOP_W.x1, MID.y1, MOP_W.x1 + 3, MOP_OPEN.y0, 1200, CH, 'paint'), box(MOP_W.x1, MOP_OPEN.y1, MOP_W.x1 + 3, S_SMALL, 1200, CH, 'paint'),
      box(MOP_W.x1, MOP_OPEN.y0, MOP_W.x1 + 3, MOP_OPEN.y1, HEAD, CH, 'paint'), box(LOW_C.x0 - 3, MID.y1, LOW_C.x0, S_SMALL, 1200, CH, 'paint'),
    ],
    dims: [dim('타일 높이', 1200, 'drawn'), dim('타일 두께', 6, 'drawn'), dim('타일 크기', '200 x 200', A)],
  },
  {
    id: 'ceiling', layer: 'finish', name: '천장 마감', material: 'ceiling',
    note: '천장 : 경량철골 천장틀위 금속재 흡음천장 (AL. 600각)',
    remark: '실내에서 볼 때만 그린다. 위에서 내려다볼 때는 그리지 않는다. 천장고 표기는 여 화장실, 남 화장실, 여 「+」 구역이 CH 2,450, 남 「+」 구역이 CH 2,800이다(「+」 해치 하나가 셋째 숫자 왼쪽 위에 겹친다. 300dpi 스캔과 PDF의 600dpi 글자 층 모두 위아래 고리가 닫힌 8이다). 남 「+」 구역(X 4,648 ~ 5,844, Y 5,702 ~ 6,800, 도면의 「+」 해치 범위)은 2,800에 따로 그렸다. 그 구역의 동쪽 점선과 북쪽 통로 쪽은 벽이 없다. 천장 단차의 수직 면(2,450 ~ 2,800)을 천장재로 막았다(가정). 창 위 커텐박스 홈(커텐박스 길이 × 북측 벽 ~ 갈바 판 Y 140)은 천장이 없다(「"A" 단면상세도」). 상세도에도 같은 주기 「금속 흡음천장」이 있다. 수채기실과 작은 실의 천장 마감과 천장고는 도면에 없다. 화장실과 같은 것으로 가정했다. 여·남 세면 구역과 여·남 남쪽 통로(「+」 구역 바깥)에도 CH 표기가 없다. 천장고 2,450은 가정이다. 패널 나누기 위치도 가정이다.',
    shapes: [
      // 북쪽 띠(커텐박스 홈 2곳을 뺀다)
      box(-372, N_OUT, POCKET_F.x0, POCKET_Y1, CH, CH + 30), box(POCKET_F.x1, N_OUT, POCKET_M.x0, POCKET_Y1, CH, CH + 30), box(POCKET_M.x1, N_OUT, 7448, POCKET_Y1, CH, CH + 30),
      box(-372, POCKET_Y1, 7448, ZONE_M.y0, CH, CH + 30),
      // 남 「+」 구역 높이의 띠(그 구역을 뺀다)
      box(-372, ZONE_M.y0, ZONE_M.x0, ZONE_M.y1, CH, CH + 30), box(ZONE_M.x1, ZONE_M.y0, 7448, ZONE_M.y1, CH, CH + 30),
      box(-372, ZONE_M.y1, 7448, S_OUT, CH, CH + 30),
      // 남 「+」 구역 천장과 단차 수직 면(동쪽 점선, 북쪽 통로)
      box(ZONE_M.x0, ZONE_M.y0, ZONE_M.x1, ZONE_M.y1, CH_PLUS_M, CH_PLUS_M + 30),
      box(ZONE_M.x1, ZONE_M.y0, ZONE_M.x1 + 20, ZONE_M.y1, CH, CH_PLUS_M), box(MID_M_X1, ZONE_M.y0 - 20, ZONE_M.x1 + 20, ZONE_M.y0, CH, CH_PLUS_M),
    ],
    dims: [dim('천장고', CH, 'drawn'), dim('남 「+」 구역 천장고', CH_PLUS_M, 'drawn'), dim('패널 크기', '600 x 600', 'drawn'), dim('천장 단차 수직 면', '2,450 ~ 2,800', 'assumed')],
  },
];

export const research2fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [1548, 978.1],
  mmPerPx: 4.371,
};

export const research2fModel: SheetModel = {
  ceilingHeight: CH,
  // 모델 범위: 둘러싼 벽의 바깥 면(북서 모서리 기둥 −372, 북측 −351, 북동 모서리 기둥 7,448, 남측 7,001)이다.
  bounds: { x0: -372, y0: N_OUT, x1: 7448, y1: S_OUT },
  // 여 세면 구역에서 조적벽과 세면대 칸막이벽 사이 통로로 북쪽(대변기 칸 앞 통로)을 본다.
  eye: { from: [2150, 5300, 1600], to: [1900, 800, 1100] },
  // 남동쪽에서 본다.
  isoDir: [1, 1],
  // 창은 북측 벽에 있다. 자연광은 북쪽에서 남쪽으로 들어온다.
  daylightDir: [0.2, 1],
  // 줄눈 시작점. 바닥 600 격자는 여 실의 교점이다. 남 실의 바닥 품목은 남 실 교점을 품목의 tileOrigin으로 따로 준다.
  tileOrigin: { floorTile: [1899, 736] },
  items: [...walls, ...lowWalls, ...partitions, ...doors, ...fixtures, ...accessories, ...cornerBeads, ...lights, ...finishes],
  // 치수선 위치는 도면의 치수선 위치와 같다.
  dimLines: [
    // 위
    { from: [0, -2510], to: [7200, -2510], label: '7,200' },
    { from: [0, -2309], to: [3400, -2309], label: '3,400' },
    { from: [3400, -2309], to: [7200, -2309], label: '3,800' },
    // 아래
    { from: [0, 8980], to: [2600, 8980], label: '2,600' },
    { from: [2600, 8980], to: [3500, 8980], label: '900' },
    { from: [3500, 8980], to: [4600, 8980], label: '1,100' },
    { from: [4600, 8980], to: [7200, 8980], label: '2,600' },
    { from: [0, 9179], to: [3400, 9179], label: '3,400' },
    { from: [3400, 9179], to: [7200, 9179], label: '3,800' },
    { from: [0, 9378], to: [7200, 9378], label: '7,200' },
    // 왼쪽
    { from: [-3182, 0], to: [-3182, 6900], label: '6,900' },
    { from: [-2983, 0], to: [-2983, 4095], label: '4,095' },
    { from: [-2983, 4095], to: [-2983, 6900], label: '2,805' },
    { from: [-2774, 4095], to: [-2774, 5625], label: '1,530' },
    { from: [-2774, 5625], to: [-2774, 6900], label: '1,275' },
    // 오른쪽
    { from: [10375, 0], to: [10375, 6900], label: '6,900' },
    { from: [10178, 0], to: [10178, 4095], label: '4,095' },
    { from: [10178, 4095], to: [10178, 6900], label: '2,805' },
    // 여 대변기 칸
    { from: [1099, N_FIN], to: [1099, PART_A], label: '1,008' },
    { from: [1099, PART_A], to: [1099, PART_B], label: '1,014' },
    { from: [1099, PART_B], to: [1099, PART_C], label: '1,014' },
    { from: [1099, PART_C], to: [1099, BRICK_FIN], label: '1,008' },
    { from: [W_FIN, 3916], to: [W_FIN + 1400, 3916], label: '1,400' },
    // 남 대변기 칸
    { from: [6087, N_FIN], to: [6087, PART_A], label: '1,008' },
    { from: [6087, PART_A], to: [6087, PART_B], label: '1,014' },
    { from: [6087, PART_B], to: [6087, PART_C], label: '1,014' },
    { from: [6087, PART_C], to: [6087, BRICK_FIN], label: '1,008' },
    { from: [E_FIN - 1450, 3907], to: [E_FIN, 3907], label: '1,450' },
    // 남 소변기
    { from: [4038, 945], to: [4038, 1920], label: '975' },
    { from: [4038, 1920], to: [4038, 2895], label: '975' },
    { from: [4038, 2895], to: [4038, CAP.y0], label: '975' },
    // 세면대
    { from: [C_W - C_FIN.f - 750, 4191], to: [C_W - C_FIN.f, 4191], label: '750' },
    { from: [C_E + C_FIN.m, 4191], to: [C_E + C_FIN.m + 750, 4191], label: '750' },
    { from: [2225, CAP.y1], to: [2225, MID.y0], label: '1,500' },
    { from: [4563, CAP.y1], to: [4563, MID.y0], label: '1,500' },
    // 점형블럭
    { from: [4227, S_OUT], to: [4227, S_OUT + 300], label: '300' },
  ],
  roomLabels: [
    { text: '화장실(여)', at: [2186, 1604] },
    { text: '화장실(남)', at: [4974, 1590] },
  ],
};
