import { NextRequest, NextResponse } from "next/server";
import { buildReportTables } from "@/lib/stats/buildReportTables";
import { checkAggregationPeriod } from "@/lib/stats/checkAggregationPeriod";
import { parseStatsFile } from "@/lib/stats/parseStatsFile";
import { computeComparison } from "@/lib/report/computeComparison";

// DESIGN.md §2 "FDI 현황 표 / 국내투자 현황 표 각각 완성" + 예외 규칙(집계 기간 비교) 구간.
// 산업통상부 자료(tradeFile)는 작성 주기가 FDI보다 길어 매번 있는 게 아니므로 선택(optional)이다 —
// 없으면 trade 관련 항목(국내투자 현황·비교·집계기간 불일치 점검)만 생략하고 FDI만으로 진행한다.
// (nice) compareFile이 있으면 PRD nice 3 "전월/전년 대비 증감률"도 함께 계산한다.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fdiFile = formData.get("fdiFile");
  const tradeFileRaw = formData.get("tradeFile");
  const compareFile = formData.get("compareFile");

  if (!(fdiFile instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "수출입은행 해외투자통계(FDI) 파일이 필요합니다.",
          row: 0,
          column: "",
        },
      },
      { status: 400 },
    );
  }
  const tradeFile = tradeFileRaw instanceof File ? tradeFileRaw : null;

  const tables = await buildReportTables(fdiFile, tradeFile);
  const ok = tables.fdi.ok;
  const aggregationPeriodMismatch =
    ok && tables.trade?.ok ? checkAggregationPeriod(tables.fdi, tables.trade) : null;

  const compareTable =
    compareFile instanceof File ? await parseStatsFile(compareFile) : null;
  const comparison = ok
    ? {
        fdi: computeComparison(
          "해외직접투자(FDI) 현황",
          tables.fdi,
          compareTable?.ok ? compareTable : null,
        ),
        trade: tables.trade?.ok
          ? computeComparison("국내투자 현황", tables.trade, compareTable?.ok ? compareTable : null)
          : { available: false as const },
      }
    : null;

  return NextResponse.json(
    { ok, ...tables, aggregationPeriodMismatch, comparison },
    { status: ok ? 200 : 400 },
  );
}
