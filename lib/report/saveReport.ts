import { nanoid } from "nanoid";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { ParseResult } from "@/lib/stats/parseStatsFile";
import type { AggregationPeriodMismatchRecord, ComparisonRecord } from "./reportRecord";

export async function saveReport(input: {
  fdiFile: File;
  tradeFile: File;
  fdiTable: ParseResult;
  tradeTable: ParseResult;
  headline: string;
  summary: string;
  yearly: string;
  aggregationPeriodMismatch: AggregationPeriodMismatchRecord;
  comparison: ComparisonRecord;
}): Promise<string> {
  const supabase = getSupabaseServerClient();
  // nanoid 기본 생성기·기본 길이(21자) 그대로 사용 — 추측 불가능한 비공개 링크 ID (보안 점검 SEC-1).
  const id = nanoid();

  const [fdiUpload, tradeUpload] = await Promise.all([
    supabase.storage
      .from("report-files")
      .upload(`${id}/fdi-${input.fdiFile.name}`, input.fdiFile),
    supabase.storage
      .from("report-files")
      .upload(`${id}/trade-${input.tradeFile.name}`, input.tradeFile),
  ]);
  if (fdiUpload.error || tradeUpload.error) {
    throw new Error(
      `원본 파일 저장 실패: ${fdiUpload.error?.message ?? tradeUpload.error?.message}`,
    );
  }

  const { error } = await supabase.from("reports").insert({
    id,
    fdi_table: input.fdiTable,
    trade_table: input.tradeTable,
    headline: input.headline,
    summary: input.summary,
    yearly: input.yearly,
    aggregation_period_mismatch: input.aggregationPeriodMismatch,
    comparison: input.comparison,
  });
  if (error) {
    throw new Error(`보고서 저장 실패: ${error.message}`);
  }

  return id;
}
