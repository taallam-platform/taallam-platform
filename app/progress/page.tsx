'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

export default function ProgressPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: p } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();
      setProfile(p);

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, status, courses(id, title, cover_color)')
        .eq('student_id', user.id)
        .eq('status', 'approved');

      const results = [];
      for (const e of enrollments ?? []) {
        const { count: totalMaterials } = await supabase
          .from('course_materials')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', e.course_id);

        const { count: completedMaterials } = await supabase
          .from('material_progress')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('course_id', e.course_id);

        results.push({
          course: e.courses,
          total: totalMaterials ?? 0,
          completed: completedMaterials ?? 0,
        });
      }
      setCourses(results);
      setLoading(false);
    })();
  }, []);

  const totalMaterials = courses.reduce((s, c) => s + c.total, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.completed, 0);
  const overallPercent = totalMaterials > 0 ? Math.round((totalCompleted / totalMaterials) * 100) : 0;

  return (
    <>
      <Navbar profile={profile} />
      <main className="container-app py-10 pb-24">
        <h1 className="text-2xl font-black mb-1">متابعة التقدم</h1>
        <p className="text-muted text-sm mb-8">شوف تقدمك في كل كورس مشترك فيه</p>

        {loading ? (
          <p className="text-muted text-center py-10">جاري التحميل...</p>
        ) : courses.length === 0 ? (
          <p className="text-muted text-center card p-10">مش مشترك في أي كورس لسه.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="card p-5 text-center">
                <strong className="block text-2xl text-gold">{courses.length}</strong>
                <span className="text-xs text-muted">كورس</span>
              </div>
              <div className="card p-5 text-center">
                <strong className="block text-2xl text-gold">{totalCompleted}</strong>
                <span className="text-xs text-muted">مادة مكتملة</span>
              </div>
              <div className="card p-5 text-center">
                <strong className="block text-2xl text-gold">{overallPercent}%</strong>
                <span className="text-xs text-muted">التقدم الكلي</span>
              </div>
            </div>

            <div className="space-y-4">
              {courses.map((c) => {
                const percent = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
                return (
                  <div key={c.course.id} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm">{c.course.title}</h3>
                      <span className="text-xs text-gold font-bold">{percent}%</span>
                    </div>
                    <div className="h-2 bg-[#0f1a29] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-[#e8ad3c] to-[#b07a1a] rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[11px] text-muted mt-2">{c.completed} من {c.total} مادة</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
