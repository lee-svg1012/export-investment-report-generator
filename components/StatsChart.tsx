"use client";

import { useState } from "react";
import type { ParsedRow } from "@/lib/stats/parseStatsFile";
import { StatsBarChart } from "./StatsBarChart";
import { StatsLineChart } from "./StatsLineChart";

// DESIGN.md가 애초에 "막대그래프·선그래프"라고 적었던 것을 반영해 선그래프 옵션을 추가(2026-10-23).
export function StatsChart({
  rows,
  labelColumn,
  valueColumn,
}: {
  rows: ParsedRow[];
  labelColumn: string;
  valueColumn: string;
}) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 self-end text-xs">
        <button
          type="button"
          onClick={() => setChartType("bar")}
          className={
            chartType === "bar"
              ? "rounded-full bg-foreground px-3 py-1 text-background"
              : "rounded-full border border-white/15 px-3 py-1 text-zinc-300 transition-colors hover:border-white/30"
          }
        >
          막대그래프
        </button>
        <button
          type="button"
          onClick={() => setChartType("line")}
          className={
            chartType === "line"
              ? "rounded-full bg-foreground px-3 py-1 text-background"
              : "rounded-full border border-white/15 px-3 py-1 text-zinc-300 transition-colors hover:border-white/30"
          }
        >
          선그래프
        </button>
      </div>
      {chartType === "bar" ? (
        <StatsBarChart rows={rows} labelColumn={labelColumn} valueColumn={valueColumn} />
      ) : (
        <StatsLineChart rows={rows} labelColumn={labelColumn} valueColumn={valueColumn} />
      )}
    </div>
  );
}
