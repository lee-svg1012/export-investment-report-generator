import type { ParseResult } from "@/lib/stats/parseStatsFile";

export type AggregationPeriodMismatchRecord = {
  message: string;
  fdiPeriods: string[];
  tradePeriods: string[];
} | null;

export type ReportRecord = {
  id: string;
  fdiTable: ParseResult;
  tradeTable: ParseResult;
  headline: string;
  summary: string;
  yearly: string;
  aggregationPeriodMismatch: AggregationPeriodMismatchRecord;
};
