import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
} from "docx";
import type { ReportRecord } from "./reportRecord";
import { formatComparisonLine } from "./formatComparisonLine";

function buildStatsTable(table: ReportRecord["fdiTable"]): (Table | Paragraph)[] {
  if (!table.ok) return [];

  const headerRow = new TableRow({
    children: table.columns.map(
      (column) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: column, bold: true })] })],
        }),
    ),
  });

  const dataRows = table.rows.map(
    (row) =>
      new TableRow({
        children: table.columns.map(
          (column) =>
            new TableCell({
              children: [new Paragraph(String(row[column]))],
            }),
        ),
      }),
  );

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }),
  ];
}

export async function exportWord(report: ReportRecord): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: report.headline, heading: HeadingLevel.HEADING_1 }),
          new Paragraph(report.summary),
          new Paragraph(report.yearly),

          new Paragraph({ text: "해외직접투자(FDI) 현황", heading: HeadingLevel.HEADING_2 }),
          ...buildStatsTable(report.fdiTable),
          new Paragraph(formatComparisonLine(report.comparison?.fdi)),

          ...(report.tradeTable
            ? [
                new Paragraph({ text: "국내투자 현황", heading: HeadingLevel.HEADING_2 }),
                ...buildStatsTable(report.tradeTable),
                new Paragraph(formatComparisonLine(report.comparison?.trade)),
              ]
            : [
                new Paragraph({
                  text: "산업통상부 수출입 통계 파일이 첨부되지 않아 국내투자 현황 항목은 생략되었습니다.",
                }),
              ]),

          new Paragraph({
            text:
              "업종별·지역별·국가별 동향은 업로드 데이터에서 해당 구분을 알 수 없어 생략되었습니다. " +
              "종합 평가·전망, 정부 입장 및 담당 부서는 통계만으로 자동 생성할 수 없는 항목이라 직접 작성이 필요합니다.",
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
