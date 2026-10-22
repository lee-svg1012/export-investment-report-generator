import { NextResponse } from "next/server";
import { getReport } from "@/lib/report/getReport";
import { exportWord } from "@/lib/report/exportWord";

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/report/[id]/word">,
) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) {
    return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
  }

  const buffer = await exportWord(report);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="report-${id}.docx"`,
    },
  });
}
