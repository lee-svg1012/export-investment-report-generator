function UploadCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <span className="font-medium text-black dark:text-zinc-50">{title}</span>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </span>
      <input type="file" accept=".xlsx,.xls,.csv" className="mt-2 text-sm" />
    </label>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:px-16">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          수출·투자 현황 보고서 자동생성 시스템
        </h1>

        <section className="grid gap-6 sm:grid-cols-2">
          <UploadCard
            title="산업통상부 수출입 통계"
            description="국내투자 현황 통계 파일 (xlsx/csv)"
          />
          <UploadCard
            title="수출입은행 해외투자통계"
            description="해외직접투자(FDI) 현황 통계 파일 (xlsx/csv)"
          />
        </section>

        <UploadCard
          title="(선택) 비교할 과거 통계 파일"
          description="전월/전년 대비 증감률 계산용 — 없으면 비교 없이 진행"
        />

        <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          파일 업로드 후 형식·내용에 문제가 있으면 여기에 구체적으로 표시됩니다.
        </div>

        <button
          type="button"
          disabled
          className="h-12 w-full rounded-full bg-foreground px-5 text-background disabled:opacity-40 md:w-[200px]"
        >
          보고서 생성
        </button>
      </main>
    </div>
  );
}
