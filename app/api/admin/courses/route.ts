import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/validation';
import { z } from 'zod';

const courseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(60),
  price: z.number().min(0),
  level: z.enum(['مبتدئ', 'متوسط', 'متقدم']).optional(),
  duration_hours: z.number().min(0).nullable().optional(),
  cover_color: z.enum(['blue', 'purple', 'green', 'orange']),
  is_published: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    return NextResponse.json({ error: 'الكورسات بتتضاف من الأدمن أو المدرّس بس' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'البيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    title: sanitizeInput(parsed.data.title),
    description: parsed.data.description ? sanitizeInput(parsed.data.description) : null,
    category: sanitizeInput(parsed.data.category),
    teacher_id: user.id,
  };

  const { data: course, error } = await supabase.from('courses').insert(payload).select().single();
  if (error) return NextResponse.json({ error: 'فشل إنشاء الكورس' }, { status: 500 });

  return NextResponse.json({ course });
}
