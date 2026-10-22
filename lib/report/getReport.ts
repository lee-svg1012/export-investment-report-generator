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
    aggregationPeriodMismatch: data.aggregation_period_mismatch,
    comparison: data.comparison,
  };
}
