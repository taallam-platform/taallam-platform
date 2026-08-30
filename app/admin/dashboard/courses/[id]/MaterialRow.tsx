'use client';

import { useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  video: '🎬 فيديو', pdf: '📄 PDF', docx: '📝 Word', pptx: '📊 PowerPoint', link: '🔗 رابط',
};

export default function MaterialRow({ material, onChanged }: { material: any; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(material.title);
  const [error, setError] = useState('');

  async function save() {
    const res = await fetch(`/api/admin/materials/${material.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'فشل التحديث');
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function remove() {
    if (!confirm('متأكد من حذف المادة دي نهائيًا؟')) return;
    const res = await fetch(`/api/admin/materials/${material.id}`, { method: 'DELETE' });
    if (res.ok) onChanged();
    else alert('فشل الحذف');
  }

  return (
    <div className="bg-[#0a0d13] border border-[#1b2029] rounded-xl p-4">
      <span className="text-xs text-gold font-bold">{TYPE_LABELS[material.type]}</span>

      {editing ? (
        <div className="mt-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#050608] border border-[#22262e] rounded-lg px-2.5 py-1.5 text-sm mb-2"
          />
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-800 text-emerald-400">حفظ</button>
            <button onClick={() => setEditing(false)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#2a2f3a] text-[#9aa0ab]">إلغاء</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-1">
          <h3 className="text-sm font-bold">{material.title}</h3>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#2a4360] text-[#7bb3ff]">تعديل</button>
            <button onClick={remove} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900 text-red-400">حذف</button>
          </div>
        </div>
      )}
    </div>
  );
}
