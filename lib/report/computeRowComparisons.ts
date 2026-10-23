import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { pickChartColumns } from "@/lib/stats/pickChartColumns";

export type RowComparison = { available: true; percent: number | null } | { available: false };

// PRD nice 3 "전월/전년 대비 증감률"을 표의 행마다 보여주기로 결정(2026-10-23, 기존에는 표 전체
// 요약 한 줄이었음). 같은 기간(라벨 열 값)이 비교 파일에도 있는 행만 계산하고, 없는 행은 임의로
// 추정하지 않고 그 행만 "비교 데이터 없음"으로 둔다. 비교 파일 자체를 안 올렸으면 null을 반환해
// 화면에 증감률 열 자체를 보여주지 않는다.
export function computeRowComparisons(
  currentTable: ParseResult,
  compareTable: ParseResult | null,
): RowComparison[] | null {
  if (!currentTable.ok) return null;
  if (!compareTable) return null;
  if (!compareTable.ok) return currentTable.rows.map(() => ({ available: false }));

  const currentColumns = pickChartColumns(currentTable);
  const compareColumns = pickChartColumns(compareTable);
  if (!currentColumns || !compareColumns) {
    return currentTable.rows.map(() => ({ available: false }));
  }

  const compareValueByPeriod = new Map<string, number>();
  for (const row of compareTable.rows) {
    compareValueByPeriod.set(
      String(row[compareColumns.labelColumn]),
      Number(row[compareColumns.valueColumn]),
    );
  }

  return currentTable.rows.map((row) => {
    const period = String(row[currentColumns.labelColumn]);
    const compareValue = compareValueByPeriod.get(period);
    if (compareValue === undefined) return { available: false };

    const currentValue = Number(row[currentColumns.valueColumn]);
    const percent =
      compareValue !== 0 ? ((currentValue - compareValue) / compareValue) * 100 : null;
    return { available: true, percent };
  });
}
