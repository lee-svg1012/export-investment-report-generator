import type { ParseResult } from "@/lib/stats/parseStatsFile";
import type { ComparisonResult } from "./computeComparison";

export type AggregationPeriodMismatchRecord = {
  message: string;
  fdiPeriods: string[];
  tradePeriods: string[];
} | null;

export type ComparisonRecord = {
  fdi: ComparisonResult;
  trade: ComparisonResult;
} | null;

export type ReportRecord = {
  id: string;
  fdiTable: ParseResult;
  tradeTable: ParseResult;
  headline: string;
  summary: string;
  yearly: string;
  aggregationPeriodMismatch: AggregationPeriodMismatchRecord;
  comparison: ComparisonRecord;
};
