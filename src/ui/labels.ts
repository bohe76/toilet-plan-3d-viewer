import type { LayerId, Source } from '../data/types';

export const LAYERS: { id: LayerId; label: string }[] = [
  { id: 'wall', label: '벽·창' },
  { id: 'partition', label: '칸막이' },
  { id: 'door', label: '문' },
  { id: 'fixture', label: '위생기구' },
  { id: 'accessory', label: '거울·선반·부속' },
  { id: 'light', label: '조명' },
  { id: 'finish', label: '바닥·벽·천장 마감' },
  { id: 'dim', label: '치수' },
];

export const SOURCE_LABEL: Record<Source, string> = { drawn: '도면 표기', scaled: '축척 환산', assumed: '가정' };
