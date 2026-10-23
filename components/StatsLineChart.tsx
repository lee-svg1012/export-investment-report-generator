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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelColumn} />
        <YAxis orientation="right" tickFormatter={formatAxisTick} />
        <Tooltip />
        <Line type="monotone" dataKey={valueColumn} stroke="#171717" />
      </LineChart>
    </ResponsiveContainer>
  );
}
