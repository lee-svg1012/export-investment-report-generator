import { ParsedRow, ParseResult } from "./parseStatsFile";

const LABEL_COLUMN_CANDIDATES = ["연도", "연월", "기간", "월"];

export type ChartColumns = { labelColumn: string; valueColumn: string } | null;

function isNumericColumn(rows: ParsedRow[], column: string): boolean {
  return rows.length > 0 && rows.every((row) => typeof row[column] === "number");
}

// 막대그래프의 x축(기간)·y축(수치) 열을 고른다. 실제 보고서 양식의 정확한 열 이름을
// 아직 몰라 추측하지 않고, 흔한 기간 표기와 "모든 행이 숫자인 열"이라는 안전한 규칙만 쓴다.
//
// 실제 산업통상부·수출입은행 파일에는 "신규법인수"(건수)처럼 숫자형이지만 투자금액이 아닌
// 열이 먼저 나오는 경우가 있다. 아무 숫자 열이나 집으면 "법인 수"를 "투자금액"으로 잘못
// 해설하게 되므로(2026-10-23 실사용 중 확인), 열 이름에 "금액"이 들어간 열을 우선한다.
function isAmountColumnName(column: string): boolean {
  return column.includes("금액");
}

export function pickChartColumns(table: ParseResult): ChartColumns {
  if (!table.ok) return null;

  const labelColumn =
    table.columns.find((column) => LABEL_COLUMN_CANDIDATES.includes(column)) ??
    table.columns[0];

  const numericColumns = table.columns.filter(
    (column) => column !== labelColumn && isNumericColumn(table.rows, column),
  );
  const valueColumn =
    numericColumns.find(isAmountColumnName) ?? numericColumns[0];

  if (!labelColumn || !valueColumn) return null;
  return { labelColumn, valueColumn };
}
