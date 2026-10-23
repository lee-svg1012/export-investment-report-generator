import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ReportRecord } from "./reportRecord";
import { formatComparisonLine } from "./formatComparisonLine";

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

function StatsTablePdf({ table }: { table: ReportRecord["fdiTable"] }) {
  if (!table.ok) return null;
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        {table.columns.map((column) => (
          <Text key={column} style={styles.cellHeader}>
            {column}
          </Text>
        ))}
      </View>
      {table.rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {table.columns.map((column) => (
            <Text key={column} style={styles.cell}>
              {String(row[column])}
            </Text>
          ))}
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
        <StatsTablePdf table={report.fdiTable} />
        <Text style={styles.p}>{formatComparisonLine(report.comparison?.fdi)}</Text>

        {report.tradeTable ? (
          <>
            <Text style={styles.h2}>국내투자 현황</Text>
            <StatsTablePdf table={report.tradeTable} />
            <Text style={styles.p}>{formatComparisonLine(report.comparison?.trade)}</Text>
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
