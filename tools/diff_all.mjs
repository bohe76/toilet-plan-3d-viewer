// 전체 탭 덤프(dump_model.mjs all) 2개를 비교한다. 탭마다 달라진 품목 id와 달라진 필드를 적는다.
// 사용: node tools/diff_all.mjs <before.json> <after.json>
import { readFileSync } from 'node:fs';

const [a, b] = process.argv.slice(2).map((p) => JSON.parse(readFileSync(p, 'utf8')));
const sheets = (dump) => (Array.isArray(dump) ? Object.fromEntries(dump.map((s) => [s.id, s])) : dump);
const sort = (v) => (Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v);
const same = (x, y) => JSON.stringify(sort(x)) === JSON.stringify(sort(y));

const A = sheets(a);
const B = sheets(b);
let total = 0;
for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
  const ia = new Map((A[id]?.model?.items ?? []).map((it) => [it.id, it]));
  const ib = new Map((B[id]?.model?.items ?? []).map((it) => [it.id, it]));
  const lines = [];
  for (const key of new Set([...ia.keys(), ...ib.keys()])) {
    const x = ia.get(key);
    const y = ib.get(key);
    if (!x) lines.push(`  추가: ${key}`);
    else if (!y) lines.push(`  삭제: ${key}`);
    else if (!same(x, y)) {
      const fields = [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((f) => !same(x[f], y[f]));
      lines.push(`  다름: ${key} [${fields.join(', ')}]`);
    }
  }
  const { items: _a, ...restA } = A[id]?.model ?? {};
  const { items: _b, ...restB } = B[id]?.model ?? {};
  if (!same(restA, restB) || !same(A[id]?.calibration, B[id]?.calibration)) lines.push('  다름: 모델 설정(items 제외) 또는 보정값');
  console.log(`${id}: ${lines.length === 0 ? '같음' : `${lines.length}건`}`);
  for (const line of lines) console.log(line);
  total += lines.length;
}
console.log(`합계: ${total}건`);
