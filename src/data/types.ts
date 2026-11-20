/** 값 출처. drawn=도면에 적힌 치수, scaled=도면 축척으로 환산한 값, assumed=도면에 없어서 가정한 값 */
export type Source = 'drawn' | 'scaled' | 'assumed';

export type LayerId = 'wall' | 'partition' | 'door' | 'fixture' | 'accessory' | 'light' | 'dim';

export type MaterialId =
  | 'wall' | 'glass' | 'partition' | 'door' | 'ceramic' | 'stone' | 'mirror' | 'metal' | 'tactile' | 'light';

/** 평면 좌표는 mm다. x는 동쪽(도면 오른쪽), y는 남쪽(도면 아래쪽), z는 바닥에서의 높이다. */
export type Shape =
  | { type: 'box'; x0: number; y0: number; x1: number; y1: number; z0: number; z1: number }
  | { type: 'cylinder'; cx: number; cy: number; rx: number; ry: number; z0: number; z1: number }
  /** 문짝. 경첩점(hx, hy)에서 angleDeg 방향으로 width만큼 뻗는다. 각도는 +x에서 +y 쪽으로 잰다. */
  | { type: 'leaf'; hx: number; hy: number; width: number; angleDeg: number; thickness: number; z0: number; z1: number }
  /** 1/4 원판. 중심(cx, cy)에서 startDeg부터 90도를 덮는다. */
  | { type: 'quarter'; cx: number; cy: number; r: number; startDeg: number; z0: number; z1: number };

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
