import { ParsedRow, ParseResult } from "./parseStatsFile";

const LABEL_COLUMN_CANDIDATES = ["연도", "연월", "기간", "월"];

export type ChartColumns = { labelColumn: string; valueColumn: string } | null;

function isNumericColumn(rows: ParsedRow[], column: string): boolean {
  return rows.length > 0 && rows.every((row) => typeof row[column] === "number");
}

// 막대그래프의 x축(기간)·y축(수치) 열을 고른다. 실제 보고서 양식의 정확한 열 이름을
// 아직 몰라 추측하지 않고, 흔한 기간 표기와 "모든 행이 숫자인 열"이라는 안전한 규칙만 쓴다.
export function pickChartColumns(table: ParseResult): ChartColumns {
  if (!table.ok) return null;

  const labelColumn =
    table.columns.find((column) => LABEL_COLUMN_CANDIDATES.includes(column)) ??
    table.columns[0];
  const valueColumn = table.columns.find(
    (column) => column !== labelColumn && isNumericColumn(table.rows, column),
  );

  if (!labelColumn || !valueColumn) return null;
  return { labelColumn, valueColumn };
}
