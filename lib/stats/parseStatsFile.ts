import * as XLSX from "xlsx";

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

  if (dataRows.length === 0) {
    return {
      ok: false,
      error: { message: "제목 행만 있고 실제 데이터 행이 없습니다.", row: 1, column: "" },
    };
  }

  const rows: ParsedRow[] = [];
  for (let r = 0; r < dataRows.length; r++) {
    const dataRow = dataRows[r];
    const rowNumber = r + 2; // 1행은 제목 행
    const record: ParsedRow = {};
    for (let c = 0; c < columns.length; c++) {
      const value = dataRow[c] ?? null;
      if (value === null || value === "") {
        return {
          ok: false,
          error: {
            message: `${rowNumber}번째 행, "${columns[c]}" 열 값이 비어 있습니다.`,
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
