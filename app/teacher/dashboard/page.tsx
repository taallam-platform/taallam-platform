import { createClient } from '@/lib/supabase/server';

export default async function TeacherDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('teacher_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-6 lg:p-10">
      <h1 className="text-2xl font-black mb-1">لوحة المدرّس</h1>
      <p className="text-[#7a7f8a] text-sm mb-8">كورساتك ومحتواها</p>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">كورساتي</h2>
        <a href="/admin/dashboard/courses/new" className="btn-gold text-sm !px-4 !py-2">+ إضافة كورس جديد</a>
      </div>

      {(!courses || courses.length === 0) ? (
        <p className="text-[#7a7f8a] text-sm bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-6 text-center">
          لسه معندكش كورسات، ابدأ بإضافة كورسك الأول.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c) => (
            <div key={c.id} className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-1">{c.title}</h3>
              <p className="text-[#7a7f8a] text-xs mb-3">{c.category} · {c.price} ر.س · {c.is_published ? 'منشور' : 'مسودة'}</p>
              <a href={`/admin/dashboard/courses/${c.id}`} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#8a5a1e] text-gold">
                إدارة المواد
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
