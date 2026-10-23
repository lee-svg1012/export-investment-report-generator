"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ParsedRow } from "@/lib/stats/parseStatsFile";

function formatAxisTick(value: number): string {
  return Math.round(value).toLocaleString();
}

export function StatsBarChart({
  rows,
  labelColumn,
  valueColumn,
}: {
  rows: ParsedRow[];
  labelColumn: string;
  valueColumn: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey={labelColumn} stroke="rgba(255,255,255,0.3)" tick={{ fill: "#a1a1aa" }} />
        <YAxis
          orientation="right"
          tickFormatter={formatAxisTick}
          stroke="rgba(255,255,255,0.3)"
          tick={{ fill: "#a1a1aa" }}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
          }}
          labelStyle={{ color: "#f4f4f5" }}
          itemStyle={{ color: "#4ade80" }}
        />
        <Bar dataKey={valueColumn} fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
