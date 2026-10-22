import { NextRequest, NextResponse } from "next/server";
import { buildReportTables } from "@/lib/stats/buildReportTables";
import { checkAggregationPeriod } from "@/lib/stats/checkAggregationPeriod";

// DESIGN.md §2 "FDI 현황 표 / 국내투자 현황 표 각각 완성" + 예외 규칙(집계 기간 비교) 구간.
// "보고서 생성" 버튼 연동과 "계속 진행?" 확인 UI는 다음 단계에서 이어 붙인다.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fdiFile = formData.get("fdiFile");
  const tradeFile = formData.get("tradeFile");

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

  return NextResponse.json(
    { ok, ...tables, aggregationPeriodMismatch },
    { status: ok ? 200 : 400 },
  );
}
