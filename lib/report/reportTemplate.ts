// PRD.md "8개 항목 구조" (수출입은행 해외직접투자통계 보도자료 샘플 기준, 2026-10-22 확정)를
// 코드로 옮긴 템플릿. PLAN 11(해설 생성)·12(화면 표시)가 이 순서·구성을 그대로 따른다.
// "narrative"는 해설 문장만, "table-narrative"는 표+해설 문장을 함께 갖는 항목이다.
export type ReportSectionKind = "narrative" | "table-narrative" | "appendix";

export type ReportSectionTemplate = {
  id: string;
  order: number;
  title: string;
  kind: ReportSectionKind;
};

export const REPORT_TEMPLATE: ReportSectionTemplate[] = [
  { id: "headline", order: 1, title: "제목·보도 정보", kind: "narrative" },
  { id: "summary", order: 2, title: "핵심 요약", kind: "narrative" },
  { id: "yearly", order: 3, title: "연도별 동향", kind: "table-narrative" },
  { id: "industry", order: 4, title: "업종별 동향", kind: "table-narrative" },
  { id: "region", order: 5, title: "지역별 동향", kind: "table-narrative" },
  { id: "country", order: 6, title: "국가별 동향", kind: "table-narrative" },
  { id: "outlook", order: 7, title: "종합 평가·전망", kind: "narrative" },
  { id: "government", order: 8, title: "정부 입장 및 담당 부서", kind: "narrative" },
  { id: "appendix", order: 9, title: "별첨: 상세 통계표", kind: "appendix" },
];
