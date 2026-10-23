import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { ReportRecord } from "./reportRecord";

export async function getReport(id: string): Promise<ReportRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    fdiTable: data.fdi_table,
    tradeTable: data.trade_table,
    headline: data.headline,
    summary: data.summary,
    yearly: data.yearly,
    // 이 기능(국가별 동향) 이전에 저장된 보고서는 해당 컬럼이 비어있을 수 있다.
    byCategory: data.by_category ?? "",
    fdiCategoryTable: data.fdi_category_table ?? null,
    fdiCategoryColumn: data.fdi_category_column ?? null,
    tradeCategoryTable: data.trade_category_table ?? null,
    tradeCategoryColumn: data.trade_category_column ?? null,
    aggregationPeriodMismatch: data.aggregation_period_mismatch,
    comparison: data.comparison,
  };
}
