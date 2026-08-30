'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? 'حصل خطأ، حاول تاني');
      return;
    }

    // لو الإيميل ده إيميل الأدمن، حوّله على طول للوحة التحكم
    if (json.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center bg-navy px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-black text-center mb-1">تسجيل الدخول</h1>
        <p className="text-muted text-sm text-center mb-6">أهلاً بيك تاني في تعلّم</p>

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">البريد الإلكتروني</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm font-bold text-[#d3d9e5]">كلمة السر</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
          />
        </label>
        <div className="text-left mb-6">
          <a href="/forgot-password" className="text-xs text-gold font-bold">نسيت كلمة السر؟</a>
        </div>

        <button disabled={loading} className="btn-gold w-full justify-center">
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>

        <p className="text-center text-sm text-muted mt-5">
          مالكش حساب؟ <a href="/register" className="text-gold font-bold">إنشاء حساب</a>
        </p>
      </form>
    </main>
  );
}
