import { NextRequest, NextResponse } from "next/server";
import { parseStatsFile } from "@/lib/stats/parseStatsFile";

// DESIGN.md §2 데이터 흐름의 "형식 확인 → 파싱 → 표 완성" 구간만 담당하는 라우트.
// "보고서 생성" 버튼 연동, 예외 규칙(집계 기간 등), 저장은 다음 단계에서 이어 붙인다.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: { message: "파일이 없습니다.", row: 0, column: "" } },
      { status: 400 },
    );
  }

  const result = await parseStatsFile(file);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
