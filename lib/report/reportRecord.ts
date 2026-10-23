import type { ParseResult } from "@/lib/stats/parseStatsFile";
import type { RowComparison } from "./computeRowComparisons";

export type AggregationPeriodMismatchRecord = {
  message: string;
  fdiPeriods: string[];
  tradePeriods: string[];
} | null;

// fdi/trade 각각 표의 행과 1:1로 대응하는 증감률 배열 — 비교 파일이 없으면 null(열 자체를 숨김).
export type ComparisonRecord = {
  fdi: RowComparison[] | null;
  trade: RowComparison[] | null;
} | null;

export type ReportRecord = {
  id: string;
  fdiTable: ParseResult;
  // 산업통상부 자료는 선택 업로드라 없으면 null (PRD 4장 "주 사용 패턴" 참고)
  tradeTable: ParseResult | null;
  headline: string;
  summary: string;
  yearly: string;
  // PRD "국가별 동향": 업로드 파일에 실제 분류 열(국가 등)이 있을 때만 채워진다.
  byCategory: string;
  fdiCategoryTable: ParseResult | null;
  fdiCategoryColumn: string | null;
  tradeCategoryTable: ParseResult | null;
  tradeCategoryColumn: string | null;
  aggregationPeriodMismatch: AggregationPeriodMismatchRecord;
  comparison: ComparisonRecord;
};
