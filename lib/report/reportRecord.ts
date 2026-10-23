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
  // 산업통상부 자료는 선택 업로드라 없으면 null (PRD 4장 "주 사용 패턴" 참고)
  tradeTable: ParseResult | null;
  headline: string;
  summary: string;
  yearly: string;
  aggregationPeriodMismatch: AggregationPeriodMismatchRecord;
  comparison: ComparisonRecord;
};
