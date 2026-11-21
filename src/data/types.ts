/** 값 출처. drawn=도면에 적힌 치수, scaled=도면 축척으로 환산한 값, assumed=도면에 없어서 가정한 값 */
export type Source = 'drawn' | 'scaled' | 'assumed';

/** finish(바닥·벽·천장 마감)는 실사 모드에서만 그린다. 도면 모드에서는 스캔 도면이 바닥이다. */
export type LayerId = 'wall' | 'partition' | 'door' | 'fixture' | 'accessory' | 'light' | 'finish' | 'dim';

export type MaterialId =
  | 'wall' | 'glass' | 'partition' | 'door' | 'ceramic' | 'stone' | 'mirror' | 'metal' | 'tactile' | 'light'
  // 아래는 실사 모드에서 재질을 구분하려고 추가했다. 도면 모드 색은 scene/materials.ts 에 있다.
  | 'steelDoor' | 'paintDoor' | 'marble' | 'granite'
  | 'floorTile' | 'smallTile' | 'wainscotTile' | 'paint' | 'ceiling'
  | 'brass' | 'bronze' | 'black' | 'white' | 'led';

/** 판에 뚫는 구멍. 원 또는 모서리를 둥글린 사각형 */
export type Hole =
  | { cx: number; cy: number; r: number }
  | { x0: number; y0: number; x1: number; y1: number; r: number };

/** 평면 좌표는 mm다. x는 동쪽(도면 오른쪽), y는 남쪽(도면 아래쪽), z는 바닥에서의 높이다. */
type ShapeGeom =
  | { type: 'box'; x0: number; y0: number; x1: number; y1: number; z0: number; z1: number }
  | { type: 'cylinder'; cx: number; cy: number; rx: number; ry: number; z0: number; z1: number }
  /** 문짝. 경첩점(hx, hy)에서 angleDeg 방향으로 width만큼 뻗는다. 각도는 +x에서 +y 쪽으로 잰다. */
  | { type: 'leaf'; hx: number; hy: number; width: number; angleDeg: number; thickness: number; z0: number; z1: number }
  /** 1/4 원판. 중심(cx, cy)에서 startDeg부터 90도를 덮는다. */
  | { type: 'quarter'; cx: number; cy: number; r: number; startDeg: number; z0: number; z1: number }
  /** 모서리를 r만큼 둥글린 상자 */
  | { type: 'rbox'; x0: number; y0: number; x1: number; y1: number; z0: number; z1: number; r: number }
  /** 회전체. profile은 [반지름 비율(0~1), 높이 mm]의 목록이다. 평면은 rx, ry의 타원이다. 바깥면은 아래에서 위로 적는다. */
  | { type: 'lathe'; cx: number; cy: number; rx: number; ry: number; profile: [number, number][] }
  /** 원형 단면 관. path는 [x, y, z] mm의 목록이다. 점이 2개면 끝이 평평한 원기둥이다. */
  | { type: 'tube'; path: [number, number, number][]; r: number }
  /** 구멍이 뚫린 판. r은 바깥 모서리 반지름이다. */
  | { type: 'plate'; x0: number; y0: number; x1: number; y1: number; z0: number; z1: number; r?: number; holes: Hole[] }
  /** 한 점(cx, cy)으로 기우는 바닥. 가장자리 높이는 z, 그 점의 높이는 z - drop이다. */
  | { type: 'pan'; x0: number; y0: number; x1: number; y1: number; z: number; drop: number; cx: number; cy: number };

/** material을 적으면 품목의 재질 대신 이 도형에만 쓴다. */
export type Shape = ShapeGeom & { material?: MaterialId };

export interface DimValue {
  label: string;
  value: string;
  source: Source;
}

export interface Item {
  id: string;
  layer: LayerId;
  name: string;
  /** 도면 주기 원문 */
  note?: string;
  /** 판독·가정에 관한 메모 */
  remark?: string;
  material?: MaterialId;
  /** 상식 보완 품목. 도면에 없다. 치수는 모두 가정이다. */
  added?: boolean;
  /** 거울이 향하는 평면 방향 [x, y]. 실사 모드의 반사면에 쓴다. */
  facing?: [number, number];
  /** 실사 모드의 광원. 첫 도형의 위치에서 아래로 비춘다. power는 표준 매입등 1개를 1로 본 상대값이다. */
  lamp?: { power: number; shadow?: boolean };
  shapes: Shape[];
  dims: DimValue[];
}

export interface DimLine {
  from: [number, number];
  to: [number, number];
  label: string;
}

/** 300dpi 기울기 보정 이미지의 픽셀과 mm 좌표를 잇는 값 */
export interface Calibration {
  workSize: [number, number];
  originPx: [number, number];
  mmPerPx: number;
  /** 세로 축척. 스캔의 가로와 세로 축척이 다를 때만 적는다. 없으면 mmPerPx와 같다. */
  mmPerPxY?: number;
}

export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SheetModel {
  ceilingHeight: number;
  bounds: Bounds;
  /** 눈높이 뷰의 시점과 주시점. [x, y, z] mm */
  eye: { from: [number, number, number]; to: [number, number, number] };
  /** 아이소 뷰에서 카메라를 놓는 방향. [x 부호, y 부호]. 없으면 남동쪽이다. */
  isoDir?: [number, number];
  /** 실사 모드에서 창으로 들어오는 자연광의 평면 방향 [x, y]. 없으면 자연광을 넣지 않는다. */
  daylightDir?: [number, number];
  /** 실사 모드의 타일 줄눈 시작점 [x, y] mm. 도면의 타일 나누기 선 교점 하나를 적는다. 없으면 원점에서 시작한다. */
  tileOrigin?: { floorTile?: [number, number]; smallTile?: [number, number] };
  items: Item[];
  dimLines: DimLine[];
  roomLabels: { text: string; at: [number, number] }[];
}

export interface Sheet {
  id: string;
  page: number;
  building: '강의동' | '연구동';
  tab: string;
  title: string;
  image: string;
  calibration?: Calibration;
  model?: SheetModel;
}
