import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/validation';

async function requireCourseOwner(supabase: any, materialId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }) };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const { data: material } = await supabase
    .from('course_materials')
    .select('id, storage_path, course_id, courses(teacher_id)')
    .eq('id', materialId)
    .single();

  if (!material) return { error: NextResponse.json({ error: 'المادة غير موجودة' }, { status: 404 }) };

  const isAdmin = profile?.role === 'admin';
  const isOwnerTeacher = profile?.role === 'teacher' && (material as any).courses?.teacher_id === user.id;

  if (!isAdmin && !isOwnerTeacher) {
    return { error: NextResponse.json({ error: 'ممنوع' }, { status: 403 }) };
  }
  return { material };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { error, material } = await requireCourseOwner(supabase, params.id);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.title || body.title.trim().length < 2) {
    return NextResponse.json({ error: 'العنوان قصير جدًا' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('course_materials')
    .update({ title: sanitizeInput(body.title) })
    .eq('id', params.id);

  if (updateError) return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { error, material } = await requireCourseOwner(supabase, params.id);
  if (error) return error;

  if (material?.storage_path) {
    await supabase.storage.from('course-materials').remove([material.storage_path]);
  }

  const { error: deleteError } = await supabase.from('course_materials').delete().eq('id', params.id);
  if (deleteError) return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });

  return NextResponse.json({ success: true });
}
