'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['البرمجة', 'التصميم', 'التسويق', 'إدارة الأعمال', 'اللغات', 'البيانات', 'التطوير الشخصي'];
const COLORS = [
  { value: 'blue', label: 'أزرق' },
  { value: 'purple', label: 'بنفسجي' },
  { value: 'green', label: 'أخضر' },
  { value: 'orange', label: 'برتقالي' },
];

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('0');
  const [color, setColor] = useState('blue');
  const [publish, setPublish] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        category,
        price: Number(price),
        cover_color: color,
        is_published: publish,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? 'حصل خطأ');
      return;
    }

    // بعد إنشاء الكورس، روح لصفحة إضافة المواد جواه على طول
    router.push(`/admin/dashboard/courses/${json.course.id}`);
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-6 lg:p-10">
      <h1 className="text-2xl font-black mb-6">إضافة كورس جديد</h1>

      <form onSubmit={handleSubmit} className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-6 max-w-xl">
        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        <label className="block mb-4">
          <span className="text-xs font-bold text-[#9aa0ab]">عنوان الكورس</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs font-bold text-[#9aa0ab]">الوصف</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
          />
        </label>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-xs font-bold text-[#9aa0ab]">الفئة</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-[#9aa0ab]">لون الغلاف</span>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
            >
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block mb-6">
          <span className="text-xs font-bold text-[#9aa0ab]">السعر (ر.س)</span>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
          />
        </label>

        <label className="flex items-center gap-2 mb-6 text-sm">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          نشر الكورس فورًا (يظهر للطلاب)
        </label>

        <button disabled={loading} className="btn-gold w-full justify-center">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الكورس ومتابعة إضافة المواد ←'}
        </button>
      </form>
    </main>
  );
}
