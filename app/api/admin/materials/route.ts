import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/validation';
import { randomUUID } from 'crypto';

// كل نوع مادة له صيغة MIME وحد أقصى للحجم
const TYPE_RULES: Record<string, { mimes: string[]; maxSize: number; ext: string }> = {
  video: { mimes: ['video/mp4'], maxSize: 500 * 1024 * 1024, ext: 'mp4' },
  pdf: { mimes: ['application/pdf'], maxSize: 50 * 1024 * 1024, ext: 'pdf' },
  docx: {
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 50 * 1024 * 1024,
    ext: 'docx',
  },
  pptx: {
    mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    maxSize: 50 * 1024 * 1024,
    ext: 'pptx',
  },
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    return NextResponse.json({ error: 'مواد الكورسات بتتضاف من الأدمن أو المدرّس بس' }, { status: 403 });
  }

  const formData = await req.formData();
  const courseId = formData.get('course_id') as string | null;
  const title = formData.get('title') as string | null;
  const type = formData.get('type') as string | null;
  const orderIndex = Number(formData.get('order_index') ?? 0);

  if (!courseId || !title || !type) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }

  // النوع "رابط خارجي" مالوش ملف، بس external_url
  if (type === 'link') {
    const externalUrl = formData.get('external_url') as string | null;
    if (!externalUrl || !/^https?:\/\//.test(externalUrl)) {
      return NextResponse.json({ error: 'الرابط غير صالح' }, { status: 400 });
    }
    const { error } = await supabase.from('course_materials').insert({
      course_id: courseId,
      title: sanitizeInput(title),
      type: 'link',
      external_url: externalUrl,
      order_index: orderIndex,
    });
    if (error) return NextResponse.json({ error: 'فشل الإضافة' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const rule = TYPE_RULES[type];
  if (!rule) {
    return NextResponse.json({ error: 'نوع المادة غير مدعوم' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'مفيش ملف مرفوع' }, { status: 400 });

  if (!rule.mimes.includes(file.type)) {
    return NextResponse.json({ error: `الصيغة لازم تكون ${rule.ext}` }, { status: 400 });
  }
  if (file.size > rule.maxSize) {
    return NextResponse.json(
      { error: `الحجم أكبر من الحد المسموح (${Math.round(rule.maxSize / 1024 / 1024)} ميجا)` },
      { status: 400 }
    );
  }

  const path = `${courseId}/${randomUUID()}.${rule.ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('course-materials')
    .upload(path, arrayBuffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: 'فشل رفع الملف' }, { status: 500 });
  }

  const { error: insertError } = await supabase.from('course_materials').insert({
    course_id: courseId,
    title: sanitizeInput(title),
    type,
    storage_path: path,
    order_index: orderIndex,
  });

  if (insertError) {
    // نظّف الملف لو فشل تسجيله في الجدول
    await supabase.storage.from('course-materials').remove([path]);
    return NextResponse.json({ error: 'فشل حفظ بيانات المادة' }, { status: 500 });
  }

  return NextResponse.json({ success: true, path });
}
