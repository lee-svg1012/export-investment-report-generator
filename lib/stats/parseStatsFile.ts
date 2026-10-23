import * as XLSX from "xlsx";
import { MAX_FILE_SIZE_BYTES, MAX_ROWS, MAX_COLUMNS, formatMaxFileSize } from "./fileLimits";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export type ParsedRow = Record<string, string | number>;

export type ParseError = {
  message: string;
  row: number;
  column: string;
};

export type ParseResult =
  | { ok: true; columns: string[]; rows: ParsedRow[] }
  | { ok: false; error: ParseError };

function getExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

// PRD 5장 예외 처리 규칙: "결측치(빈 칸)·특수문자가 섞여 있는 경우 0이나 평균 등으로
// 임의로 채우지 않고 행·열을 짚어 안내한다." 날짜·구분 등 글자 값에 쓰이는 한글·영문·숫자·
// 공백·일반 구두점(-, _, (, ), /, ., ,)은 허용하고, 그 외 기호만 "특수문자"로 본다.
// 음수는 더 이상 이상값으로 보지 않는다(2026-10-23 확정) — 순투자 감소, 전년 대비 감소처럼
// 수출입·투자 통계에서 음수는 정상적으로 나오는 값이라 막으면 안 됨.
const SPECIAL_CHAR_REGEX = /[^\p{L}\p{N}\s\-_().,/]/u;

export function findAbnormalValue(value: string | number): string | null {
  if (typeof value === "number") return null;
  return SPECIAL_CHAR_REGEX.test(value) ? `값("${value}")에 특수문자가 포함되어 있습니다` : null;
}

// "국가"처럼 글자로 된 분류 열(업종·지역 등)은 대륙·권역 합계 행에서 원래 비어 있을 수
// 있어 결측치 검사에서 제외한다(2026-10-23, 사용자 확인). 다만 금액 같은 숫자 열까지
// 봐주면 계산식(Number(""))이 조용히 0으로 처리돼 PRD의 "수치를 임의로 만들어내지 않는다"
// 규칙을 어기게 되므로, 숫자 열은 지금처럼 계속 막는다. 열 이름을 하드코딩하지 않고, 그
// 열의 실제 값이 전부 숫자인지로 "숫자 열"인지를 판단한다 — 값이 하나라도 문자면 분류 열.
function isNumericColumn(
  dataRows: (string | number | null)[][],
  columnIndex: number,
): boolean {
  let sawValue = false;
  for (const row of dataRows) {
    const cell = row[columnIndex] ?? null;
    if (cell === null || cell === "") continue;
    sawValue = true;
    if (typeof cell !== "number") return false;
  }
  return sawValue;
}

// 설계(DESIGN.md §2)대로 "형식 확인 → 파싱 → 빈 값 검사" 순서를 하나의 함수로 처리한다.
// PRD 규칙: 빈 값/형식 오류는 추측으로 채우지 않고 몇 번째 행·열인지 구체적으로 안내한다.
export async function parseStatsFile(file: File): Promise<ParseResult> {
  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      ok: false,
      error: {
        message: `지원하지 않는 파일 형식입니다 (${
          extension || "확장자 없음"
        }). xlsx, xls, csv 파일만 업로드할 수 있습니다.`,
        row: 0,
        column: "",
      },
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        message: `파일 용량이 너무 큽니다 (${formatMaxFileSize()} 이하만 업로드할 수 있습니다).`,
        row: 0,
        column: "",
      },
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    if (extension === ".csv") {
      // CSV는 일반 텍스트라 file.text()로 UTF-8을 올바르게 디코딩해야 한글 헤더/값이
      // 깨지지 않는다. arrayBuffer + type:"array"로 읽으면 바이트를 다른 인코딩으로
      // 잘못 해석해 한글이 깨진다.
      const text = await file.text();
      workbook = XLSX.read(text, { type: "string" });
    } else {
      const buffer = await file.arrayBuffer();
      workbook = XLSX.read(buffer, { type: "array" });
    }
  } catch {
    return {
      ok: false,
      error: {
        message: "파일을 열 수 없습니다. 손상된 파일이거나 지원하지 않는 형식입니다.",
        row: 0,
        column: "",
      },
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, error: { message: "파일에 시트가 없습니다.", row: 0, column: "" } };
  }

  const grid = XLSX.utils.sheet_to_json<(string | number | null)[]>(
    workbook.Sheets[sheetName],
    { header: 1, defval: null, blankrows: false },
  );

  if (grid.length === 0) {
    return { ok: false, error: { message: "파일에 데이터가 없습니다.", row: 0, column: "" } };
  }

  const [headerRow, ...dataRows] = grid;
  const columns = headerRow.map((cell, i) =>
    cell === null || cell === "" ? `열${i + 1}` : String(cell),
  );

  if (columns.length > MAX_COLUMNS) {
    return {
      ok: false,
      error: {
        message: `열 수가 너무 많습니다 (최대 ${MAX_COLUMNS}열까지 지원합니다).`,
        row: 0,
        column: "",
      },
    };
  }

  if (dataRows.length === 0) {
    return {
      ok: false,
      error: { message: "제목 행만 있고 실제 데이터 행이 없습니다.", row: 1, column: "" },
    };
  }

  if (dataRows.length > MAX_ROWS) {
    return {
      ok: false,
      error: {
        message: `데이터 행 수가 너무 많습니다 (최대 ${MAX_ROWS.toLocaleString()}행까지 지원합니다).`,
        row: 0,
        column: "",
      },
    };
  }

  const numericColumnFlags = columns.map((_, c) => isNumericColumn(dataRows, c));

  const rows: ParsedRow[] = [];
  for (let r = 0; r < dataRows.length; r++) {
    const dataRow = dataRows[r];
    const rowNumber = r + 2; // 1행은 제목 행
    const record: ParsedRow = {};
    for (let c = 0; c < columns.length; c++) {
      const value = dataRow[c] ?? null;
      if (value === null || value === "") {
        if (!numericColumnFlags[c]) {
          record[columns[c]] = "";
          continue;
        }
        return {
          ok: false,
          error: {
            message: `${rowNumber}번째 행, "${columns[c]}" 열 값이 비어 있습니다.`,
            row: rowNumber,
            column: columns[c],
          },
        };
      }
      const abnormalReason = findAbnormalValue(value);
      if (abnormalReason) {
        return {
          ok: false,
          error: {
            message: `${rowNumber}번째 행, "${columns[c]}" 열 ${abnormalReason}. 임의로 수정하지 않으니 직접 확인해주세요.`,
            row: rowNumber,
            column: columns[c],
          },
        };
      }
      record[columns[c]] = value;
    }
    rows.push(record);
  }

  return { ok: true, columns, rows };
}
