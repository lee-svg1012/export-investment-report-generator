import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { computeSeriesFacts } from "./computeSeriesFacts";

export type ComparisonResult =
  | {
      available: true;
      percent: number | null;
      comparePeriod: string;
      compareValue: number;
    }
  | { available: false };

// PRD nice 3: 과거 통계 파일을 함께 업로드한 경우에만 증감률을 계산하고,
// 없으면 "비교 데이터 없음"(available: false)으로 표기한다 — 임의로 추정하지 않는다.
export function computeComparison(
  label: string,
  currentTable: ParseResult,
  compareTable: ParseResult | null,
): ComparisonResult {
  if (!compareTable) return { available: false };

  const current = computeSeriesFacts(label, currentTable);
  const compare = computeSeriesFacts(label, compareTable);
  if (!current || !compare) return { available: false };

  const percent =
    compare.latestValue !== 0
      ? ((current.latestValue - compare.latestValue) / compare.latestValue) * 100
      : null;

  return {
    available: true,
    percent,
    comparePeriod: compare.latestPeriod,
    compareValue: compare.latestValue,
  };
}
