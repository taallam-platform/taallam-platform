'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { ok: password.length >= 8, label: '8 أحرف على الأقل' },
    { ok: /[A-Z]/.test(password), label: 'حرف كبير' },
    { ok: /[a-z]/.test(password), label: 'حرف صغير' },
    { ok: /[0-9]/.test(password), label: 'رقم' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordRules.every((r) => r.ok)) {
      setError('كلمة السر لازم تحقق كل الشروط تحت');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا السر مش متطابقتين');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('انتهت صلاحية الرابط، اطلب رابط جديد من صفحة نسيت كلمة السر');
      return;
    }

    router.push('/login?reset=1');
  }

  return (
    <main className="min-h-screen grid place-items-center bg-navy px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-8">
        <h1 className="text-xl font-black text-center mb-1">تعيين كلمة سر جديدة</h1>
        <p className="text-muted text-sm text-center mb-6">اختار كلمة سر قوية وميسهلش حد يخمنها</p>

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">كلمة السر الجديدة</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm font-bold text-[#d3d9e5]">تأكيد كلمة السر</span>
          <input
            required
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
          />
        </label>

        <ul className="grid grid-cols-2 gap-1 mb-6 text-xs">
          {passwordRules.map((r) => (
            <li key={r.label} className={r.ok ? 'text-emerald-400' : 'text-muted'}>
              {r.ok ? '✓' : '○'} {r.label}
            </li>
          ))}
        </ul>

        <button disabled={loading} className="btn-gold w-full justify-center">
          {loading ? 'جاري الحفظ...' : 'حفظ كلمة السر الجديدة'}
        </button>
      </form>
    </main>
  );
}
