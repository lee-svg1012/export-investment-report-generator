import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// PRD 7장 "데이터 저장·접근 방침": 보관 기간을 90일로 확정(2026-10-23 사용자 결정).
// 90일이 지난 보고서는 Storage 원본 파일 + DB 레코드를 함께 삭제한다.
// Vercel Cron이 매일 호출하며(vercel.json), 삭제는 되돌릴 수 없으므로 CRON_SECRET으로
// 외부에서 함부로 호출하지 못하도록 막는다.
const RETENTION_DAYS = 90;

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: expired, error: selectError } = await supabase
    .from("reports")
    .select("id")
    .lt("created_at", cutoff);

  if (selectError) {
    console.error("[cron/cleanup-expired-reports] 만료 보고서 조회 실패:", selectError);
    return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });
  }

  let deletedCount = 0;
  for (const report of expired ?? []) {
    const { data: files } = await supabase.storage.from("report-files").list(report.id);
    if (files && files.length > 0) {
      await supabase.storage
        .from("report-files")
        .remove(files.map((file) => `${report.id}/${file.name}`));
    }

    const { error: deleteError } = await supabase.from("reports").delete().eq("id", report.id);
    if (deleteError) {
      console.error(`[cron/cleanup-expired-reports] ${report.id} 삭제 실패:`, deleteError);
      continue;
    }
    deletedCount += 1;
  }

  return NextResponse.json({ ok: true, checkedCount: expired?.length ?? 0, deletedCount });
}
