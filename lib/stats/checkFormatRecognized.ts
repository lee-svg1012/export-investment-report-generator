import { ParseResult } from "./parseStatsFile";
import { pickChartColumns } from "./pickChartColumns";

// PRD 5장 예외 처리 규칙: "통계 양식(열 구성 등)이 기존과 달라져 정상적으로 읽히지 않는 경우,
// 추측으로 억지로 맞추지 않고 '통계 양식이 달라진 것으로 보인다'는 오류를 띄운다."
// 숫자 값이 들어있는 열을 하나도 찾지 못하면(pickChartColumns가 null) 양식이 달라진 것으로 보고
// 조용히 차트·해설을 생략하는 대신 명시적인 오류로 바꾼다.
export function checkFormatRecognized(table: ParseResult): ParseResult {
  if (!table.ok) return table;
  if (pickChartColumns(table)) return table;

  return {
    ok: false,
    error: {
      message:
        "통계 양식이 기존과 달라진 것으로 보입니다 (숫자 값이 들어있는 열을 찾을 수 없습니다). 파일의 열 구성을 확인해주세요.",
      row: 0,
      column: "",
    },
  };
}
