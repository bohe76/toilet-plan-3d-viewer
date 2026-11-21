// 4층 연구동 화장실 확대평면도 (변경후) — PDF 7페이지
// 작성 전의 빈 틀이다. docs/guides/tab_author_brief.md 의 절차로 채운다.
// 이 파일은 도면에 근거가 있는 품목만 담는다. 도면에 없는 상식 보완 품목은 research_4f_added.ts 에 둔다.
import type { Calibration, SheetModel } from './types';

export const CH = 2550; // 천장고. 300dpi 타일에서 도면 표기를 읽어 고친다.

export const research4fCalibration: Calibration = {
  workSize: [4961, 3508],
  originPx: [2480, 1754],
  mmPerPx: 4.372,
};

export const research4fModel: SheetModel = {
  ceilingHeight: CH,
  bounds: { x0: 0, y0: 0, x1: 4000, y1: 7500 },
  eye: { from: [2000, 6700, 1600], to: [2000, 800, 1100] },
  items: [],
  dimLines: [],
  roomLabels: [],
};
