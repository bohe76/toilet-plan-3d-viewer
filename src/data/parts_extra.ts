// 여러 탭이 함께 쓰는 부품의 추가분이다. 연구동 1층에서 처음 만들었다. 형식은 parts.ts 와 같다.
// 탭 데이터는 위치, 방향(Rot), 도면에서 잰 크기만 넘긴다. 부품 안에는 탭의 좌표를 넣지 않는다.
// 좌표 틀(벽 틀, 중심 틀, 문 틀)의 뜻은 parts.ts 머리말과 같다.
// 주기 원문(note), 실 이름이 들어간 name, 탭마다 다른 remark는 over로 준다.
// dims의 출처(drawn / scaled)는 연구동 1층 도면 기준이다. 다른 장에서 출처나 표기가 다르면 over.dims로 바꾼다.
import { GAP, HEAD, PT, SILL, place, type Rot } from './parts';
import { box, dim, tube } from './shape_helpers';
import type { Item, Shape } from './types';

/** parts.ts 의 Over에 dims를 더했다. dims는 표기 치수나 출처가 탭마다 다를 때만 준다. */
export type ExtraOver = Partial<Pick<Item, 'id' | 'name' | 'note' | 'remark' | 'dims'>>;

const A = 'assumed' as const;
const GRAB_Z = 650; // 장애인용 칸 손잡이 높이. 가정
const URINAL_GRAB_Z = 1150; // 장애인용 소변기 손잡이 높이. 가정
const BACKREST_Z = 750; // 등받이 높이. 가정
const STALL_H = 1950; // 칸막이 높이. 슬라이딩 도어도 따른다

/** 도면 근거 손잡이의 공통 remark. 탭에서 문장을 덧붙일 때 쓴다. */
export const GRAB_REMARK = '도면에 손잡이가 그려져 있다. 평면 위치와 길이는 도면 환산값이다. 높이와 굵기는 가정값이다.';

/**
 * 장애인용 칸 벽 손잡이(ㄷ자 봉). 벽 틀이다. (x, y)는 벽면 위의 봉 한쪽 끝이다. rot은 실내 쪽 방향이다.
 * depth는 벽면에서 봉 축까지, length는 벽을 따라간 길이다. side는 벽을 따라 뻗는 쪽이다(틀의 +y가 1, -y가 -1).
 */
export const wallGrabBar = (key: string | number, x: number, y: number, rot: Rot, side: 1 | -1, depth: number, length: number, over: ExtraOver = {}): Item => ({
  id: `grab-wall-${key}`, layer: 'accessory', name: `장애인용 칸 벽 손잡이 ${key}`, material: 'metal', remark: GRAB_REMARK,
  shapes: place([tube([[0, 0, GRAB_Z], [depth, 0, GRAB_Z], [depth, side * length, GRAB_Z], [0, side * length, GRAB_Z]], 16)], x, y, rot),
  dims: [dim('길이', length, 'scaled'), dim('벽에서 축까지', depth, 'scaled'), dim('높이', GRAB_Z, A)],
  ...over,
});

/** 장애인용 칸 접이식 손잡이(내린 상태). 벽 틀이다. (x, y)는 뒤 벽면의 봉 축 위 점이다. length는 벽면에서 봉 끝까지다. */
export const foldGrabBar = (key: string | number, x: number, y: number, rot: Rot, length: number, over: ExtraOver = {}): Item => ({
  id: `grab-fold-${key}`, layer: 'accessory', name: `장애인용 칸 접이식 손잡이 ${key}`, material: 'metal',
  remark: `${GRAB_REMARK} 뒤 벽에 달린 접이식으로 읽었다. 내린 상태로 그렸다.`,
  shapes: place([box(0, -56, 20, 56, GRAB_Z - 80, GRAB_Z + 80), tube([[20, 0, GRAB_Z], [length, 0, GRAB_Z]], 18)], x, y, rot),
  dims: [dim('길이', length, 'scaled'), dim('높이', GRAB_Z, A)],
  ...over,
});

