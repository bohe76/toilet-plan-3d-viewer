import type { DimValue, MaterialId, Shape, Source } from './types';

export const box = (x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, material?: MaterialId): Shape => ({
  type: 'box', x0, y0, x1, y1, z0, z1, material,
});

export const rbox = (
  x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, r: number, material?: MaterialId,
): Shape => ({ type: 'rbox', x0, y0, x1, y1, z0, z1, r, material });

/** 수직 원기둥 */
export const cyl = (cx: number, cy: number, r: number, z0: number, z1: number, material?: MaterialId): Shape => ({
  type: 'cylinder', cx, cy, rx: r, ry: r, z0, z1, material,
});

export const tube = (path: [number, number, number][], r: number, material?: MaterialId): Shape => ({
  type: 'tube', path, r, material,
});

export const dim = (label: string, value: number | string, source: Source): DimValue => ({
  label,
  value: typeof value === 'number' ? value.toLocaleString('en-US') : value,
  source,
});
