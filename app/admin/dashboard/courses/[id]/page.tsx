'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import MaterialRow from './MaterialRow';

const TYPES = [
  { value: 'video', label: '🎬 فيديو (mp4، حتى 500 ميجا)' },
  { value: 'pdf', label: '📄 مستند PDF (حتى 50 ميجا)' },
  { value: 'docx', label: '📝 مستند Word (حتى 50 ميجا)' },
  { value: 'pptx', label: '📊 عرض PowerPoint (حتى 50 ميجا)' },
  { value: 'link', label: '🔗 رابط خارجي' },
];

export default function CourseMaterialsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const courseId = params.id;

  const [course, setCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('video');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single();
    const { data: m } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    setCourse(c);
    setMaterials(m ?? []);
  }

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (type !== 'link' && !file) {
      setError('لازم ترفع ملف للنوع ده');
      return;
    }
    if (type === 'link' && !externalUrl) {
      setError('لازم تكتب الرابط');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('course_id', courseId);
    formData.append('title', title);
    formData.append('type', type);
    formData.append('order_index', String(materials.length));
    if (type === 'link') formData.append('external_url', externalUrl);
    if (file) formData.append('file', file);

    const res = await fetch('/api/admin/materials', { method: 'POST', body: formData });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? 'حصل خطأ');
      return;
    }

    setTitle('');
    setFile(null);
    setExternalUrl('');
    loadData();
  }

  if (!course) return <div className="min-h-screen bg-[#05070b] grid place-items-center text-muted">جاري التحميل...</div>;

  const accept: Record<string, string> = {
    video: 'video/mp4',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-6 lg:p-10">
      <h1 className="text-2xl font-black mb-1">{course.title}</h1>
      <p className="text-[#7a7f8a] text-sm mb-8">إدارة مواد الكورس — فيديوهات، مستندات، وروابط</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* فورم إضافة مادة */}
        <form onSubmit={handleAddMaterial} className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-6 h-fit">
          <h2 className="font-bold mb-4">إضافة مادة جديدة</h2>

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>
          )}

          <label className="block mb-4">
            <span className="text-xs font-bold text-[#9aa0ab]">عنوان المادة</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
              placeholder="مثال: الدرس الأول - مقدمة"
            />
          </label>

          <label className="block mb-4">
            <span className="text-xs font-bold text-[#9aa0ab]">نوع المادة</span>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setFile(null); }}
              className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          {type === 'link' ? (
            <label className="block mb-6">
              <span className="text-xs font-bold text-[#9aa0ab]">الرابط الخارجي</span>
              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5"
              />
            </label>
          ) : (
            <label className="block mb-6">
              <span className="text-xs font-bold text-[#9aa0ab]">الملف</span>
              <input
                type="file"
                accept={accept[type]}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 w-full text-sm"
              />
            </label>
          )}

          <button disabled={loading} className="btn-gold w-full justify-center">
            {loading ? 'جاري الرفع...' : 'إضافة المادة'}
          </button>
        </form>

        {/* قائمة المواد */}
        <div>
          <h2 className="font-bold mb-4">المواد الحالية ({materials.length})</h2>
          <div className="space-y-2">
            {materials.map((m) => (
              <MaterialRow key={m.id} material={m} onChanged={loadData} />
            ))}
            {materials.length === 0 && (
              <p className="text-muted text-sm bg-[#0a0d13] border border-[#1b2029] rounded-xl p-6 text-center">
                لسه مفيش مواد مضافة
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
