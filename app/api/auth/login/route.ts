import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
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

  const { username, password } = parsed.data;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (!profile) {
    await recordLoginAttempt(ip, username, false);
    return NextResponse.json({ error: 'اسم المستخدم أو كلمة السر غير صحيحة' }, { status: 401 });
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);

  if (userError || !userData?.user?.email) {
    await recordLoginAttempt(ip, username, false);
    return NextResponse.json({ error: 'اسم المستخدم أو كلمة السر غير صحيحة' }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password,
  });

  await recordLoginAttempt(ip, username, !error);

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return NextResponse.json(
        { error: 'لازم تأكد بريدك الإلكتروني الأول، شوف الإيميل اللي وصلك' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'اسم المستخدم أو كلمة السر غير صحيحة' }, { status: 401 });
  }

  await clearFailedAttempts(ip);

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, is_banned')
    .eq('id', data.user.id)
    .single();

  if (profileData?.is_banned) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'الحساب ده محظور' }, { status: 403 });
  }

  return NextResponse.json({ user: data.user, role: profileData?.role ?? 'student' });
}
