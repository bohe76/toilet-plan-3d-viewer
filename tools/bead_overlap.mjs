// 전체 탭 덤프에서 코너 비드의 날개 상자와 벽 품목(layer wall) 상자의 겹침을 센다.
// 사용: node tools/bead_overlap.mjs <all.json>
import { readFileSync } from 'node:fs';

const dump = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const sheets = Array.isArray(dump) ? dump : Object.values(dump);
const norm = (s) => ({ x0: Math.min(s.x0, s.x1), x1: Math.max(s.x0, s.x1), y0: Math.min(s.y0, s.y1), y1: Math.max(s.y0, s.y1), z0: s.z0, z1: s.z1 });
const overlap = (a, b) => {
  const dx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const dy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  const dz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
  return dx > 0.01 && dy > 0.01 && dz > 0.01 ? [dx, dy, dz] : null;
};
for (const sheet of sheets) {
  const items = sheet.model?.items ?? [];
  const walls = items.filter((it) => it.layer === 'wall').flatMap((it) => it.shapes.filter((s) => s.type === 'box').map((s) => ({ id: it.id, ...norm(s) })));
  const lines = [];
  for (const bead of items.filter((it) => it.id.startsWith('corner-bead-'))) {
    bead.shapes.forEach((s, i) => {
      if (s.type !== 'box') return;
      for (const w of walls) {
        const o = overlap(norm(s), w);
        if (o) lines.push(`  ${bead.id} 날개 ${i + 1} × ${w.id}: ${o.map((v) => Math.round(v)).join(' × ')}`);
      }
    });
  }
  console.log(`${sheet.id}: ${lines.length === 0 ? '겹침 없음' : `${lines.length}건`}`);
  for (const line of lines) console.log(line);
}
