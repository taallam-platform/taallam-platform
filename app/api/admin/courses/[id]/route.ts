import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/validation';

async function requireAdmin(courseId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }) };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role === 'admin') return { supabase };

  if (profile?.role === 'teacher' && courseId) {
    const { data: course } = await supabase.from('courses').select('teacher_id').eq('id', courseId).single();
    if (course?.teacher_id === user.id) return { supabase };
  }

  return { error: NextResponse.json({ error: 'ممنوع' }, { status: 403 }) };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireAdmin(params.id);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });

  const updates: Record<string, any> = {};
  if (typeof body.title === 'string') updates.title = sanitizeInput(body.title);
  if (typeof body.description === 'string') updates.description = sanitizeInput(body.description);
  if (typeof body.category === 'string') updates.category = sanitizeInput(body.category);
  if (typeof body.price === 'number') updates.price = body.price;
  if (typeof body.cover_color === 'string') updates.cover_color = body.cover_color;
  if (typeof body.is_published === 'boolean') updates.is_published = body.is_published;

  const { error: updateError } = await supabase!.from('courses').update(updates).eq('id', params.id);
  if (updateError) return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, error } = await requireAdmin(params.id);
  if (error) return error;

  // هات مسارات ملفات المواد الأول عشان نمسحها من الـ Storage قبل حذف الصف
  const { data: materials } = await supabase!
    .from('course_materials')
    .select('storage_path')
    .eq('course_id', params.id);

  const paths = (materials ?? []).map((m) => m.storage_path).filter(Boolean) as string[];
  if (paths.length > 0) {
    await supabase!.storage.from('course-materials').remove(paths);
  }

  const { error: deleteError } = await supabase!.from('courses').delete().eq('id', params.id);
  if (deleteError) return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });

  return NextResponse.json({ success: true });
}
