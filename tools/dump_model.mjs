// 탭의 모델 데이터를 좌표가 풀린 JSON으로 저장한다. 공용 부품(parts.ts)이 만든 도형도 최종 좌표로 나온다.
//   node tools/dump_model.mjs <탭 id | all> <json 경로>
// 프로젝트 루트에서 실행한다.
import { writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const [, , id, out] = process.argv;
if (!id || !out) {
  console.error('사용: node tools/dump_model.mjs <탭 id | all> <json 경로>');
  process.exit(1);
}
const server = await createServer({
  configFile: false, appType: 'custom', logLevel: 'error',
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { sheets } = await server.ssrLoadModule('/src/data/sheets.ts');
  const picked = sheets.filter((s) => id === 'all' || s.id === id).map(({ id, page, title, calibration, model }) => ({ id, page, title, calibration, model }));
  if (picked.length === 0) throw new Error(`탭 없음: ${id}`);
  writeFileSync(out, JSON.stringify(id === 'all' ? picked : picked[0], null, 1));
  console.log(`saved ${out} (${picked.map((s) => `${s.id}: ${s.model?.items.length ?? 0} items`).join(', ')})`);
} finally {
  await server.close();
}
