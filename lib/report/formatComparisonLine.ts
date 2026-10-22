import type { ComparisonResult } from "./computeComparison";

export function formatComparisonLine(comparison: ComparisonResult | undefined): string {
  if (!comparison || !comparison.available) {
    return "전기 대비 증감률: 비교 데이터 없음";
  }
  const text =
    comparison.percent === null
      ? "계산할 수 없음 (비교 값이 0)"
      : `${comparison.percent.toFixed(1)}%`;
  return `전기(${comparison.comparePeriod}, ${comparison.compareValue}) 대비 증감률: ${text}`;
}
