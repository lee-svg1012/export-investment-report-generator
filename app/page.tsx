"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParseResult } from "@/lib/stats/parseStatsFile";

type AggregationPeriodMismatch = {
  message: string;
  fdiPeriods: string[];
  tradePeriods: string[];
} | null;

// 표의 행마다 증감률을 매긴다(2026-10-23 결정) — 비교 파일이 없으면 null(열 자체를 숨김).
type RowComparison = { available: true; percent: number | null } | { available: false };

type ReportTablesResponse = {
  ok: boolean;
  fdi: ParseResult;
  trade: ParseResult | null;
  aggregationPeriodMismatch: AggregationPeriodMismatch;
  comparison: { fdi: RowComparison[] | null; trade: RowComparison[] | null } | null;
};

type NarrativeResponse =
  | { ok: true; headline: string; summary: string; yearly: string }
  | { ok: false; error: string };

type SaveResponse = { ok: true; id: string } | { ok: false; error: string };

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

export default function Home() {
  const router = useRouter();

  const [tradeFile, setTradeFile] = useState<File | null>(null);
  const [fdiFile, setFdiFile] = useState<File | null>(null);
  const [compareFile, setCompareFile] = useState<File | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // 수출입은행 해외투자통계(FDI)는 필수, 산업통상부 수출입 통계는 선택이다 —
  // FDI는 분기마다 쓰는 주력 보고서지만 산업통상부 자료는 작성 주기가 더 길어 매번 있는 게 아니다.
  const canGenerate = fdiFile !== null && !isGenerating;

  async function handleGenerate() {
    if (!fdiFile) return;

    setIsGenerating(true);
    setGenerationError(null);

    const tablesFormData = new FormData();
    tablesFormData.append("fdiFile", fdiFile);
    if (tradeFile) tablesFormData.append("tradeFile", tradeFile);
    if (compareFile) tablesFormData.append("compareFile", compareFile);

    const tablesResponse = await fetch("/api/report/tables", {
      method: "POST",
      body: tablesFormData,
    });
    const tablesData: ReportTablesResponse = await tablesResponse.json();

    if (!tablesData.ok) {
      const message =
        (!tablesData.fdi.ok && tablesData.fdi.error.message) ||
        (tablesData.trade && !tablesData.trade.ok && tablesData.trade.error.message) ||
        "알 수 없는 오류가 발생했습니다.";
      setGenerationError(message);
      setIsGenerating(false);
      return;
    }

    // DESIGN.md: 집계 기간이 다르면 생성을 멈추고 사용자에게 계속 진행할지 확인한다.
    if (
      tablesData.aggregationPeriodMismatch &&
      !window.confirm(
        `${tablesData.aggregationPeriodMismatch.message}\n계속 진행하시겠습니까?`,
      )
    ) {
      setIsGenerating(false);
      return;
    }

    const narrativeResponse = await fetch("/api/report/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fdi: tablesData.fdi, trade: tablesData.trade }),
    });
    const narrativeData: NarrativeResponse = await narrativeResponse.json();

    if (!narrativeData.ok) {
      setGenerationError(`해설 문장 생성 실패: ${narrativeData.error}`);
      setIsGenerating(false);
      return;
    }

    const saveFormData = new FormData();
    saveFormData.append("fdiFile", fdiFile);
    if (tradeFile) saveFormData.append("tradeFile", tradeFile);
    saveFormData.append(
      "payload",
      JSON.stringify({
        fdiTable: tablesData.fdi,
        tradeTable: tablesData.trade,
        headline: narrativeData.headline,
        summary: narrativeData.summary,
        yearly: narrativeData.yearly,
        aggregationPeriodMismatch: tablesData.aggregationPeriodMismatch,
        comparison: tablesData.comparison,
      }),
    );

    const saveResponse = await fetch("/api/report/save", {
      method: "POST",
      body: saveFormData,
    });
    const saveData: SaveResponse = await saveResponse.json();

    if (!saveData.ok) {
      setGenerationError(`보고서 저장 실패: ${saveData.error}`);
      setIsGenerating(false);
      return;
    }

    router.push(`/report/${saveData.id}`);
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:px-16">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          수출·투자 현황 보고서 자동생성 시스템
        </h1>

        <section className="grid gap-6 sm:grid-cols-2">
          <UploadCard
            title="수출입은행 해외투자통계 (필수)"
            description="해외직접투자(FDI) 현황 통계 파일 (xlsx/csv)"
            file={fdiFile}
            onFileChange={setFdiFile}
          />
          <UploadCard
            title="산업통상부 수출입 통계 (선택)"
            description="국내투자 현황 통계 파일 (xlsx/csv) — 작성 주기가 길어 없을 수 있음"
            file={tradeFile}
            onFileChange={setTradeFile}
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
      </main>
    </div>
  );
}
