// 업로드 파일 용량·행/열 수 상한 — 압축폭탄(zip bomb)이나 비정상적으로 큰 파일로
// 서버 메모리가 고갈되는 것을 막기 위한 상한선. 실제 정부 통계 파일 규모보다 넉넉하게 잡았다.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_ROWS = 50_000;
export const MAX_COLUMNS = 200;

export function formatMaxFileSize(): string {
  return `${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`;
}
