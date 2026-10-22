import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { pickChartColumns } from "@/lib/stats/pickChartColumns";
import type { ComparisonResult } from "@/lib/report/computeComparison";
import { formatComparisonLine } from "@/lib/report/formatComparisonLine";
import { StatsBarChart } from "./StatsBarChart";
import { StatsTable } from "./StatsTable";

function ComparisonLine({ comparison }: { comparison?: ComparisonResult }) {
  const available = comparison?.available ?? false;
  return (
    <p
      className={
        available
          ? "text-sm text-zinc-700 dark:text-zinc-300"
          : "text-sm text-zinc-500 dark:text-zinc-400"
      }
    >
      {formatComparisonLine(comparison)}
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
