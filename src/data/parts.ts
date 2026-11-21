// 여러 탭이 함께 쓰는 도면 근거 부품이다. 형상과 가정 높이를 한 곳에 둔다. 탭 데이터는 위치와 방향만 넘긴다.
// 도면에 없는 상식 보완 부품은 parts_added.ts 에 있다.
//
// 좌표 틀은 3가지다. 모두 +y는 +x에서 시계 방향 90도다(도면에서 볼 때).
//  - 벽 틀: 원점은 벽면 위의 점이다. +x는 벽에서 실내 쪽이다. rot은 기구가 향하는 방향이다.
//  - 중심 틀: 원점은 기구의 중심이다. +x는 기구가 향하는 방향(벽의 반대쪽)이다.
//  - 문 틀: 원점은 경첩이다. +x는 문짝이 뻗는 방향이다. rot은 문짝의 angleDeg와 같다.
// rot은 0(동, +x), 90(남, +y), 180(서), 270(북) 중 하나다.
import { box, cyl, dim, rbox, tube } from './shape_helpers';
import type { Item, Shape } from './types';

export const SILL = 1200; // 창대 높이. 가정
export const HEAD = 2100; // 창·문 상단 높이. 가정
export const PT = 12; // 칸막이 두께. 도면 표기 12mm
export const GAP = 150; // 칸막이 하부 틈. 가정
/** 세면대 상판 윗면 높이. 가정. 하부 칸막이 높이 800(도면 표기) 위에 THK20 상판을 얹은 높이다. */
export const COUNTER = 820;
/** 세면기 테두리 윗면 높이. 상판 위로 12 올라온다. 가정 */
export const BASIN_TOP = COUNTER + 12;

export type Rot = 0 | 90 | 180 | 270;
/** 부품이 만든 품목의 id와 글자 항목을 탭에서 바꿀 때 쓴다. note는 도면 주기 원문만 적는다. */
export type Over = Partial<Pick<Item, 'id' | 'name' | 'note' | 'remark'>>;

const COS: Record<Rot, number> = { 0: 1, 90: 0, 180: -1, 270: 0 };
const SIN: Record<Rot, number> = { 0: 0, 90: 1, 180: 0, 270: -1 };

/** 틀 안의 점 (px, py)를 도면 좌표로 옮긴다. */
export const locate = (x: number, y: number, rot: Rot, px: number, py: number): [number, number] => [
  x + px * COS[rot] - py * SIN[rot],
  y + px * SIN[rot] + py * COS[rot],
];

/** 틀 안에서 만든 도형을 rot만큼 돌리고 (x, y)로 옮긴다. */
export const place = (shapes: Shape[], x: number, y: number, rot: Rot): Shape[] => {
  const pt = (px: number, py: number) => locate(x, y, rot, px, py);
  const rect = (r: { x0: number; y0: number; x1: number; y1: number }) => {
    const [ax, ay] = pt(r.x0, r.y0);
    const [bx, by] = pt(r.x1, r.y1);
    return { x0: Math.min(ax, bx), y0: Math.min(ay, by), x1: Math.max(ax, bx), y1: Math.max(ay, by) };
  };
  const turned = rot === 90 || rot === 270;
  return shapes.map((shape): Shape => {
    switch (shape.type) {
      case 'box':
      case 'rbox':
        return { ...shape, ...rect(shape) };
      case 'cylinder':
      case 'lathe': {
        const [cx, cy] = pt(shape.cx, shape.cy);
        return { ...shape, cx, cy, rx: turned ? shape.ry : shape.rx, ry: turned ? shape.rx : shape.ry };
      }
      case 'leaf': {
        const [hx, hy] = pt(shape.hx, shape.hy);
        return { ...shape, hx, hy, angleDeg: (shape.angleDeg + rot) % 360 };
      }
      case 'quarter': {
        const [cx, cy] = pt(shape.cx, shape.cy);
        return { ...shape, cx, cy, startDeg: (shape.startDeg + rot) % 360 };
      }
      case 'tube':
        return { ...shape, path: shape.path.map(([px, py, z]): [number, number, number] => [...pt(px, py), z]) };
      case 'plate':
        return {
          ...shape, ...rect(shape),
          holes: shape.holes.map((hole) => {
            if ('cx' in hole) {
              const [cx, cy] = pt(hole.cx, hole.cy);
              return { ...hole, cx, cy };
            }
            return { ...hole, ...rect(hole) };
          }),
        };
      case 'pan': {
        const [cx, cy] = pt(shape.cx, shape.cy);
        return { ...shape, ...rect(shape), cx, cy };
      }
    }
  });
};

