import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // إعادة التحقق من صلاحية الأدمن على السيرفر (أبدًا الثقة في الـ client)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'ممنوع' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId || userId === user.id) {
    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
