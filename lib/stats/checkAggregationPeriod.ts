import { ParsedRow, ParseResult } from "./parseStatsFile";

export type AggregationPeriodCheck = {
  message: string;
  fdiPeriods: string[];
  tradePeriods: string[];
} | null;

const PERIOD_COLUMN_CANDIDATES = ["연도", "연월", "기간", "월"];

function findPeriodColumn(columns: string[]): string | null {
  return columns.find((column) => PERIOD_COLUMN_CANDIDATES.includes(column)) ?? null;
}

function collectPeriods(rows: ParsedRow[], column: string): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    values.add(String(row[column]));
  }
  return Array.from(values).sort();
}

// DESIGN.md §2 예외 규칙 중 "두 통계의 집계 기간이 다른 경우"만 다룬다.
// PRD 5장 규칙: 자동으로 맞추거나 조용히 넘어가지 않고 사실을 그대로 알린다 — 여기서는 사실 확인까지만 하고,
// "계속 진행할지 확인" UI는 보고서 생성 버튼을 실제로 연결하는 단계에서 이어 붙인다.
// 통계마다 실제 기간 열 이름을 몰라 추측할 수 없으므로, 둘 다 같은 후보 열을 쓸 때만 비교하고
// 못 찾으면 점검을 건너뛴다(없는 사실을 지어내지 않는다).
export function checkAggregationPeriod(
  fdi: ParseResult,
  trade: ParseResult,
): AggregationPeriodCheck {
  if (!fdi.ok || !trade.ok) return null;

  const fdiColumn = findPeriodColumn(fdi.columns);
  const tradeColumn = findPeriodColumn(trade.columns);
  if (!fdiColumn || !tradeColumn) return null;

  const fdiPeriods = collectPeriods(fdi.rows, fdiColumn);
  const tradePeriods = collectPeriods(trade.rows, tradeColumn);

  const same =
    fdiPeriods.length === tradePeriods.length &&
    fdiPeriods.every((period, i) => period === tradePeriods[i]);
  if (same) return null;

  return {
    message: "두 통계의 집계 기간이 다릅니다.",
    fdiPeriods,
    tradePeriods,
  };
}
