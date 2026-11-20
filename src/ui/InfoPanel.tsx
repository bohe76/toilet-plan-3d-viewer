import type { Item, Sheet } from '../data/types';
import { LAYERS, SOURCE_LABEL } from './labels';

export function ItemInfo({ item }: { item: Item }) {
  return (
    <>
      <h2>{item.name}</h2>
      <p className="muted">{LAYERS.find((l) => l.id === item.layer)?.label}</p>
      {item.note && (
        <>
          <h3>도면 주기</h3>
          <p className="note">{item.note}</p>
        </>
      )}
      <h3>치수 (mm)</h3>
      <table className="dims">
        <tbody>
          {item.dims.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>{d.value}</td>
              <td>
                <span className={`badge ${d.source}`}>{SOURCE_LABEL[d.source]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {item.remark && (
        <>
          <h3>판독 메모</h3>
          <p>{item.remark}</p>
        </>
      )}
    </>
  );
}

export function SheetInfo({ sheet }: { sheet: Sheet }) {
  return (
    <>
      <h2>{sheet.title}</h2>
      <p className="muted">PDF {sheet.page}페이지 · 축척 1/50 (A3)</p>
      {sheet.model ? (
        <>
          <table className="dims">
            <tbody>
              <tr>
                <th>천장고 (CH)</th>
                <td>{sheet.model.ceilingHeight.toLocaleString('en-US')}</td>
                <td>
                  <span className="badge drawn">도면 표기</span>
                </td>
              </tr>
              <tr>
                <th>모델 품목 수</th>
                <td>{sheet.model.items.length}</td>
                <td />
              </tr>
            </tbody>
          </table>
          <h3>값 출처</h3>
          <p>
            <span className="badge drawn">도면 표기</span> 도면에 적힌 치수다.
          </p>
          <p>
            <span className="badge scaled">축척 환산</span> 도면의 선 위치를 축척으로 환산한 값이다.
          </p>
          <p>
            <span className="badge assumed">가정</span> 도면에 없어서 가정한 값이다.
          </p>
          <p className="muted">품목을 클릭하면 치수와 도면 주기를 표시한다.</p>
        </>
      ) : (
        <p className="notice">이 탭은 3D 모델 작성 전이다. 기울기를 보정한 도면만 표시한다.</p>
      )}
    </>
  );
}