/** 양변기 등받이(탱크를 감싸는 U자 봉). 벽 틀이다. (x, y)는 벽면 위의 U자 중심이다. width는 봉 축 사이, depth는 벽면에서 앞 봉 축까지다. */
export const backrest = (key: string | number, x: number, y: number, rot: Rot, width: number, depth: number, over: ExtraOver = {}): Item => ({
  id: `backrest-${key}`, layer: 'accessory', name: `등받이 ${key}`, material: 'metal',
  remark: '도면에 탱크를 감싸는 U자 선으로 그려져 있다. 평면 범위는 도면 환산값이다. 높이와 형상은 가정이다. U자 봉으로 그렸다.',
  shapes: place([tube([[0, width / 2, BACKREST_Z], [depth, width / 2, BACKREST_Z], [depth, -width / 2, BACKREST_Z], [0, -width / 2, BACKREST_Z]], 16)], x, y, rot),
  dims: [dim('폭', width, 'scaled'), dim('벽에서 나온 길이', depth, 'scaled'), dim('높이', BACKREST_Z, A)],
  ...over,
});

/** 비상벨(상·하 2개). 벽 틀이다. (x, y)는 벽면 위의 벨 중심이다. 위 벨은 750, 아래 벨은 200 높이에 둔다. */
export const emergencyBell = (key: string | number, x: number, y: number, rot: Rot, over: ExtraOver = {}): Item => ({
  id: `bell-${key}`, layer: 'accessory', name: `비상벨 ${key}`, material: 'white',
  remark: '도면의 한 위치에 상·하 2개를 단다. 위 벨은 표기 H600~900의 중간(750)에 두었다. 크기는 가정이다.',
  shapes: place([box(0, -40, 25, 40, 710, 790), box(0, -40, 25, 40, 160, 240)], x, y, rot),
  dims: [
    dim('수량', '상,하 2개소', 'drawn'), dim('위 벨 높이', '600~900', 'drawn'), dim('아래 벨 높이', 200, 'drawn'),
    rot === 0 || rot === 180 ? dim('위치 Y', y, 'scaled') : dim('위치 X', x, 'scaled'),
  ],
  ...over,
});

/** 영유아 거치대(접은 상태). 벽 틀이다. (x, y)는 벽면 위의 거치대 중심이다. width는 벽을 따라간 폭, depth는 벽에서 나온 길이다. */
export const babySeat = (key: string | number, x: number, y: number, rot: Rot, width: number, depth: number, over: ExtraOver = {}): Item => ({
  id: `baby-seat-${key}`, layer: 'accessory', name: `영유아 거치대 ${key}`, material: 'white',
  remark: '평면 범위는 도면 환산값이다(접은 상태). 높이는 가정값이다.',
  shapes: place([box(0, -width / 2, depth, width / 2, 800, 1300)], x, y, rot),
  dims: [dim('폭', width, 'scaled'), dim('깊이', depth, 'scaled'), dim('높이', '800 ~ 1,300', A)],
  ...over,
});

/**
 * 슬라이딩 도어(닫힌 상태). 문 틀이다. (x, y)는 문짝 한쪽 끝의 두께 중심이다. rot은 문짝이 뻗는 방향이다.
 * length는 문짝 길이, thickness는 두께, handleAt은 원점에서 손잡이 중심까지다. 손잡이는 양면에 단다. 높이는 칸막이 높이를 따른다.
 */
export const slidingDoor = (key: string | number, x: number, y: number, rot: Rot, length: number, thickness: number, handleAt: number, over: ExtraOver = {}): Item => {
  const off = thickness / 2 + 14;
  return {
    id: `door-slide-${key}`, layer: 'door', name: `슬라이딩 도어 ${key}`,
    remark: '도면은 문을 닫은 상태로 그렸다. 문짝 범위와 두께는 도면 환산값이다. 높이는 칸막이 높이를 따랐다(가정). 손잡이는 도면의 손잡이 기호 위치에 양면으로 달았다. 손잡이 높이와 형상은 가정이다.',
    shapes: place([
      box(0, -thickness / 2, length, thickness / 2, GAP, STALL_H),
      tube([[handleAt, off, 900], [handleAt, off, 1100]], 12, 'metal'),
      tube([[handleAt, -off, 900], [handleAt, -off, 1100]], 12, 'metal'),
    ], x, y, rot),
    dims: [dim('문짝 길이', length, 'scaled'), dim('두께', thickness, 'scaled'), dim('높이', STALL_H, A), dim('하부 틈', GAP, A)],
    ...over,
  };
};

