"use client";

import { useState } from "react";
import { StatsBarChart } from "@/components/StatsBarChart";
import { StatsTable } from "@/components/StatsTable";
import { pickChartColumns } from "@/lib/stats/pickChartColumns";
import type { ParseResult } from "@/lib/stats/parseStatsFile";

type AggregationPeriodMismatch = {
  message: string;
  fdiPeriods: string[];
  tradePeriods: string[];
} | null;

type ReportTablesResponse = {
  ok: boolean;
  fdi: ParseResult;
  trade: ParseResult;
  aggregationPeriodMismatch: AggregationPeriodMismatch;
};

function formatFileLabel(file: File | null) {
  return file ? file.name : "선택된 파일 없음";
}

function UploadCard({
  title,
  description,
  file,
  onFileChange,
}: {
  title: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <span className="font-medium text-black dark:text-zinc-50">{title}</span>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </span>
      <label className="mt-2 inline-flex w-fit cursor-pointer items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
        파일 선택
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </label>
      <span className="text-sm text-zinc-600 dark:text-zinc-300">
        {formatFileLabel(file)}
      </span>
    </div>
  );
}

function ResultSection({ title, table }: { title: string; table: ParseResult }) {
  if (!table.ok) return null;
  const chartColumns = pickChartColumns(table);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium text-black dark:text-zinc-50">{title}</h2>
      <StatsTable table={table} />
      {chartColumns && (
        <StatsBarChart
          rows={table.rows}
          labelColumn={chartColumns.labelColumn}
          valueColumn={chartColumns.valueColumn}
        />
      )}
    </section>
  );
}

export default function Home() {
  const [tradeFile, setTradeFile] = useState<File | null>(null);
  const [fdiFile, setFdiFile] = useState<File | null>(null);
  const [compareFile, setCompareFile] = useState<File | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportTablesResponse | null>(null);

  const canGenerate = tradeFile !== null && fdiFile !== null && !isGenerating;

  async function handleGenerate() {
    if (!tradeFile || !fdiFile) return;

    setIsGenerating(true);
    setGenerationError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("fdiFile", fdiFile);
    formData.append("tradeFile", tradeFile);

    const response = await fetch("/api/report/tables", {
      method: "POST",
      body: formData,
    });
    const data: ReportTablesResponse = await response.json();

    if (!data.ok) {
      const message =
        (!data.fdi.ok && data.fdi.error.message) ||
        (!data.trade.ok && data.trade.error.message) ||
        "알 수 없는 오류가 발생했습니다.";
      setGenerationError(message);
      setIsGenerating(false);
      return;
    }

    // DESIGN.md: 집계 기간이 다르면 생성을 멈추고 사용자에게 계속 진행할지 확인한다.
    if (
      data.aggregationPeriodMismatch &&
      !window.confirm(
        `${data.aggregationPeriodMismatch.message}\n계속 진행하시겠습니까?`,
      )
    ) {
      setIsGenerating(false);
      return;
    }

    setResult(data);
    setIsGenerating(false);
  }

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
            file={tradeFile}
            onFileChange={setTradeFile}
          />
          <UploadCard
            title="수출입은행 해외투자통계"
            description="해외직접투자(FDI) 현황 통계 파일 (xlsx/csv)"
            file={fdiFile}
            onFileChange={setFdiFile}
          />
        </section>

        <UploadCard
          title="(선택) 비교할 과거 통계 파일"
          description="전월/전년 대비 증감률 계산용 — 없으면 비교 없이 진행"
          file={compareFile}
          onFileChange={setCompareFile}
        />

        <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {generationError ?? "파일 업로드 후 형식·내용에 문제가 있으면 여기에 구체적으로 표시됩니다."}
        </div>

        <button
          type="button"
          disabled={!canGenerate}
          onClick={handleGenerate}
          className="h-12 w-full rounded-full bg-foreground px-5 text-background disabled:opacity-40 md:w-[200px]"
        >
          {isGenerating ? "생성 중..." : "보고서 생성"}
        </button>

        {result && (
          <div className="flex flex-col gap-6">
            {result.aggregationPeriodMismatch && (
              <div className="rounded-lg border border-dashed border-amber-400 p-4 text-sm text-amber-700 dark:border-amber-600 dark:text-amber-400">
                {result.aggregationPeriodMismatch.message} (FDI:{" "}
                {result.aggregationPeriodMismatch.fdiPeriods.join(", ")} / 국내투자:{" "}
                {result.aggregationPeriodMismatch.tradePeriods.join(", ")})
              </div>
            )}
            <ResultSection title="해외직접투자(FDI) 현황" table={result.fdi} />
            <ResultSection title="국내투자 현황" table={result.trade} />
          </div>
        )}
      </main>
    </div>
  );
}
