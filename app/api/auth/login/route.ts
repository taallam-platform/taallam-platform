import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validation';
import { isIpBlocked, recordLoginAttempt, clearFailedAttempts, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  if (await isIpBlocked(ip)) {
    return NextResponse.json(
      { error: 'محاولات دخول كتيرة فاشلة. حاول تاني بعد 15 دقيقة.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  await recordLoginAttempt(ip, email, !error);

  if (error) {
    return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة السر غير صحيحة' }, { status: 401 });
  }

  await clearFailedAttempts(ip);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_banned')
    .eq('id', data.user.id)
    .single();

  if (profile?.is_banned) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'الحساب ده محظور' }, { status: 403 });
  }

  return NextResponse.json({ user: data.user, role: profile?.role ?? 'student' });
}