/**
 * 양변기. 벽 틀이다. (x, y)는 탱크 뒤 벽면의 변기 중심선 위 점이다.
 * 평면 크기의 기본값은 연구동 3층 도면의 환산값이다(길이 740, 폭 385, 탱크 폭 396).
 * length는 벽면에서 변기 앞 끝까지의 길이다. 도면 기호의 길이가 740과 20mm 넘게 다를 때만 준다. 몸통이 그만큼 벽 쪽으로 온다.
 */
export const toilet = (key: string | number, x: number, y: number, rot: Rot, over: Over = {}, length = 740): Item => ({
  id: `toilet-${key}`, layer: 'fixture', name: `양변기 ${key}`,
  remark: '평면 크기는 도면 축척 환산값이다. 높이와 곡면 형상은 가정값이다. 뚜껑을 닫은 상태로 그렸다.',
  shapes: place([
    // 벽 쪽 받침
    rbox(0, -150, 260, 150, 0, 400, 40),
    // 변기 몸통. 평면은 도면의 타원(길이 550, 폭 385)이다.
    {
      type: 'lathe', cx: length - 275, cy: 0, rx: 275, ry: 192,
      profile: [[0.62, 0], [0.6, 60], [0.66, 190], [0.88, 320], [0.98, 375], [1, 395], [1, 400]],
    },
    // 좌대와 뚜껑
    { type: 'lathe', cx: length - 275, cy: 0, rx: 275, ry: 192, profile: [[0, 400], [1, 400], [1, 428], [0.965, 442], [0.6, 449], [0, 450]] },
    // 탱크와 탱크 뚜껑
    rbox(0, -192, 206, 192, 400, 756, 24),
    rbox(0, -198, 219, 198, 752, 780, 10),
    // 물내림 버튼
    cyl(110, 0, 24, 780, 786, 'metal'),
  ], x, y, rot),
  dims: [dim('길이', length, 'scaled'), dim('폭', 385, 'scaled'), dim('탱크 폭', 396, 'scaled'), dim('좌면 높이', 400, 'assumed'), dim('탱크 높이', 780, 'assumed')],
  ...over,
});

/**
 * 세면기. 상판에 얹는 원형이다. (cx, cy)는 중심이다. r은 도면 기호의 반지름이다.
 * wallLabel과 wallDistance는 벽면에서 중심까지의 거리 치수다(예: '남측 벽면에서 중심까지', 320).
 */
export const basin = (key: string | number, cx: number, cy: number, wallLabel: string, wallDistance: number, r = 215, over: Over = {}): Item => ({
  id: `basin-${key}`, layer: 'fixture', name: `세면기 ${key}`,
  remark: '중심과 지름은 도면 축척 환산값이다. 테두리 높이와 그릇 형상은 가정값이다. 상판에 얹는 형태로 그렸다.',
  shapes: [
    {
      type: 'lathe', cx, cy, rx: r, ry: r,
      profile: [
        [0, 690], [0.5, 690], [0.84, 730], [0.92, 800], [0.93, COUNTER], [1, COUNTER], [1, BASIN_TOP - 2], [0.985, BASIN_TOP],
        [0.86, BASIN_TOP], [0.8, 818], [0.72, 760], [0.5, 715], [0.14, 702], [0, 700],
      ],
    },
    cyl(cx, cy, 22, 700, 704, 'metal'),
  ],
  dims: [dim('지름', r * 2, 'scaled'), dim(wallLabel, wallDistance, 'scaled'), dim('테두리 높이', BASIN_TOP, 'assumed')],
  ...over,
});

