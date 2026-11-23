// 전체 탭 덤프에서 문짝(leaf)과 재료분리대(threshold*) 상자의 겹침을 센다. 그려진(열린) 상태만 본다.
import { readFileSync } from 'node:fs';
const dump = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const sheets = Array.isArray(dump) ? dump : Object.values(dump);
const corners = (l) => {
  const a = (l.angleDeg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, t = l.thickness / 2;
  return [[l.hx + nx * t, l.hy + ny * t], [l.hx - nx * t, l.hy - ny * t], [l.hx + ux * l.width - nx * t, l.hy + uy * l.width - ny * t], [l.hx + ux * l.width + nx * t, l.hy + uy * l.width + ny * t]];
};
const proj = (pts, ax) => { const v = pts.map((p) => p[0] * ax[0] + p[1] * ax[1]); return [Math.min(...v), Math.max(...v)]; };
const satOverlap = (A, B) => {
  let min = Infinity;
  for (const poly of [A, B]) for (let i = 0; i < 4; i++) {
    const p = poly[i], q = poly[(i + 1) % 4], e = [q[0] - p[0], q[1] - p[1]], len = Math.hypot(...e) || 1, ax = [-e[1] / len, e[0] / len];
    const [a0, a1] = proj(A, ax), [b0, b1] = proj(B, ax), o = Math.min(a1, b1) - Math.max(a0, b0);
    if (o <= 0.01) return 0; min = Math.min(min, o);
  }
  return min;
};
for (const sheet of sheets) {
  const items = sheet.model?.items ?? [];
  const thr = items.filter((i) => i.id.startsWith('threshold')).flatMap((i) => i.shapes.filter((s) => s.type === 'box').map((s) => ({ id: i.id, s })));
  const lines = [];
  for (const it of items) for (const l of it.shapes.filter((s) => s.type === 'leaf')) for (const { id, s } of thr) {
    const dz = Math.min(l.z1, s.z1) - Math.max(l.z0, s.z0); if (dz <= 0.01) continue;
    const B = [[s.x0, s.y0], [s.x1, s.y0], [s.x1, s.y1], [s.x0, s.y1]];
    const o = satOverlap(corners(l), B);
    if (o > 0.01) lines.push(`  ${it.id} (z0 ${l.z0}) × ${id} (z ${s.z0}~${s.z1}): 침투 ${Math.round(o)} × z ${Math.round(dz)}`);
  }
  console.log(`${sheet.id}: 재료분리대 ${thr.length}개, ${lines.length === 0 ? '겹침 없음' : `${lines.length}건`}`);
  for (const line of lines) console.log(line);
}
