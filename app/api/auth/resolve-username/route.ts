import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = body?.username?.toString().trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: 'أدخل اسم المستخدم' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'اسم المستخدم أو كلمة السر غير صحيحة' }, { status: 401 });
  }

  const { data: userData, error } = await admin.auth.admin.getUserById(profile.id);

  if (error || !userData?.user?.email) {
    return NextResponse.json({ error: 'حصل خطأ، حاول تاني' }, { status: 500 });
  }

  return NextResponse.json({ email: userData.user.email });
}
