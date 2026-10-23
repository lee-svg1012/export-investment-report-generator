import { parseStatsFile, ParseResult } from "./parseStatsFile";

export type ReportTables = {
  // 해외직접투자(FDI) 현황 표 — 수출입은행 해외투자통계 (필수, PRD 1·4장)
  fdi: ParseResult;
  // 국내투자 현황 표 — 산업통상부 수출입 통계 (선택: 업로드 안 하면 null, PRD 4장)
  trade: ParseResult | null;
};

// DESIGN.md §2 "해외직접투자(FDI) 현황 표 / 국내투자 현황 표 각각 완성" 단계.
// 두 표는 PRD 1장 정의대로 항상 따로 나열되므로 하나로 합치지 않고 각각 반환한다.
// tradeFile은 산업통상부 자료가 FDI보다 작성 주기가 길어 매번 있는 게 아니므로 선택이다.
export async function buildReportTables(
  fdiFile: File,
  tradeFile: File | null,
): Promise<ReportTables> {
  const [fdi, trade] = await Promise.all([
    parseStatsFile(fdiFile),
    tradeFile ? parseStatsFile(tradeFile) : Promise.resolve(null),
  ]);
  return { fdi, trade };
}
