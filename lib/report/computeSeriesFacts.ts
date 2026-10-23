import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { pickChartColumns, pickBreakdownColumns } from "@/lib/stats/pickChartColumns";
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

  // "지역"·"업종대분류"처럼 분류 열이 있는 파일은, 같은 연도 밑에 분류별 세부 행이 여러 개
  // 깔려 있다. 그 세부 행까지 섞어서 "최신 행"을 집으면 전체 합계가 아니라 임의의 세부
  // 항목값을 "올해 수치"로 잘못 서술하게 된다(2026-10-24 실사용 중 확인 — "-100% 감소"
  // 같은 터무니없는 수치). 분류 열이 전부 "합계"(또는 빈 값)인, 그 기간의 전체 합계 행만 쓴다
  // — 단, 그런 합계 행이 아예 없는 파일(예: 분류값 하나뿐이고 합계 행 자체가 없는 경우)은
  // 아무 것도 못 쓰게 되는 게 더 나쁘므로, 그때는 원래대로 모든 실제 기간 행을 그대로 쓴다.
  const breakdownColumns = pickBreakdownColumns(table);
  const buildPeriods = (requireTotalBreakdown: boolean) =>
    table.rows
      .filter((row) => {
        if (TOTAL_ROW_LABELS.includes(String(row[columns.labelColumn]))) return false;
        if (!requireTotalBreakdown) return true;
        return breakdownColumns.every((column) => {
          const value = String(row[column] ?? "").trim();
          return value === "" || TOTAL_ROW_LABELS.includes(value);
        });
      })
      .map((row) => ({
        period: String(row[columns.labelColumn]),
        value: Number(row[columns.valueColumn]),
      }));

  const periods =
    breakdownColumns.length > 0 && buildPeriods(true).length > 0
      ? buildPeriods(true)
      : buildPeriods(false);
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
