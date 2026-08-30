'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarBadge } from '@/components/Navbar';

export default function UsersTable({ users }: { users: any[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [roleDraft, setRoleDraft] = useState('student');
  const [error, setError] = useState('');

  function startEdit(u: any) {
    setEditingId(u.id);
    setNameDraft(u.full_name);
    setRoleDraft(u.role);
    setError('');
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: nameDraft, role: roleDraft }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'فشل التحديث');
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleBanToggle(u: any) {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.from('profiles').update({ is_banned: !u.is_banned }).eq('id', u.id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من حذف المستخدم ده نهائيًا؟')) return;
    const res = await fetch('/api/admin/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    });
    if (res.ok) router.refresh();
    else alert('فشل الحذف');
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-right text-[#7a7f8a] border-b border-[#1b2029]">
          <th className="p-4 font-medium">المستخدم</th>
          <th className="p-4 font-medium">الدور</th>
          <th className="p-4 font-medium">الحالة</th>
          <th className="p-4 font-medium">إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b border-[#14171e] last:border-0 align-top">
            {editingId === u.id ? (
              <>
                <td className="p-4" colSpan={2}>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="bg-[#050608] border border-[#22262e] rounded-lg px-2.5 py-1.5 text-sm w-full mb-2"
                  />
                  <select
                    value={roleDraft}
                    onChange={(e) => setRoleDraft(e.target.value)}
                    className="bg-[#050608] border border-[#22262e] rounded-lg px-2.5 py-1.5 text-sm w-full"
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </td>
                <td className="p-4" colSpan={2}>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(u.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-800 text-emerald-400">
                      حفظ
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#2a2f3a] text-[#9aa0ab]">
                      إلغاء
                    </button>
                  </div>
                </td>
              </>
            ) : (
              <>
                <td className="p-4 flex items-center gap-3">
                  <AvatarBadge profile={u} size={34} />
                  {u.full_name}
                </td>
                <td className="p-4">{u.role}</td>
                <td className="p-4">
                  {u.is_banned ? <span className="text-red-400">محظور</span> : <span className="text-emerald-400">نشط</span>}
                </td>
                <td className="p-4 flex gap-2 flex-wrap">
                  <button onClick={() => startEdit(u)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#2a4360] text-[#7bb3ff]">
                    تعديل
                  </button>
                  <button
                    onClick={() => handleBanToggle(u)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${u.is_banned ? 'border-emerald-800 text-emerald-400' : 'border-amber-800 text-amber-400'}`}
                  >
                    {u.is_banned ? 'إلغاء الحظر' : 'حظر'}
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900 text-red-400">
                    حذف
                  </button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
