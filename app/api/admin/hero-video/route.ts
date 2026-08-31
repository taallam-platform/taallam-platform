import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const url = body?.url ?? null;

  const { error } = await supabase.from('site_settings').update({ value: url }).eq('key', 'hero_video_url');
  if (error) return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
