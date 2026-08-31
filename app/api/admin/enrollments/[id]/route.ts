import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'قيمة غير صحيحة' }, { status: 400 });
  }

  const { error } = await supabase.from('enrollments').update({ status }).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'حصل خطأ' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
