import { NextRequest, NextResponse } from "next/server";
import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { computeSeriesFacts } from "@/lib/report/computeSeriesFacts";
import { computeCategoryBreakdown } from "@/lib/report/computeCategoryBreakdown";
import { buildHeadline } from "@/lib/report/buildHeadline";
import { generateNarrative } from "@/lib/report/generateNarrative";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// PLAN.md 11번: 8개 항목 중 1(제목)·2(요약)·3(연도별 동향)을 다루고, 업로드 파일에 국가·업종
// 같은 실제 분류 열이 있으면 6(국가별 동향)도 그 열로 자동 생성한다(2026-10-24 추가 — 실제
// 파일에 "국가" 열이 있는 것을 확인). 4·5(업종별·지역별)는 그런 열이 없으면 여전히 생략하고,
// 7~8번(종합평가·정부입장)은 통계만으로 지어낼 수 없는 내용이라 AI로 생성하지 않는다.
// 클라이언트는 /api/report/tables로 먼저 집계기간 등을 확인·승인받은 뒤에만 이 라우트를 부른다.
const RATE_LIMIT = 10; // IP당 1분에 10회 — OpenAI 호출 과금 방어
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(
    `narrative:${ip}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 본문이 올바른 JSON 형식이 아닙니다." },
      { status: 400 },
    );
  }

  const parsedBody = body as { fdi?: ParseResult; trade?: ParseResult | null };
  const fdi = parsedBody?.fdi;
  const trade = parsedBody?.trade;

  if (!fdi?.ok) {
    return NextResponse.json(
      { ok: false, error: "파싱이 완료된 FDI 표 데이터가 필요합니다." },
      { status: 400 },
    );
  }

  const fdiFacts = computeSeriesFacts("해외직접투자(FDI) 현황", fdi);
  // 산업통상부 자료(trade)는 선택이라 없을 수 있다 — 그 경우 FDI 수치만으로 해설을 생성한다.
  const tradeFacts = trade?.ok ? computeSeriesFacts("국내투자 현황", trade) : null;
  const headline = buildHeadline(fdiFacts, tradeFacts);

  const fdiCategoryBreakdown = computeCategoryBreakdown(fdi);
  const tradeCategoryBreakdown = trade?.ok ? computeCategoryBreakdown(trade) : null;

  const narrative = await generateNarrative({
    fdi: fdiFacts,
    trade: tradeFacts,
    fdiCategoryColumn: fdiCategoryBreakdown?.categoryColumn ?? null,
    fdiCategories: fdiCategoryBreakdown?.categories ?? null,
    tradeCategoryColumn: tradeCategoryBreakdown?.categoryColumn ?? null,
    tradeCategories: tradeCategoryBreakdown?.categories ?? null,
  });
  if (!narrative.ok) {
    return NextResponse.json({ ok: false, error: narrative.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    headline,
    summary: narrative.summary,
    yearly: narrative.yearly,
    byCategory: narrative.byCategory,
    fdiCategoryTable: fdiCategoryBreakdown?.table ?? null,
    fdiCategoryColumn: fdiCategoryBreakdown?.categoryColumn ?? null,
    tradeCategoryTable: tradeCategoryBreakdown?.table ?? null,
    tradeCategoryColumn: tradeCategoryBreakdown?.categoryColumn ?? null,
  });
}
