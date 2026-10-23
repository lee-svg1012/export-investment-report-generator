import { Suspense } from "react";
import type { Metadata } from "next";
import { getReport } from "@/lib/report/getReport";
import { ReportResultSection } from "@/components/ReportResultSection";

// 비공개 링크로만 접근하는 보고서이므로 검색엔진에 노출되지 않도록 한다.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function ReportContent({ id }: { id: string }) {
  const report = await getReport(id);

  if (!report) {
    return (
      <div className="flex flex-col flex-1 items-center bg-background font-sans">
        <main className="flex w-full max-w-6xl flex-col gap-4 px-6 py-16 sm:px-16">
          <h1 className="text-2xl font-bold text-white">보고서를 찾을 수 없습니다</h1>
          <p className="text-sm text-zinc-400">링크가 올바른지 확인해주세요.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden bg-background font-sans">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.14),_transparent_65%)]"
      />
      <main className="flex w-full max-w-6xl flex-col gap-8 px-6 py-16 sm:px-16">
        <header className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-accent uppercase">
            보고서 초안
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white">보고서 초안</h1>
          <p className="text-sm text-zinc-500">보고서 ID: {report.id}</p>
        </header>

        {report.aggregationPeriodMismatch && (
          <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-400">
            {report.aggregationPeriodMismatch.message} (FDI:{" "}
            {report.aggregationPeriodMismatch.fdiPeriods.join(", ")} / 국내투자:{" "}
            {report.aggregationPeriodMismatch.tradePeriods.join(", ")})
          </div>
        )}

        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">{report.headline}</h2>
          <p className="text-base leading-relaxed text-zinc-300">{report.summary}</p>
          <p className="text-base leading-relaxed text-zinc-300">{report.yearly}</p>
        </section>

        <ReportResultSection
          title="해외직접투자(FDI) 현황"
          table={report.fdiTable}
          comparison={report.comparison?.fdi}
        />
        {report.tradeTable ? (
          <ReportResultSection
            title="국내투자 현황"
            table={report.tradeTable}
            comparison={report.comparison?.trade}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-zinc-400">
            산업통상부 수출입 통계 파일이 첨부되지 않아 국내투자 현황 항목은 생략되었습니다.
          </div>
        )}

        {(report.fdiCategoryTable || report.tradeCategoryTable) && (
          <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">
              {report.fdiCategoryColumn ?? report.tradeCategoryColumn}별 동향
            </h2>
            <p className="text-base leading-relaxed text-zinc-300">{report.byCategory}</p>
          </section>
        )}
        {report.fdiCategoryTable && (
          <ReportResultSection
            title={`해외직접투자(FDI) — ${report.fdiCategoryColumn}별 동향`}
            table={report.fdiCategoryTable}
          />
        )}
        {report.tradeCategoryTable && (
          <ReportResultSection
            title={`국내투자 — ${report.tradeCategoryColumn}별 동향`}
            table={report.tradeCategoryTable}
          />
        )}

        <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-zinc-400">
          업종별·지역별 동향은 업로드 데이터에서 해당 구분을 알 수 없어 생략되었습니다.
          {!report.fdiCategoryTable && !report.tradeCategoryTable
            ? " 국가별 동향도 같은 이유로 생략되었습니다."
            : ""}{" "}
          종합 평가·전망, 정부 입장 및 담당 부서는 통계만으로 자동 생성할 수 없는 항목이라
          직접 작성이 필요합니다.
        </section>

        <div className="flex gap-4">
          <a
            href={`/api/report/${report.id}/word`}
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-white/30 hover:bg-white/5"
          >
            워드로 내보내기
          </a>
          <a
            href={`/api/report/${report.id}/pdf`}
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-white/30 hover:bg-white/5"
          >
            PDF로 내보내기
          </a>
        </div>
      </main>
    </div>
  );
}

export default function ReportPage({
  params,
}: PageProps<"/report/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-background p-16 text-center text-zinc-400">
          보고서를 불러오는 중...
        </div>
      }
    >
      {params.then(({ id }) => (
        <ReportContent id={id} />
      ))}
    </Suspense>
  );
}
