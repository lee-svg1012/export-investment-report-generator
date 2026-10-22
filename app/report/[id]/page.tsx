import { Suspense } from "react";

async function ReportContent({ id }: { id: string }) {
  const placeholderItems = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-16">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            보고서 초안
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            보고서 ID: {id}
          </p>
        </header>

        <div className="rounded-lg border border-dashed border-amber-400 p-4 text-sm text-amber-700 dark:border-amber-600 dark:text-amber-400">
          (경고 배너 영역) 두 통계의 집계 기간 불일치, 결측치·이상값이 있으면
          여기에 구체적으로 표시됩니다.
        </div>

        <section className="flex flex-col gap-4">
          {placeholderItems.map((n) => (
            <div
              key={n}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="font-medium text-black dark:text-zinc-50">
                {n}번 항목
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                표 / 그래프 / 해설 문장 영역 (추후 구현 — 8개 항목 구조는
                기존 보고서 양식 확정 후 채워짐)
              </p>
            </div>
          ))}
        </section>

        <div className="flex gap-4">
          <button
            type="button"
            disabled
            className="h-12 flex-1 rounded-full border border-zinc-300 px-5 disabled:opacity-40 dark:border-zinc-700"
          >
            워드로 내보내기
          </button>
          <button
            type="button"
            disabled
            className="h-12 flex-1 rounded-full border border-zinc-300 px-5 disabled:opacity-40 dark:border-zinc-700"
          >
            PDF로 내보내기
          </button>
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
