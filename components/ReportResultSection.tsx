import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { pickChartColumns } from "@/lib/stats/pickChartColumns";
import type { RowComparison } from "@/lib/report/computeRowComparisons";
import { StatsChart } from "./StatsChart";
import { StatsTable } from "./StatsTable";

export function ReportResultSection({
  title,
  table,
  comparison,
}: {
  title: string;
  table: ParseResult;
  comparison?: RowComparison[] | null;
}) {
  if (!table.ok) return null;
  const chartColumns = pickChartColumns(table);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <h2 className="font-medium text-white">{title}</h2>
      <StatsTable table={table} comparison={comparison} />
      {chartColumns && (
        <StatsChart
          rows={table.rows}
          labelColumn={chartColumns.labelColumn}
          valueColumn={chartColumns.valueColumn}
        />
      )}
    </section>
  );
}