/**
 * 장애인용 소변기 손잡이(좌우 봉 2개와 앞을 잇는 봉 1개). 벽 틀이다. (x, y)는 벽면 위의 좌우 봉 가운데 점이다.
 * depth는 벽면에서 봉 끝까지, spacing은 좌우 봉 축 사이, crossAt은 벽면에서 잇는 봉 축까지다.
 */
export const urinalGrabBar = (key: string | number, x: number, y: number, rot: Rot, depth: number, spacing: number, crossAt: number, over: ExtraOver = {}): Item => ({
  id: `grab-urinal-${key}`, layer: 'accessory', name: `장애인용 소변기 손잡이 ${key}`, material: 'metal',
  remark: `${GRAB_REMARK} 좌우 봉 2개와 그 위를 잇는 봉 1개가 그려져 있다.`,
  shapes: place([
    tube([[0, -spacing / 2, URINAL_GRAB_Z], [depth, -spacing / 2, URINAL_GRAB_Z]], 16),
    tube([[0, spacing / 2, URINAL_GRAB_Z], [depth, spacing / 2, URINAL_GRAB_Z]], 16),
    tube([[crossAt, -spacing / 2, URINAL_GRAB_Z], [crossAt, spacing / 2, URINAL_GRAB_Z]], 16),
  ], x, y, rot),
  dims: [dim('벽에서 나온 길이', depth, 'scaled'), dim('좌우 간격', spacing, 'scaled'), dim('높이', URINAL_GRAB_Z, A)],
  ...over,
});

/**
 * 소변기 칸막이(12mm 패널) 여러 장을 한 품목으로 만든다. 벽 틀이다. x는 벽면, ys는 칸막이 중심의 벽을 따라간 좌표다.
 * rot은 0 또는 180이다(남북으로 뻗는 벽). length는 벽에서 나온 길이, height는 패널 높이, z0은 하단 높이(가정)다.
 */
export const urinalScreens = (key: string | number, x: number, ys: number[], rot: 0 | 180, length = 450, height = 1250, z0 = 400, over: ExtraOver = {}): Item => ({
  id: `partition-urinal-${key}`, layer: 'partition', name: `소변기 칸막이 ${key}`,
  remark: `하단 높이는 도면에 없다. ${z0}으로 가정했다.`,
  shapes: ys.flatMap((y) => place([box(0, -PT / 2, length, PT / 2, z0, z0 + height)], x, y, rot)),
  dims: [
    dim('수량', `${ys.length}개소`, 'drawn'), dim('길이', length, 'drawn'), dim('높이', height, 'drawn'),
    ...(ys.length > 1 ? [dim('간격', Math.abs(ys[1] - ys[0]), 'drawn')] : []),
    dim('두께', PT, 'drawn'), dim('하단 높이', z0, A),
  ],
  ...over,
});

/**
 * 소변기 뒤 띠와 그 위의 THK20 두겁돌. 벽 틀이다. (x, y)는 벽면 위의 띠 시작점이다. 띠는 틀의 +y로 length만큼 뻗는다.
 * depth는 벽에서 나온 폭, height는 띠 높이(두겁돌 아래)다. gaps는 소변기 뒤판 자리의 중심(원점에서 틀 +y로 잰 거리)이고, 그 자리는 gapWidth만큼 비운다.
 */
export const urinalChase = (key: string | number, x: number, y: number, rot: Rot, length: number, depth: number, height: number, gaps: number[] = [], gapWidth = 436, over: ExtraOver = {}): Item => {
  const starts = [0, ...gaps.map((g) => g + gapWidth / 2)];
  const ends = [...gaps.map((g) => g - gapWidth / 2), length];
  return {
    id: `wall-chase-${key}`, layer: 'wall', name: `소변기 뒤 띠 ${key}`,
    remark: '높이는 도면에 없다. 가정이다.',
    shapes: place(starts.flatMap((s, i) => [box(0, s, depth, ends[i], 0, height), box(0, s, depth, ends[i], height, height + 20, 'granite')]), x, y, rot),
    dims: [dim('길이', length, 'scaled'), dim('폭', depth, 'scaled'), dim('두겁돌 두께', 20, 'drawn'), dim('높이', height, A)],
    ...over,
  };
};

