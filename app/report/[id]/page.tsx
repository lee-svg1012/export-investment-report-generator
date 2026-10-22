import { Suspense } from "react";
import { getReport } from "@/lib/report/getReport";
import { ReportResultSection } from "@/components/ReportResultSection";

async function ReportContent({ id }: { id: string }) {
  const report = await getReport(id);

  if (!report) {
    return (
      <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex w-full max-w-3xl flex-col gap-4 px-6 py-16 sm:px-16">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
            보고서를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            링크가 올바른지 확인해주세요.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-16">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            보고서 초안
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            보고서 ID: {report.id}
          </p>
        </header>

        {report.aggregationPeriodMismatch && (
          <div className="rounded-lg border border-dashed border-amber-400 p-4 text-sm text-amber-700 dark:border-amber-600 dark:text-amber-400">
            {report.aggregationPeriodMismatch.message} (FDI:{" "}
            {report.aggregationPeriodMismatch.fdiPeriods.join(", ")} / 국내투자:{" "}
            {report.aggregationPeriodMismatch.tradePeriods.join(", ")})
          </div>
        )}

        <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {report.headline}
          </h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{report.summary}</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{report.yearly}</p>
        </section>

        <ReportResultSection
          title="해외직접투자(FDI) 현황"
          table={report.fdiTable}
          comparison={report.comparison?.fdi}
        />
        <ReportResultSection
          title="국내투자 현황"
          table={report.tradeTable}
          comparison={report.comparison?.trade}
        />

        <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          업종별·지역별·국가별 동향은 업로드 데이터에서 해당 구분을 알 수 없어 생략되었습니다.
          종합 평가·전망, 정부 입장 및 담당 부서는 통계만으로 자동 생성할 수 없는 항목이라
          직접 작성이 필요합니다.
        </section>

        <div className="flex gap-4">
          <a
            href={`/api/report/${report.id}/word`}
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-zinc-300 px-5 text-center dark:border-zinc-700"
          >
            워드로 내보내기
          </a>
          <a
            href={`/api/report/${report.id}/pdf`}
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-zinc-300 px-5 text-center dark:border-zinc-700"
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
      fallback={<div className="p-16 text-center">보고서를 불러오는 중...</div>}
    >
      {params.then(({ id }) => (
        <ReportContent id={id} />
      ))}
    </Suspense>
  );
}
