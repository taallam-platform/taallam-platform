'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setError('بيانات دخول غير صحيحة');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.role !== 'admin' || profile.is_banned) {
      await supabase.auth.signOut();
      setError('الحساب ده مش عنده صلاحية أدمن');
      setLoading(false);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#020306] px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,#7c1d1d18,transparent_40%)]" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm bg-[#0a0b0f] border border-[#2a1414] rounded-2xl p-8 shadow-[0_0_60px_#00000090]"
      >
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl grid place-items-center bg-gradient-to-br from-[#3a1010] to-[#0a0505] border border-[#5c1f1f] text-red-400 text-2xl">
            🔒
          </div>
        </div>
        <h1 className="text-xl font-black text-center text-white mb-1">لوحة تحكم الأدمن</h1>
        <p className="text-center text-xs text-[#7a7f8a] mb-6">دخول مقيّد للمشرفين فقط</p>

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-xs font-bold text-[#9aa0ab]">البريد الإلكتروني</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-red-800"
          />
        </label>

        <label className="block mb-6">
          <span className="text-xs font-bold text-[#9aa0ab]">كلمة السر</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full bg-[#050608] border border-[#22262e] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-red-800"
          />
        </label>

        <button
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#7a1f1f] to-[#4a1010] text-white font-extrabold rounded-lg py-3 hover:brightness-110 transition"
        >
          {loading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
        </button>
      </form>
    </main>
  );
}
