"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ParsedRow } from "@/lib/stats/parseStatsFile";

function formatAxisTick(value: number): string {
  return Math.round(value).toLocaleString();
}

export function StatsLineChart({
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
      <LineChart data={rows}>
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
        <Line
          type="monotone"
          dataKey={valueColumn}
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: "#22c55e", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
