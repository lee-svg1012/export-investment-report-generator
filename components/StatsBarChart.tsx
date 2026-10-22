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
        <YAxis />
        <Tooltip />
        <Bar dataKey={valueColumn} fill="#171717" />
      </BarChart>
    </ResponsiveContainer>
  );
}
