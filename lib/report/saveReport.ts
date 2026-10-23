import { nanoid } from "nanoid";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { ParseResult } from "@/lib/stats/parseStatsFile";
import type { AggregationPeriodMismatchRecord, ComparisonRecord } from "./reportRecord";

// 원본 파일명(한글·공백 포함)을 Storage 키에 그대로 쓰면 Supabase Storage가
// "Invalid key"로 거부한다(저장 실패의 실제 원인, 2026-10-23 로그로 확인). 저장 이후
// 원본 파일명을 다시 쓰는 곳이 없으므로, 확장자만 남긴 안전한 키로 바꾼다.
function getFileExtension(filename: string): string {
  const match = filename.match(/\.[A-Za-z0-9]+$/);
  return match ? match[0] : "";
}

export async function saveReport(input: {
  fdiFile: File;
  tradeFile: File | null;
  fdiTable: ParseResult;
  tradeTable: ParseResult | null;
  headline: string;
  summary: string;
  yearly: string;
  aggregationPeriodMismatch: AggregationPeriodMismatchRecord;
  comparison: ComparisonRecord;
}): Promise<string> {
  const supabase = getSupabaseServerClient();
  // nanoid 기본 생성기·기본 길이(21자) 그대로 사용 — 추측 불가능한 비공개 링크 ID (보안 점검 SEC-1).
  const id = nanoid();

  // tradeFile은 선택 업로드이므로 있을 때만 Storage에 올린다.
  const uploads = [
    supabase.storage
      .from("report-files")
      .upload(`${id}/fdi${getFileExtension(input.fdiFile.name)}`, input.fdiFile),
    ...(input.tradeFile
      ? [
          supabase.storage
            .from("report-files")
            .upload(`${id}/trade${getFileExtension(input.tradeFile.name)}`, input.tradeFile),
        ]
      : []),
  ];
  const uploadResults = await Promise.all(uploads);
  const failedUpload = uploadResults.find((result) => result.error);
  if (failedUpload) {
    throw new Error(`원본 파일 저장 실패: ${failedUpload.error?.message}`);
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
