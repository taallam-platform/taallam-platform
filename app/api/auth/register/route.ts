import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { registerSchema, sanitizeInput } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'البيانات غير صحيحة';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const username = parsed.data.username.trim().toLowerCase();
  const fullName = sanitizeInput(parsed.data.fullName);
  const { password } = parsed.data;

  // تأكد إن اسم المستخدم مش مستخدم قبل كده
  const adminCheck = createAdminClient();
  const { data: existing } = await adminCheck
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'اسم المستخدم ده مستخدم بالفعل، جرب اسم تاني' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, username } },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'فشل إنشاء الحساب' }, { status: 400 });
  }

  // لو الإيميل ده هو إيميل الأدمن المحدد في متغيرات البيئة، رفّع الرول تلقائيًا
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let isAdmin = false;

  if (adminEmail && email === adminEmail) {
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', data.user.id);
    isAdmin = !updateError;
  }

  return NextResponse.json({ user: data.user, isAdmin });
}
