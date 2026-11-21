import { lecture2fCalibration, lecture2fModel } from './lecture_2f';
import { lecture2fAdded } from './lecture_2f_added';
import { lecture3fCalibration, lecture3fModel } from './lecture_3f';
import { lecture3fAdded } from './lecture_3f_added';
import { lecture4fCalibration, lecture4fModel } from './lecture_4f';
import { lecture4fAdded } from './lecture_4f_added';
import { research1fCalibration, research1fModel } from './research_1f';
import { research1fAdded } from './research_1f_added';
import { research2fCalibration, research2fModel } from './research_2f';
import { research2fAdded } from './research_2f_added';
import { research3fCalibration, research3fModel } from './research_3f';
import { research3fAdded } from './research_3f_added';
import { research4fCalibration, research4fModel } from './research_4f';
import { research4fAdded } from './research_4f_added';
import { research5fCalibration, research5fModel } from './research_5f';
import { research5fAdded } from './research_5f_added';
import type { Calibration, Item, Sheet, SheetModel } from './types';

const image = (page: number) => `${import.meta.env.BASE_URL}plans/plan_${page}.jpg`;

/** 도면 근거 품목 뒤에 상식 보완 품목(added)을 붙인다. 품목이 하나도 없으면 작성 전의 탭이다. 모델이 없는 탭으로 둔다. */
const withAdded = (model: SheetModel, added: Item[]): SheetModel | undefined =>
  model.items.length === 0 ? undefined : { ...model, items: [...model.items, ...added] };

// 탭 이름과 제목은 도면 우하단 도면명을 따른다.
export const sheets: Sheet[] = [
  {
    id: 'lecture-2f', page: 1, building: '강의동', tab: '2F 여', title: '2층 강의동 화장실 확대평면도 (변경후)', image: image(1),
    calibration: lecture2fCalibration, model: withAdded(lecture2fModel, lecture2fAdded),
  },
  {
    id: 'lecture-3f', page: 2, building: '강의동', tab: '3F 남', title: '3층 강의동 화장실 확대평면도 (변경후)', image: image(2),
    calibration: lecture3fCalibration, model: withAdded(lecture3fModel, lecture3fAdded),
  },
  {
    id: 'lecture-4f', page: 3, building: '강의동', tab: '4F 여', title: '4층 강의동 화장실 확대평면도 (변경후)', image: image(3),
    calibration: lecture4fCalibration, model: withAdded(lecture4fModel, lecture4fAdded),
  },
  {
    id: 'research-1f', page: 4, building: '연구동', tab: '1F 여·남', title: '1층 연구동 화장실 확대평면도 (변경후)', image: image(4),
    calibration: research1fCalibration, model: withAdded(research1fModel, research1fAdded),
  },
  {
    id: 'research-2f', page: 5, building: '연구동', tab: '2F 여·남', title: '2층 연구동 화장실 확대평면도 (변경후)', image: image(5),
    calibration: research2fCalibration, model: withAdded(research2fModel, research2fAdded),
  },
  {
    id: 'research-3f', page: 6, building: '연구동', tab: '3F 여', title: '3층 연구동 화장실 확대평면도 (변경후)', image: image(6),
    calibration: research3fCalibration, model: withAdded(research3fModel, research3fAdded),
  },
  {
    id: 'research-4f', page: 7, building: '연구동', tab: '4F 남', title: '4층 연구동 화장실 확대평면도 (변경후)', image: image(7),
    calibration: research4fCalibration, model: withAdded(research4fModel, research4fAdded),
  },
  {
    id: 'research-5f', page: 8, building: '연구동', tab: '5F 여', title: '5층 연구동 화장실 확대평면도 (변경후)', image: image(8),
    calibration: research5fCalibration, model: withAdded(research5fModel, research5fAdded),
  },
];

/** 모델이 없는 탭의 기본 보정값. 도면 중앙을 원점에 놓는다. */
export const defaultCalibration: Calibration = { workSize: [4961, 3508], originPx: [2480, 1754], mmPerPx: 4.372 };
