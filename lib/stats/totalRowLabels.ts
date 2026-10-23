// "합계"·"소계"·"총계"는 실제 분류값이나 기간이 아니라 여러 행을 합산한 요약 행에 쓰는
// 라벨이다. computeSeriesFacts(기간 흐름 계산)·computeCategoryBreakdown(분류별 집계)
// 양쪽에서 같은 기준으로 걸러내야 하므로 한 곳에 모아둔다.
export const TOTAL_ROW_LABELS = ["합계", "소계", "총계"];
