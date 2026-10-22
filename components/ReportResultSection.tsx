import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { pickChartColumns } from "@/lib/stats/pickChartColumns";
import type { ComparisonResult } from "@/lib/report/computeComparison";
import { StatsBarChart } from "./StatsBarChart";
import { StatsTable } from "./StatsTable";

function ComparisonLine({ comparison }: { comparison?: ComparisonResult }) {
  if (!comparison || !comparison.available) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        전기 대비 증감률: 비교 데이터 없음
      </p>
    );
  }
  const text =
    comparison.percent === null
      ? "계산할 수 없음 (비교 값이 0)"
      : `${comparison.percent.toFixed(1)}%`;
  return (
    <p className="text-sm text-zinc-700 dark:text-zinc-300">
      전기({comparison.comparePeriod}, {comparison.compareValue}) 대비 증감률: {text}
    </p>
  );
}

export function ReportResultSection({
  title,
  table,
  comparison,
}: {
  title: string;
  table: ParseResult;
  comparison?: ComparisonResult;
}) {
  if (!table.ok) return null;
  const chartColumns = pickChartColumns(table);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium text-black dark:text-zinc-50">{title}</h2>
      <StatsTable table={table} />
      {chartColumns && (
        <StatsBarChart
          rows={table.rows}
          labelColumn={chartColumns.labelColumn}
          valueColumn={chartColumns.valueColumn}
        />
      )}
      <ComparisonLine comparison={comparison} />
    </section>
  );
}
