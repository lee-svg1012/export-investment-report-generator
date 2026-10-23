import { NextRequest, NextResponse } from "next/server";
import { saveReport } from "@/lib/report/saveReport";
import { MAX_FILE_SIZE_BYTES, formatMaxFileSize } from "@/lib/stats/fileLimits";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { reportPayloadSchema } from "@/lib/report/reportPayloadSchema";

// PLAN.md 13번: 업로드 원본 파일(Storage) + 표·해설(DB)을 묶어 저장하고 비공개 링크용 id를 발급한다.
const RATE_LIMIT = 20; // IP당 1분에 20회 — Storage 업로드·DB insert 남용 방어
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`save:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const formData = await request.formData();
  const fdiFile = formData.get("fdiFile");
  const tradeFileRaw = formData.get("tradeFile");
  const payloadRaw = formData.get("payload");

  if (!(fdiFile instanceof File) || typeof payloadRaw !== "string") {
    return NextResponse.json(
      { ok: false, error: "저장에 필요한 데이터가 부족합니다." },
      { status: 400 },
    );
  }
  // 산업통상부 자료는 선택 업로드이므로 없을 수 있다.
  const tradeFile = tradeFileRaw instanceof File ? tradeFileRaw : null;

  // /api/report/tables를 거치지 않고 이 엔드포인트를 직접 호출하는 경우를 대비해
  // 저장(Storage 업로드) 직전에도 용량 상한을 독립적으로 재검사한다.
  if (fdiFile.size > MAX_FILE_SIZE_BYTES || (tradeFile && tradeFile.size > MAX_FILE_SIZE_BYTES)) {
    return NextResponse.json(
      { ok: false, error: `파일 용량이 너무 큽니다 (${formatMaxFileSize()} 이하만 업로드할 수 있습니다).` },
      { status: 400 },
    );
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadRaw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "payload가 올바른 JSON 형식이 아닙니다." },
      { status: 400 },
    );
  }

  const parsed = reportPayloadSchema.safeParse(payloadJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "payload 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  const payload = parsed.data;

  try {
    const id = await saveReport({
      fdiFile,
      tradeFile,
      fdiTable: payload.fdiTable,
      tradeTable: payload.tradeTable,
      headline: payload.headline,
      summary: payload.summary,
      yearly: payload.yearly,
      byCategory: payload.byCategory,
      fdiCategoryTable: payload.fdiCategoryTable,
      fdiCategoryColumn: payload.fdiCategoryColumn,
      tradeCategoryTable: payload.tradeCategoryTable,
      tradeCategoryColumn: payload.tradeCategoryColumn,
      aggregationPeriodMismatch: payload.aggregationPeriodMismatch,
      comparison: payload.comparison,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    // 보안 점검 결과: Supabase 내부 에러 메시지(테이블·컬럼명 등)를 그대로 클라이언트에 주면 안 된다.
    // 상세 내용은 서버 로그로만 남기고, 클라이언트에는 일반화된 메시지만 전달한다.
    console.error("[api/report/save] 보고서 저장 실패:", err);
    return NextResponse.json(
      { ok: false, error: "보고서 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
