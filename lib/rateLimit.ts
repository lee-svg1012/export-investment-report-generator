// IP당 단순 고정 윈도(fixed window) 레이트리밋 — 익명 사용자가 OpenAI 호출·Storage 저장을
// 무제한 반복해 과금·용량을 소진시키는 것을 막기 위한 최소 방어선이다.
// 메모리에만 저장하므로 서버가 재시작되거나(서버리스 인스턴스가 여러 개로 늘어나면) 리셋될 수 있다 —
// 이 앱 규모(소수 내부 사용자)에서는 충분하지만, 다중 인스턴스 환경에서는 Redis 등 공유 저장소로
// 교체가 필요하다.
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
