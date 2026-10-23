import type { ParseResult } from "@/lib/stats/parseStatsFile";
import type { RowComparison } from "@/lib/report/computeRowComparisons";

function formatRowComparison(comparison: RowComparison | undefined): string {
  if (!comparison || !comparison.available) return "비교 데이터 없음";
  return comparison.percent === null ? "계산할 수 없음 (비교 값 0)" : `${comparison.percent.toFixed(1)}%`;
}

// 핀테크 대시보드 관례대로 증가는 초록, 감소는 붉은빛으로 구분해 한눈에 보이게 한다.
function comparisonColorClass(comparison: RowComparison | undefined): string {
  if (!comparison || !comparison.available || comparison.percent === null) return "text-zinc-500";
  if (comparison.percent > 0) return "text-accent";
  if (comparison.percent < 0) return "text-rose-400";
  return "text-zinc-400";
}

export function StatsTable({
  table,
  comparison,
}: {
  table: ParseResult;
  comparison?: RowComparison[] | null;
}) {
  if (!table.ok) return null;
  // 비교 파일을 아예 안 올렸으면(comparison === null) 증감률 열 자체를 보여주지 않는다.
  const showComparisonColumn = Array.isArray(comparison);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th
                key={column}
                className="border-b border-white/10 px-2 py-1 text-left font-medium text-white"
              >
                {column}
              </th>
            ))}
            {showComparisonColumn && (
              <th className="border-b border-white/10 px-2 py-1 text-left font-medium text-white">
                전기 대비 증감률
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {table.columns.map((column) => (
                <td key={column} className="border-b border-white/5 px-2 py-1 text-zinc-300">
                  {row[column]}
                </td>
              ))}
              {showComparisonColumn && (
                <td
                  className={`border-b border-white/5 px-2 py-1 font-medium ${comparisonColorClass(comparison[i])}`}
                >
                  {formatRowComparison(comparison[i])}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
