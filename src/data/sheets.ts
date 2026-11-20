import { research3fCalibration, research3fModel } from './research_3f';
import type { Calibration, Sheet } from './types';

const image = (page: number) => `${import.meta.env.BASE_URL}plans/plan_${page}.jpg`;

// 탭 이름과 제목은 도면 우하단 도면명을 따른다.
export const sheets: Sheet[] = [
  { id: 'lecture-2f', page: 1, building: '강의동', tab: '2F 여', title: '2층 강의동 화장실 확대평면도 (변경후)', image: image(1) },
  { id: 'lecture-3f', page: 2, building: '강의동', tab: '3F 남', title: '3층 강의동 화장실 확대평면도 (변경후)', image: image(2) },
  { id: 'lecture-4f', page: 3, building: '강의동', tab: '4F 여', title: '4층 강의동 화장실 확대평면도 (변경후)', image: image(3) },
  { id: 'research-1f', page: 4, building: '연구동', tab: '1F 여·남', title: '1층 연구동 화장실 확대평면도 (변경후)', image: image(4) },
  { id: 'research-2f', page: 5, building: '연구동', tab: '2F 여·남', title: '2층 연구동 화장실 확대평면도 (변경후)', image: image(5) },
  {
    id: 'research-3f', page: 6, building: '연구동', tab: '3F 여', title: '3층 연구동 화장실 확대평면도 (변경후)', image: image(6),
    calibration: research3fCalibration, model: research3fModel,
  },
  { id: 'research-4f', page: 7, building: '연구동', tab: '4F 남', title: '4층 연구동 화장실 확대평면도 (변경후)', image: image(7) },
  { id: 'research-5f', page: 8, building: '연구동', tab: '5F 여', title: '5층 연구동 화장실 확대평면도 (변경후)', image: image(8) },
];

/** 모델이 없는 탭의 기본 보정값. 도면 중앙을 원점에 놓는다. */
export const defaultCalibration: Calibration = { workSize: [4961, 3508], originPx: [2480, 1754], mmPerPx: 4.372 };
