import { NextRequest, NextResponse } from "next/server";
import { saveReport } from "@/lib/report/saveReport";

// PLAN.md 13번: 업로드 원본 파일(Storage) + 표·해설(DB)을 묶어 저장하고 비공개 링크용 id를 발급한다.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fdiFile = formData.get("fdiFile");
  const tradeFile = formData.get("tradeFile");
  const payloadRaw = formData.get("payload");

  if (
    !(fdiFile instanceof File) ||
    !(tradeFile instanceof File) ||
    typeof payloadRaw !== "string"
  ) {
    return NextResponse.json(
      { ok: false, error: "저장에 필요한 데이터가 부족합니다." },
      { status: 400 },
    );
  }

  const payload = JSON.parse(payloadRaw);

  try {
    const id = await saveReport({
      fdiFile,
      tradeFile,
      fdiTable: payload.fdiTable,
      tradeTable: payload.tradeTable,
      headline: payload.headline,
      summary: payload.summary,
      yearly: payload.yearly,
      aggregationPeriodMismatch: payload.aggregationPeriodMismatch,
      comparison: payload.comparison ?? null,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