/** 세면기 수전. 중심 틀이다. (cx, cy)는 세면기 중심이고 rot은 세면기가 향하는 방향(벽의 반대쪽)이다. 수전은 벽 쪽 테두리에 선다. */
export const faucet = (key: string | number, cx: number, cy: number, rot: Rot, r = 215, over: Over = {}): Item => {
  const back = 17 - r; // 벽 쪽 테두리에서 17 안쪽
  return {
    id: `faucet-${key}`, layer: 'fixture', name: `세면기 수전 ${key}`, material: 'brass',
    remark: '도면의 세면기 기호에 토수구와 손잡이 2개가 벽 쪽 테두리에 그려져 있다. 형상과 높이는 가정값이다.',
    shapes: place([
      cyl(back, 0, 14, BASIN_TOP, BASIN_TOP + 18),
      tube([[back, 0, BASIN_TOP + 18], [back, 0, 930], [back + 15, 0, 958], [back + 53, 0, 968], [back + 91, 0, 956], [back + 107, 0, 928]], 10),
      cyl(back + 7, -52, 12, BASIN_TOP, BASIN_TOP + 34),
      cyl(back + 7, 52, 12, BASIN_TOP, BASIN_TOP + 34),
      tube([[back + 7, -52, BASIN_TOP + 38], [back + 7, -84, BASIN_TOP + 38]], 5),
      tube([[back + 7, 52, BASIN_TOP + 38], [back + 7, 84, BASIN_TOP + 38]], 5),
    ], cx, cy, rot),
    dims: [dim('위치', '세면기 테두리의 벽 쪽', 'scaled'), dim('토수구 높이', 928, 'assumed')],
    ...over,
  };
};

/**
 * 소변기(벽걸이형). 벽 틀이다. (x, y)는 벽면의 소변기 중심선 위 점이다.
 * width와 depth는 도면 기호의 폭과 벽에서 나온 길이다. 높이와 곡면 형상은 가정이다.
 */
export const urinal = (key: string | number, x: number, y: number, rot: Rot, width = 400, depth = 360, over: Over = {}): Item => ({
  id: `urinal-${key}`, layer: 'fixture', name: `소변기 ${key}`,
  remark: '평면 크기는 도면 축척 환산값이다. 설치 높이와 곡면 형상은 가정값이다. 벽걸이형으로 그렸다.',
  shapes: place([
    // 벽에 붙는 등판
    rbox(0, -width / 2, 90, width / 2, 470, 1180, 40),
    // 그릇. 벽면에서 depth까지를 채운다. 벽 뒤로 넘어가지 않는다(얇은 벽을 뚫지 않게 한다).
    {
      type: 'lathe', cx: depth / 2, cy: 0, rx: depth / 2, ry: width / 2 - 10,
      profile: [[0.25, 380], [0.55, 420], [0.9, 520], [1, 600], [1, 640], [0.93, 640], [0.8, 560], [0.4, 470], [0, 455]],
    },
    // 세척 밸브
    tube([[0, 0, 1290], [70, 0, 1290]], 16, 'metal'),
    tube([[70, 0, 1290], [70, 0, 1180]], 9, 'metal'),
  ], x, y, rot),
  dims: [dim('폭', width, 'scaled'), dim('벽에서 나온 길이', depth, 'scaled'), dim('테두리 높이', 640, 'assumed')],
  ...over,
});

