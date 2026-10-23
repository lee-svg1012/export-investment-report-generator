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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelColumn} />
        <YAxis orientation="right" tickFormatter={formatAxisTick} />
        <Tooltip />
        <Bar dataKey={valueColumn} fill="#171717" />
      </BarChart>
    </ResponsiveContainer>
  );
}
