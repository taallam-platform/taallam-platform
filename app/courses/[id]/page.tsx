'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import SecureMaterialPlayer from '@/components/SecureMaterialPlayer';
import EnrollButton from './EnrollButton';

const TYPE_LABELS: Record<string, string> = {
  video: '🎬 فيديو', pdf: '📄 PDF', docx: '📝 Word', pptx: '📊 PowerPoint', link: '🔗 رابط',
};

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [course, setCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: c } = await supabase
      .from('courses')
      .select('*, profiles:teacher_id(full_name)')
      .eq('id', params.id)
      .single();
    setCourse(c);

    if (user) {
      const { data: p } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();
      setProfile(p);

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', params.id)
        .maybeSingle();
      setIsEnrolled(!!enrollment);

      if (enrollment) {
        const { data: m } = await supabase
          .from('course_materials')
          .select('*')
          .eq('course_id', params.id)
          .order('order_index');
        setMaterials(m ?? []);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-navy grid place-items-center text-muted">جاري التحميل...</div>;
  if (!course) return <div className="min-h-screen bg-navy grid place-items-center text-muted">الكورس غير موجود</div>;

  return (
    <>
      <Navbar profile={profile} />
      <main className="container-app py-10">
        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-black mb-2">{course.title}</h1>
          <p className="text-muted text-sm mb-4">{course.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted mb-4">
            <span>👤 {course.profiles?.full_name ?? 'مدرّس'}</span>
            <span>📂 {course.category}</span>
          </div>

          {!isEnrolled && (
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="text-gold font-black text-xl">{course.price} ر.س</span>
              <EnrollButton courseId={course.id} onEnrolled={loadData} />
            </div>
          )}
        </div>

        {isEnrolled && (
          <div>
            <h2 className="text-lg font-bold mb-4">محتوى الكورس ({materials.length} مادة)</h2>
            <div className="space-y-3">
              {materials.map((m) => (
                <div key={m.id} className="card p-4">
                  <span className="text-xs text-gold font-bold">{TYPE_LABELS[m.type]}</span>
                  <h3 className="font-bold text-sm mt-1 mb-2">{m.title}</h3>
                  {m.type === 'link' ? (
                    <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm inline-block">
                      فتح الرابط ↗
                    </a>
                  ) : (
                    <SecureMaterialPlayer materialId={m.id} type={m.type} title={m.title} />
                  )}
                </div>
              ))}
              {materials.length === 0 && (
                <p className="text-muted text-sm card p-6 text-center">لسه المدرّس مضافش مواد للكورس ده.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
