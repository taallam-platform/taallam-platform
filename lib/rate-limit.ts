import { createAdminClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const BLOCK_WINDOW_MINUTES = 15;

/** يتحقق هل الـ IP ده متبلوك بسبب محاولات دخول فاشلة كتير */
export async function isIpBlocked(ip: string): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - BLOCK_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('attempted_at', windowStart);

  return (count ?? 0) >= MAX_ATTEMPTS;
}

export async function recordLoginAttempt(ip: string, email: string, success: boolean) {
  const admin = createAdminClient();
  await admin.from('login_attempts').insert({ ip_address: ip, email, success });
}

/** لو الدخول نجح، امسح المحاولات الفاشلة القديمة بتاعت الـ IP ده */
export async function clearFailedAttempts(ip: string) {
  const admin = createAdminClient();
  await admin.from('login_attempts').delete().eq('ip_address', ip).eq('success', false);
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
