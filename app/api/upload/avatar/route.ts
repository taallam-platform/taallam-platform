import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'لازم تسجل دخول الأول' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('avatar') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'مفيش ملف' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'الصيغة لازم تكون jpg أو png' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'حجم الصورة أكبر من 2 ميجا' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  // المسار لازم يبدأ بمعرف المستخدم عشان يطابق storage policy
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: 'فشل رفع الصورة' }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);

  await supabase.from('profiles').update({ avatar_url: publicUrl.publicUrl }).eq('id', user.id);

  return NextResponse.json({ avatar_url: publicUrl.publicUrl });
}
