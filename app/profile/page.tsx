'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { compressAvatar } from '@/lib/image-compress';
import { AvatarBadge } from '@/components/Navbar';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name);
      }
    })();
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSaving(true);
    setMessage('');
    try {
      const compressed = await compressAvatar(f);
      const formData = new FormData();
      formData.append('avatar', compressed);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok) {
        setProfile((p) => (p ? { ...p, avatar_url: json.avatar_url } : p));
        setMessage('تم تحديث الصورة ✓');
      } else {
        setMessage(json.error);
      }
    } catch (err: any) {
      setMessage(err.message);
    }
    setSaving(false);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      setMessage('تم الحفظ ✓');
    }
    setSaving(false);
  }

  if (!profile) return <div className="min-h-screen bg-navy grid place-items-center text-muted">جاري التحميل...</div>;

  return (
    <main className="min-h-screen bg-navy px-4 py-12 grid place-items-center">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-xl font-black mb-6 text-center">الملف الشخصي</h1>

        <div className="flex flex-col items-center gap-3 mb-6">
          <AvatarBadge profile={profile} size={90} />
          <label className="text-sm text-gold font-bold cursor-pointer">
            تغيير الصورة
            <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        {message && <p className="text-center text-sm text-emerald-400 mb-4">{message}</p>}

        <form onSubmit={handleSaveName}>
          <label className="block mb-4">
            <span className="text-sm font-bold text-[#d3d9e5]">الاسم الكامل</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            />
          </label>
          <button disabled={saving} className="btn-gold w-full justify-center">
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
    </main>
  );
}