/**
 * 0.5B 칸막이벽과 그 위의 두겁돌(THK20). 벽 틀이다. (x, y)는 붙는 벽면 위의 칸막이벽 중심이다. rot은 칸막이벽이 뻗는 방향이다.
 * length는 벽면에서 끝까지, thickness는 벽 두께, capWidth는 두겁돌 폭, capOffset은 벽 중심에서 두겁돌 중심까지(틀의 +y 쪽이 +)다.
 */
export const lowWall = (key: string | number, x: number, y: number, rot: Rot, length: number, thickness: number, capWidth: number, capOffset: number, height: number, over: ExtraOver = {}): Item => ({
  id: `wall-low-${key}`, layer: 'wall', name: `0.5B 칸막이벽 ${key}`,
  shapes: place([
    box(0, -thickness / 2, length, thickness / 2, 0, height),
    box(0, capOffset - capWidth / 2, length, capOffset + capWidth / 2, height, height + 20, 'granite'),
  ], x, y, rot),
  dims: [dim('높이', height, 'drawn'), dim('두겁돌 폭', capWidth, 'drawn'), dim('두겁돌 두께', 20, 'drawn'), dim('길이', length, 'drawn'), dim('벽 두께', thickness, 'scaled')],
  ...over,
});

/** 창 위 커텐박스. 벽 틀이다. (x, y)는 창 쪽 벽면 위의 박스 중심이다. top은 박스 윗면(천장고), depth는 벽에서 나온 깊이, height는 박스 높이(가정)다. */
export const curtainBox = (key: string | number, x: number, y: number, rot: Rot, length: number, top: number, depth = 96, height = 150, over: ExtraOver = {}): Item => ({
  id: `curtain-box-${key}`, layer: 'accessory', name: `커텐박스 ${key}`, material: 'white',
  remark: '도면의 점선(위에 있는 것) 범위다. 높이와 단면은 가정이다.',
  shapes: place([box(0, -length / 2, depth, length / 2, top - height, top)], x, y, rot),
  dims: [dim('길이', length, 'drawn'), dim('깊이', depth, 'scaled'), dim('높이', height, A)],
  ...over,
});

/** 코너 비드 날개 2개(폭 25, 두께 5). (x, y)는 벽 모서리, ox·oy는 모서리에서 벽 밖으로 향하는 방향(±1)이다. parts.ts 의 cornerBead에 넘긴다. */
export const cornerBeadWings = (x: number, y: number, ox: 1 | -1, oy: 1 | -1, z1: number, z0 = 0): Shape[] => {
  const span = (a: number, b: number): [number, number] => [Math.min(a, b), Math.max(a, b)];
  const [ax0, ax1] = span(x - ox * 25, x + ox * 5);
  const [ay0, ay1] = span(y, y + oy * 5);
  const [bx0, bx1] = span(x, x + ox * 5);
  const [by0, by1] = span(y - oy * 25, y + oy * 5);
  return [box(ax0, ay0, ax1, ay1, z0, z1), box(bx0, by0, bx1, by1, z0, z1)];
};

/**
 * 창틀(상식 보완). 중심 틀이다. (x, y)는 창의 평면 중심(틀 두께의 중심)이고 rot은 실내 쪽 방향이다.
 * width는 창 폭이다. 틀 폭 45, 깊이 70, 가운데 세로살 1개는 가정이다. 높이는 창대(SILL)에서 창 상단(HEAD)까지다.
 */
export const windowFrame = (key: string | number, x: number, y: number, rot: Rot, width: number, over: ExtraOver = {}): Item => {
  const w = width / 2;
  return {
    id: `window-frame-${key}`, layer: 'wall', name: `창틀 ${key}`, added: true, material: 'bronze',
    shapes: place([
      box(-35, -w, 35, w, SILL, SILL + 45), box(-35, -w, 35, w, HEAD - 45, HEAD),
      box(-35, w - 45, 35, w, SILL + 45, HEAD - 45), box(-35, -w, 35, -w + 45, SILL + 45, HEAD - 45),
      box(-35, -23, 35, 22, SILL + 45, HEAD - 45),
    ], x, y, rot),
    dims: [dim('틀 폭', 45, A), dim('틀 깊이', 70, A)],
    ...over,
  };
};
