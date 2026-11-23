// dump_model.mjs 로 만든 JSON 2개를 품목 단위로 비교한다. 키 순서는 무시한다.
//   node tools/diff_model.mjs <이전 json> <이후 json>
import { readFileSync } from 'node:fs';

const [, , a, b] = process.argv;
const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const canon = (v) => {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
};
const [before, after] = [load(a), load(b)];
let diffs = 0;
const report = (label, x, y) => {
  if (JSON.stringify(canon(x)) === JSON.stringify(canon(y))) return;
  diffs += 1;
  console.log(`다름: ${label}\n  이전: ${JSON.stringify(canon(x))?.slice(0, 400)}\n  이후: ${JSON.stringify(canon(y))?.slice(0, 400)}`);
};
report('calibration', before.calibration, after.calibration);
const { items: itemsA, ...restA } = before.model;
const { items: itemsB, ...restB } = after.model;
report('model (items 제외)', restA, restB);
report('품목 id 순서', itemsA.map((i) => i.id), itemsB.map((i) => i.id));
const byId = new Map(itemsB.map((i) => [i.id, i]));
for (const item of itemsA) report(`item ${item.id}`, item, byId.get(item.id));
console.log(diffs === 0 ? `같음: 품목 ${itemsA.length}개` : `다른 곳 ${diffs}건`);
process.exit(diffs === 0 ? 0 : 1);
