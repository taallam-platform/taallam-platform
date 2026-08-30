import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { registerSchema, sanitizeInput } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const fullName = sanitizeInput(parsed.data.fullName);
  const { password } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
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
