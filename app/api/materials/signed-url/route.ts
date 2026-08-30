import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { materialId } = await req.json();
  if (!materialId) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

  const { data: material } = await supabase
    .from('course_materials')
    .select('storage_path, course_id')
    .eq('id', materialId)
    .single();

  if (!material || !material.storage_path) {
    return NextResponse.json({ error: 'المادة غير موجودة' }, { status: 404 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', material.course_id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: 'لازم تكون مشترك في الكورس ده الأول' }, { status: 403 });
    }
  }

  // رابط مؤقت صالح لمدة ساعة بس
  const { data: signed, error } = await supabase.storage
    .from('course-materials')
    .createSignedUrl(material.storage_path, 60 * 60);

  if (error || !signed) {
    return NextResponse.json({ error: 'فشل توليد الرابط' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
