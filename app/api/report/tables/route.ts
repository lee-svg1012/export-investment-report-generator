import { NextRequest, NextResponse } from "next/server";
import { buildReportTables } from "@/lib/stats/buildReportTables";
import { checkAggregationPeriod } from "@/lib/stats/checkAggregationPeriod";
import { parseStatsFile } from "@/lib/stats/parseStatsFile";
import { computeComparison } from "@/lib/report/computeComparison";

// DESIGN.md §2 "FDI 현황 표 / 국내투자 현황 표 각각 완성" + 예외 규칙(집계 기간 비교) 구간.
// (nice) compareFile이 있으면 PRD nice 3 "전월/전년 대비 증감률"도 함께 계산한다.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fdiFile = formData.get("fdiFile");
  const tradeFile = formData.get("tradeFile");
  const compareFile = formData.get("compareFile");

  if (!(fdiFile instanceof File) || !(tradeFile instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "수출입은행 해외투자통계와 산업통상부 수출입 통계 파일이 모두 필요합니다.",
          row: 0,
          column: "",
        },
      },
      { status: 400 },
    );
  }

  const tables = await buildReportTables(fdiFile, tradeFile);
  const ok = tables.fdi.ok && tables.trade.ok;
  const aggregationPeriodMismatch = ok
    ? checkAggregationPeriod(tables.fdi, tables.trade)
    : null;

  const compareTable =
    compareFile instanceof File ? await parseStatsFile(compareFile) : null;
  const comparison = ok
    ? {
        fdi: computeComparison(
          "해외직접투자(FDI) 현황",
          tables.fdi,
          compareTable?.ok ? compareTable : null,
        ),
        trade: computeComparison(
          "국내투자 현황",
          tables.trade,
          compareTable?.ok ? compareTable : null,
        ),
      }
    : null;

  return NextResponse.json(
    { ok, ...tables, aggregationPeriodMismatch, comparison },
    { status: ok ? 200 : 400 },
  );
}
