import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ReportRecord } from "./reportRecord";
import type { RowComparison } from "./computeRowComparisons";

function formatRowComparison(comparison: RowComparison | undefined): string {
  if (!comparison || !comparison.available) return "비교 데이터 없음";
  return comparison.percent === null ? "계산할 수 없음 (비교 값 0)" : `${comparison.percent.toFixed(1)}%`;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11 },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  p: { marginBottom: 6, lineHeight: 1.4 },
  table: { display: "flex", width: "auto", marginBottom: 6 },
  row: { flexDirection: "row" },
  cellHeader: {
    flex: 1,
    borderBottom: 1,
    borderColor: "#999",
    padding: 4,
    fontWeight: 700,
  },
  cell: { flex: 1, borderBottom: 1, borderColor: "#ddd", padding: 4 },
});

// 증감률을 표 전체 요약 한 줄이 아니라 행마다 보여주기로 결정(2026-10-23) — 비교 파일을
// 아예 안 올렸으면(comparison이 null/undefined) 증감률 열 자체를 추가하지 않는다.
function StatsTablePdf({
  table,
  comparison,
}: {
  table: ReportRecord["fdiTable"];
  comparison?: RowComparison[] | null;
}) {
  if (!table.ok) return null;
  const showComparisonColumn = Array.isArray(comparison);
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        {table.columns.map((column) => (
          <Text key={column} style={styles.cellHeader}>
            {column}
          </Text>
        ))}
        {showComparisonColumn && <Text style={styles.cellHeader}>전기 대비 증감률</Text>}
      </View>
      {table.rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {table.columns.map((column) => (
            <Text key={column} style={styles.cell}>
              {String(row[column])}
            </Text>
          ))}
          {showComparisonColumn && (
            <Text style={styles.cell}>{formatRowComparison(comparison[i])}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function ReportPdfDocument({ report }: { report: ReportRecord }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{report.headline}</Text>
        <Text style={styles.p}>{report.summary}</Text>
        <Text style={styles.p}>{report.yearly}</Text>

        <Text style={styles.h2}>해외직접투자(FDI) 현황</Text>
        <StatsTablePdf table={report.fdiTable} comparison={report.comparison?.fdi} />

        {report.tradeTable ? (
          <>
            <Text style={styles.h2}>국내투자 현황</Text>
            <StatsTablePdf table={report.tradeTable} comparison={report.comparison?.trade} />
          </>
        ) : (
          <Text style={styles.p}>
            산업통상부 수출입 통계 파일이 첨부되지 않아 국내투자 현황 항목은 생략되었습니다.
          </Text>
        )}

        <Text style={styles.p}>
          업종별·지역별·국가별 동향은 업로드 데이터에서 해당 구분을 알 수 없어 생략되었습니다.
          종합 평가·전망, 정부 입장 및 담당 부서는 통계만으로 자동 생성할 수 없는 항목이라
          직접 작성이 필요합니다.
        </Text>
      </Page>
    </Document>
  );
}

export async function exportPdf(report: ReportRecord): Promise<Buffer> {
  return renderToBuffer(<ReportPdfDocument report={report} />);
}
