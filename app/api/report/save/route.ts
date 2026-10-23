import { NextRequest, NextResponse } from "next/server";
import { saveReport } from "@/lib/report/saveReport";
import { MAX_FILE_SIZE_BYTES, formatMaxFileSize } from "@/lib/stats/fileLimits";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

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

  // /api/report/tables를 거치지 않고 이 엔드포인트를 직접 호출하는 경우를 대비해
  // 저장(Storage 업로드) 직전에도 용량 상한을 독립적으로 재검사한다.
  if (fdiFile.size > MAX_FILE_SIZE_BYTES || tradeFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: `파일 용량이 너무 큽니다 (${formatMaxFileSize()} 이하만 업로드할 수 있습니다).` },
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
