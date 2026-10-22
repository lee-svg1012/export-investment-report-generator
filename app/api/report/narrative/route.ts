import { NextRequest, NextResponse } from "next/server";
import type { ParseResult } from "@/lib/stats/parseStatsFile";
import { computeSeriesFacts } from "@/lib/report/computeSeriesFacts";
import { buildHeadline } from "@/lib/report/buildHeadline";
import { generateNarrative } from "@/lib/report/generateNarrative";

// PLAN.md 11번: 8개 항목 중 1(제목)·2(요약)·3(연도별 동향)만 다룬다.
// 4~6번(업종별·지역별·국가별)은 업로드 데이터에 구분 열이 있는지 알 수 없어 생략하고,
// 7~8번(종합평가·정부입장)은 통계만으로 지어낼 수 없는 내용이라 AI로 생성하지 않는다.
// 클라이언트는 /api/report/tables로 먼저 집계기간 등을 확인·승인받은 뒤에만 이 라우트를 부른다.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const fdi: ParseResult | undefined = body?.fdi;
  const trade: ParseResult | undefined = body?.trade;

  if (!fdi?.ok || !trade?.ok) {
    return NextResponse.json(
      { ok: false, error: "파싱이 완료된 표 데이터가 필요합니다." },
      { status: 400 },
    );
  }

  const fdiFacts = computeSeriesFacts("해외직접투자(FDI) 현황", fdi);
  const tradeFacts = computeSeriesFacts("국내투자 현황", trade);
  const headline = buildHeadline(fdiFacts, tradeFacts);

  const narrative = await generateNarrative({ fdi: fdiFacts, trade: tradeFacts });
  if (!narrative.ok) {
    return NextResponse.json({ ok: false, error: narrative.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    headline,
    summary: narrative.summary,
    yearly: narrative.yearly,
  });
}
