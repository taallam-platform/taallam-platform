'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { compressAvatar } from '@/lib/image-compress';
import { AvatarBadge } from '@/components/Navbar';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [instapay, setInstapay] = useState('');
  const [vodafoneCash, setVodafoneCash] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role, teacher_instapay, teacher_vodafone_cash, teacher_bank_account')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name);
        setInstapay(data.teacher_instapay ?? '');
        setVodafoneCash(data.teacher_vodafone_cash ?? '');
        setBankAccount(data.teacher_bank_account ?? '');
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

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          teacher_instapay: instapay || null,
          teacher_vodafone_cash: vodafoneCash || null,
          teacher_bank_account: bankAccount || null,
        })
        .eq('id', user.id);
      setMessage('تم حفظ أرقام الدفع ✓');
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

        {profile.role === 'teacher' && (
          <form onSubmit={handleSavePayment} className="mt-8 pt-6 border-t border-line">
            <h2 className="text-sm font-black mb-1">أرقام الدفع (تظهر للطلاب)</h2>
            <p className="text-xs text-muted mb-4">اختياري — حط أي رقم أو أكتر عندك</p>

            <label className="block mb-3">
              <span className="text-xs font-bold text-[#d3d9e5]">انستاباي</span>
              <input
                value={instapay}
                onChange={(e) => setInstapay(e.target.value)}
                className="mt-1 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2 text-sm outline-none focus:border-gold"
                dir="ltr"
              />
            </label>

            <label className="block mb-3">
              <span className="text-xs font-bold text-[#d3d9e5]">فودافون كاش</span>
              <input
                value={vodafoneCash}
                onChange={(e) => setVodafoneCash(e.target.value)}
                className="mt-1 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2 text-sm outline-none focus:border-gold"
                dir="ltr"
              />
            </label>

            <label className="block mb-4">
              <span className="text-xs font-bold text-[#d3d9e5]">حساب بنكي (اختياري)</span>
              <input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="mt-1 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2 text-sm outline-none focus:border-gold"
                dir="ltr"
              />
            </label>

            <button disabled={saving} className="btn-outline w-full justify-center text-sm">
              {saving ? 'جاري الحفظ...' : 'حفظ أرقام الدفع'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
