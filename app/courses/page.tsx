'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

const CATEGORIES = ['الكل', 'البرمجة', 'التصميم', 'التسويق', 'إدارة الأعمال', 'اللغات', 'البيانات', 'التطوير الشخصي'];
const COVER_GRADIENTS: Record<string, string> = {
  blue: 'from-[#073c74] to-[#071525]',
  purple: 'from-[#4a146e] to-[#101329]',
  green: 'from-[#075d4c] to-[#071b20]',
  orange: 'from-[#6c3c0c] to-[#15110a]',
};

export default function CoursesBrowsePage() {
  return (
    <Suspense fallback={null}>
      <CoursesBrowsePageInner />
    </Suspense>
  );
}

function CoursesBrowsePageInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && CATEGORIES.includes(categoryFromUrl)) {
      setCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();
        setProfile(p);
      }

      let q = supabase
        .from('courses')
        .select('id, title, price, category, cover_color, profiles:teacher_id(full_name), reviews(rating), enrollments(id)')
        .eq('is_published', true);
      const { data } = await q;
      setCourses(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = courses.filter((c) => {
    const matchesCategory = category === 'الكل' || c.category === category;
    const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <Navbar profile={profile} />
      <main className="container-app py-10">
        <h1 className="text-2xl font-black mb-6">كل الكورسات</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن كورس..."
            className="flex-1 bg-[#071221] border border-line rounded-lg px-4 py-2.5 outline-none focus:border-gold"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#071221] border border-line rounded-lg px-4 py-2.5"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-muted text-center py-10">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-center card p-10">مفيش كورسات مطابقة للبحث</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((c: any) => {
              const ratings = c.reviews?.map((r: any) => r.rating) ?? [];
              const avg = ratings.length ? ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length : 0;
              const studentsCount = c.enrollments?.length ?? 0;
              return (
                <a key={c.id} href={`/courses/${c.id}`} className="card overflow-hidden hover:-translate-y-1 hover:border-[#8f6826] transition block">
                  <div className={`h-[130px] p-3.5 bg-gradient-to-br ${COVER_GRADIENTS[c.cover_color] ?? COVER_GRADIENTS.blue}`} />
                  <div className="p-4">
                    <h3 className="text-sm leading-6 mb-2 font-bold">{c.title}</h3>
                    <div className="text-[#8493a7] text-[11px] mb-2">👤 {c.profiles?.full_name ?? 'مدرّس'}</div>
                    <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
                      {ratings.length > 0 && <span className="text-gold font-bold">⭐ {avg.toFixed(1)}</span>}
                      <span>👥 {studentsCount} طالب</span>
                    </div>
                    <span className="text-gold font-black text-sm">{c.price} ج.م</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
