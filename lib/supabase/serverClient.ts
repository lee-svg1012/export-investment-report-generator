import { createClient } from "@supabase/supabase-js";

// 서버 전용 — service_role 키라 절대 클라이언트 번들에 노출하면 안 된다(보안 점검 SEC-5).
// 로그인(Auth) 기능은 쓰지 않고, 이 클라이언트를 통한 서버 중개 접근만 허용한다(보안 점검 SEC-1).
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL/SUPABASE_SECRET_KEY가 설정되어 있지 않습니다.");
  }
  return createClient(url, key);
}
