import type { ParseResult, ParsedRow } from "@/lib/stats/parseStatsFile";
import { pickChartColumns, pickBreakdownColumn } from "@/lib/stats/pickChartColumns";
import { TOTAL_ROW_LABELS } from "@/lib/stats/totalRowLabels";

export type CategoryFact = {
  category: string;
  firstPeriod: string;
  firstValue: number;
  latestPeriod: string;
  latestValue: number;
  changeAmount: number;
  changePercent: number | null;
};

export type CategoryBreakdown = {
  categoryColumn: string;
  // "합계"류 행을 뺀 실제 분류값 행만 남은 표 — StatsTable에 그대로 재사용한다.
  table: ParseResult;
  categories: CategoryFact[];
};

// PRD "국가별 동향" 항목: 업로드 파일에 국가·업종 같은 분류 열이 실제로 있을 때만,
// 그 열 기준으로 분류별 최신값·증감을 계산한다(지어내지 않고 실제 데이터로만).
export function computeCategoryBreakdown(table: ParseResult): CategoryBreakdown | null {
  if (!table.ok) return null;

  const chart = pickChartColumns(table);
  if (!chart) return null;

  const categoryColumn = pickBreakdownColumn(table);
  if (!categoryColumn) return null;

  // 분류 열(국가 등)의 "합계" 행뿐 아니라, 기간 열(연도 등)이 "합계"인 행(전체 기간 총계)도
  // 빼야 한다 — 안 그러면 "2026년 대비 전체 합계" 같은 말이 안 되는 증감률이 나온다
  // (2026-10-24 실사용 중 확인).
  const realRows = table.rows.filter((row) => {
    const categoryValue = String(row[categoryColumn] ?? "").trim();
    const periodValue = String(row[chart.labelColumn] ?? "").trim();
    return (
      categoryValue !== "" &&
      !TOTAL_ROW_LABELS.includes(categoryValue) &&
      !TOTAL_ROW_LABELS.includes(periodValue)
    );
  });
  if (realRows.length === 0) return null;

  const grouped = new Map<string, ParsedRow[]>();
  for (const row of realRows) {
    const key = String(row[categoryColumn]);
    const group = grouped.get(key);
    if (group) {
      group.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }

  const categories: CategoryFact[] = Array.from(grouped.entries()).map(([category, rows]) => {
    const first = rows[0];
    const latest = rows[rows.length - 1];
    const firstValue = Number(first[chart.valueColumn]);
    const latestValue = Number(latest[chart.valueColumn]);
    const changeAmount = latestValue - firstValue;
    const changePercent = firstValue !== 0 ? (changeAmount / firstValue) * 100 : null;
    return {
      category,
      firstPeriod: String(first[chart.labelColumn]),
      firstValue,
      latestPeriod: String(latest[chart.labelColumn]),
      latestValue,
      changeAmount,
      changePercent,
    };
  });

  return {
    categoryColumn,
    table: { ok: true, columns: table.columns, rows: realRows },
    categories,
  };
}
