import { ParsedRow, ParseResult } from "./parseStatsFile";
import { TOTAL_ROW_LABELS } from "./totalRowLabels";

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

// PRD 8개 항목 중 "국가별 동향"처럼, 업로드 파일에 연도·금액 말고 실제 분류 열(국가·지역·
// 업종 등)이 있으면 그 열들을 모두 찾는다(2026-10-24, 실제 파일에 "국가" 열이 있는 것을
// 확인해 추가). 열 이름을 미리 정하지 않고, 라벨·숫자 열이 아니면서 "합계"류가 아닌 실제
// 값이 하나라도 있는 열을 쓴다 — 없으면 빈 배열을 반환해 그 항목 자체를 생략한다(지어내지 않는다).
export function pickBreakdownColumns(table: ParseResult): string[] {
  if (!table.ok) return [];
  const chart = pickChartColumns(table);
  if (!chart) return [];

  return table.columns.filter((column) => {
    if (column === chart.labelColumn || isNumericColumn(table.rows, column)) return false;
    return table.rows.some((row) => {
      const value = String(row[column] ?? "").trim();
      return value !== "" && !TOTAL_ROW_LABELS.includes(value);
    });
  });
}

// 분류 열이 여러 개(지역+업종대분류처럼 중첩된 경우)면 첫 번째 열 하나만 쓴다 —
// computeCategoryBreakdown이 나머지 열로 "그 분류만 실제값, 나머지는 합계"인 행만 골라
// 더 깊은 단계(업종별)를 기간처럼 잘못 비교하지 않게 한다.
export function pickBreakdownColumn(table: ParseResult): string | null {
  return pickBreakdownColumns(table)[0] ?? null;
}
