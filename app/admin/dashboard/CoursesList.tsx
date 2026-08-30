'use client';

import { useRouter } from 'next/navigation';

const COVER_DOTS: Record<string, string> = {
  blue: '#1677ff', purple: '#a855f7', green: '#10b981', orange: '#f59e0b',
};

export default function CoursesList({ courses }: { courses: any[] }) {
  const router = useRouter();

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !current }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من حذف الكورس ده وكل مواده نهائيًا؟')) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert('فشل الحذف');
  }

  if (courses.length === 0) {
    return <p className="text-[#7a7f8a] text-sm bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-6 text-center mb-8">لسه مفيش كورسات مضافة</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
      {courses.map((c) => (
        <div key={c.id} className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COVER_DOTS[c.cover_color] ?? '#1677ff' }} />
            <h3 className="font-bold text-sm">{c.title}</h3>
          </div>
          <p className="text-[#7a7f8a] text-xs mb-3">{c.category} · {c.price} ر.س</p>
          <div className="flex gap-2 flex-wrap">
            <a href={`/admin/dashboard/courses/${c.id}`} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#8a5a1e] text-gold">
              إدارة المواد
            </a>
            <button
              onClick={() => togglePublish(c.id, c.is_published)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${c.is_published ? 'border-emerald-800 text-emerald-400' : 'border-amber-800 text-amber-400'}`}
            >
              {c.is_published ? 'إلغاء النشر' : 'نشر'}
            </button>
            <button onClick={() => handleDelete(c.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900 text-red-400">
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
