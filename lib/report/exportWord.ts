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
import type { RowComparison } from "./computeRowComparisons";

function formatRowComparison(comparison: RowComparison | undefined): string {
  if (!comparison || !comparison.available) return "비교 데이터 없음";
  return comparison.percent === null ? "계산할 수 없음 (비교 값 0)" : `${comparison.percent.toFixed(1)}%`;
}

// 증감률을 표 전체 요약 한 줄이 아니라 행마다 보여주기로 결정(2026-10-23) — 비교 파일을
// 아예 안 올렸으면(comparison이 null/undefined) 증감률 열 자체를 추가하지 않는다.
function buildStatsTable(
  table: ReportRecord["fdiTable"],
  comparison?: RowComparison[] | null,
): (Table | Paragraph)[] {
  if (!table.ok) return [];
  const showComparisonColumn = Array.isArray(comparison);
  const headerCells = table.columns.map(
    (column) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: column, bold: true })] })],
      }),
  );
  if (showComparisonColumn) {
    headerCells.push(
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: "전기 대비 증감률", bold: true })] }),
        ],
      }),
    );
  }
  const headerRow = new TableRow({ children: headerCells });

  const dataRows = table.rows.map((row, i) => {
    const cells = table.columns.map(
      (column) =>
        new TableCell({
          children: [new Paragraph(String(row[column]))],
        }),
    );
    if (showComparisonColumn) {
      cells.push(new TableCell({ children: [new Paragraph(formatRowComparison(comparison[i]))] }));
    }
    return new TableRow({ children: cells });
  });

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
          ...buildStatsTable(report.fdiTable, report.comparison?.fdi),

          ...(report.tradeTable
            ? [
                new Paragraph({ text: "국내투자 현황", heading: HeadingLevel.HEADING_2 }),
                ...buildStatsTable(report.tradeTable, report.comparison?.trade),
              ]
            : [
                new Paragraph({
                  text: "산업통상부 수출입 통계 파일이 첨부되지 않아 국내투자 현황 항목은 생략되었습니다.",
                }),
              ]),

          ...(report.fdiCategoryTable || report.tradeCategoryTable
            ? [
                new Paragraph({
                  text: `${report.fdiCategoryColumn ?? report.tradeCategoryColumn}별 동향`,
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph(report.byCategory),
                ...(report.fdiCategoryTable
                  ? [
                      new Paragraph({
                        text: `해외직접투자(FDI) — ${report.fdiCategoryColumn}별`,
                        heading: HeadingLevel.HEADING_3,
                      }),
                      ...buildStatsTable(report.fdiCategoryTable),
                    ]
                  : []),
                ...(report.tradeCategoryTable
                  ? [
                      new Paragraph({
                        text: `국내투자 — ${report.tradeCategoryColumn}별`,
                        heading: HeadingLevel.HEADING_3,
                      }),
                      ...buildStatsTable(report.tradeCategoryTable),
                    ]
                  : []),
              ]
            : []),

          new Paragraph({
            text:
              "업종별·지역별 동향은 업로드 데이터에서 해당 구분을 알 수 없어 생략되었습니다." +
              (!report.fdiCategoryTable && !report.tradeCategoryTable
                ? " 국가별 동향도 같은 이유로 생략되었습니다."
                : "") +
              " 종합 평가·전망, 정부 입장 및 담당 부서는 통계만으로 자동 생성할 수 없는 항목이라 직접 작성이 필요합니다.",
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
