import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { pickChartColumns } from "@/lib/stats/pickChartColumns";
import { TOTAL_ROW_LABELS } from "@/lib/stats/totalRowLabels";

export type SeriesFacts = {
  label: string;
  periods: { period: string; value: number }[];
  firstPeriod: string;
  firstValue: number;
  latestPeriod: string;
  latestValue: number;
  changeAmount: number;
  changePercent: number | null;
};

// AI에게 넘길 "근거 숫자"를 서버에서 직접 계산한다 — AI는 이 숫자를 문장으로
// 바꾸기만 하고, 숫자 자체를 만들어내지 않도록 하기 위함(PRD 원본 수치 불변 규칙).
export function computeSeriesFacts(
  label: string,
  table: ParseResult,
): SeriesFacts | null {
  if (!table.ok) return null;

  const columns = pickChartColumns(table);
  if (!columns) return null;

  const periods = table.rows
    .filter((row) => !TOTAL_ROW_LABELS.includes(String(row[columns.labelColumn])))
    .map((row) => ({
      period: String(row[columns.labelColumn]),
      value: Number(row[columns.valueColumn]),
    }));
  if (periods.length === 0) return null;

  const first = periods[0];
  const latest = periods[periods.length - 1];
  const changeAmount = latest.value - first.value;
  const changePercent = first.value !== 0 ? (changeAmount / first.value) * 100 : null;

  return {
    label,
    periods,
    firstPeriod: first.period,
    firstValue: first.value,
    latestPeriod: latest.period,
    latestValue: latest.value,
    changeAmount,
    changePercent,
  };
}
