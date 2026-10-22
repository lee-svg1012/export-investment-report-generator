import type { SeriesFacts } from "./computeSeriesFacts";

// AI를 거치지 않고 계산된 숫자로만 제목 문장을 조립한다 — 환각 위험이 없는 가장 단순한 항목.
export function buildHeadline(
  fdi: SeriesFacts | null,
  trade: SeriesFacts | null,
): string {
  const parts: string[] = [];
  for (const facts of [fdi, trade]) {
    if (!facts) continue;
    const direction =
      facts.changeAmount > 0 ? "증가" : facts.changeAmount < 0 ? "감소" : "보합";
    const percentText =
      facts.changePercent !== null ? ` (${facts.changePercent.toFixed(1)}%)` : "";
    parts.push(
      `${facts.label} ${facts.latestPeriod} ${facts.latestValue}${percentText} ${direction}`,
    );
  }
  return parts.length > 0 ? parts.join(" / ") : "제목을 계산할 수 있는 데이터가 없습니다.";
}