/** 바닥 배수구. (cx, cy)는 기호 중심이다. z는 그 자리의 바닥 높이다. 구배 바닥(pan)의 낮은 점에 둘 때 -drop을 준다. */
export const floorDrain = (id: string, cx: number, cy: number, z = 0): Item => ({
  id, layer: 'fixture', name: '바닥 배수구', note: 'Ø75 F.D', material: 'metal',
  shapes: [box(cx - 100, cy - 100, cx + 100, cy + 100, z, z + 6)],
  dims: [dim('관경', 'Ø75', 'drawn'), dim('위치', '선분 검출값', 'scaled'), dim('기호 크기', '약 200 x 200', 'scaled')],
});

/** 대변기 칸 문. 문 틀이다. 도면에 그려진 열림 상태 그대로 angleDeg를 준다. 높이는 칸막이 높이를 따른다. */
export const stallDoor = (key: string | number, hx: number, hy: number, angleDeg: Rot, width = 580, over: Over = {}): Item => ({
  id: `door-stall-${key}`, layer: 'door', name: `대변기 칸 ${key} 문`,
  remark: '도면에 그려진 열림 상태를 따랐다. 문 높이는 칸막이 높이를 따랐다. 하부 틈은 가정값이다.',
  shapes: [{ type: 'leaf', hx, hy, width, angleDeg, thickness: PT, z0: GAP, z1: 1950 }],
  dims: [dim('문짝 폭', width, 'scaled'), dim('높이', 1950, 'assumed'), dim('하부 틈', GAP, 'assumed')],
  ...over,
});

/**
 * 가방걸이. 문 틀이다. 도면의 문에 기호가 그려져 있을 때만 넣는다. 경첩에서 dist만큼 떨어진 문 면에 단다.
 * side는 다는 면이다. 문짝이 뻗는 방향을 볼 때 오른쪽 면이 1, 왼쪽 면이 -1이다.
 */
export const stallHook = (key: string | number, hx: number, hy: number, angleDeg: Rot, side: 1 | -1, dist = 280, over: Over = {}): Item => ({
  id: `hook-stall-${key}`, layer: 'accessory', name: `가방걸이 ${key}`, material: 'brass',
  remark: '도면의 문에 가방걸이 기호가 그려져 있다. 평면 위치는 도면 환산값이다. 높이와 형상은 가정값이다. 문 안쪽 면에 달았다.',
  shapes: place([
    tube([[dist, 6 * side, 1650], [dist, 14 * side, 1650]], 16),
    tube([[dist, 14 * side, 1650], [dist, 38 * side, 1650], [dist, 46 * side, 1672]], 5),
  ], hx, hy, angleDeg),
  dims: [dim('경첩에서의 거리', dist, 'scaled'), dim('설치 높이', 1650, 'assumed')],
  ...over,
});

/** 칸 모서리의 유리선반(1/4 원). (cx, cy)는 모서리 점이다. startDeg부터 90도를 덮는다. */
export const glassShelf = (key: string | number, cx: number, cy: number, startDeg: Rot, r = 300, over: Over = {}): Item => ({
  id: `glass-shelf-${key}`, layer: 'accessory', name: `유리선반 ${key}`, material: 'glass',
  remark: '설치 높이는 가정값이다.',
  shapes: [{ type: 'quarter', cx, cy, r, startDeg, z0: 1000, z1: 1008 }],
  dims: [dim('반지름', r, 'drawn'), dim('설치 높이', 1000, 'assumed')],
  ...over,
});

/** 코너 비드. shapes는 벽 모서리에 붙는 날개 2개(폭 25, 두께 5)다. */
export const cornerBead = (key: string | number, where: string, shapes: Shape[], over: Over = {}): Item => ({
  id: `corner-bead-${key}`, layer: 'accessory', name: `코너 비드 ${key} (${where})`, note: '코너 비드 설치', material: 'metal',
  remark: '위치는 도면의 지시선이 가리키는 벽 모서리다. 폭, 두께, 높이는 도면에 없다. 가정값이다.',
  shapes,
  dims: [dim('위치', where, 'scaled'), dim('날개 폭', 25, 'assumed'), dim('두께', 5, 'assumed'), dim('높이', '바닥에서 천장까지', 'assumed')],
  ...over,
});
