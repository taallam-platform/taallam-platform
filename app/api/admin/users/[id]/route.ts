import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!adminProfile || adminProfile.role !== 'admin') {
    return NextResponse.json({ error: 'ممنوع' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });

  const updates: Record<string, any> = {};
  if (typeof body.full_name === 'string' && body.full_name.trim().length >= 2) {
    updates.full_name = sanitizeInput(body.full_name);
  }
  if (['admin', 'teacher', 'student'].includes(body.role)) {
    // الأدمن مينفعش ينزل نفسه من أدمن بالغلط
    if (params.id === user.id && body.role !== 'admin') {
      return NextResponse.json({ error: 'متقدرش تغيّر صلاحيتك إنت بنفسك' }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'مفيش حاجة تتغير' }, { status: 400 });
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });

  return NextResponse.json({ success: true });
}
