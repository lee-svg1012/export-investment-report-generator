import { z } from "zod";

// /api/report/save가 클라이언트가 보낸 payload를 검증 없이 그대로 DB에 저장하던 문제(CHECK.md P1 5번)를
// 막기 위한 서버 측 스키마. ReportRecord(reportRecord.ts)와 같은 모양을 그대로 따른다 —
// 숫자 값 자체는 검증하지 않고(원본 수치를 그대로 믿어야 하므로) 타입·구조만 강제한다.
const parseErrorSchema = z.object({
  message: z.string(),
  row: z.number(),
  column: z.string(),
});

const parseResultSchema = z.union([
  z.object({
    ok: z.literal(true),
    columns: z.array(z.string()),
    rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  }),
  z.object({
    ok: z.literal(false),
    error: parseErrorSchema,
  }),
]);

// 증감률을 표 전체 요약 한 줄이 아니라 행마다 보여주기로 결정(2026-10-23) — 표의 행과
// 1:1로 대응하는 배열이며, 비교 파일이 없으면 null(열 자체를 숨김).
const rowComparisonSchema = z.union([
  z.object({ available: z.literal(true), percent: z.number().nullable() }),
  z.object({ available: z.literal(false) }),
]);

export const reportPayloadSchema = z.object({
  fdiTable: parseResultSchema,
  // 산업통상부 자료는 선택 업로드라 없으면 null.
  tradeTable: parseResultSchema.nullable(),
  headline: z.string(),
  summary: z.string(),
  yearly: z.string(),
  aggregationPeriodMismatch: z
    .object({
      message: z.string(),
      fdiPeriods: z.array(z.string()),
      tradePeriods: z.array(z.string()),
    })
    .nullable(),
  comparison: z
    .object({
      fdi: z.array(rowComparisonSchema).nullable(),
      trade: z.array(rowComparisonSchema).nullable(),
    })
    .nullable(),
});

export type ReportPayload = z.infer<typeof reportPayloadSchema>;
