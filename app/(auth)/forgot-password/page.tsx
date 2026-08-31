'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError('حصل خطأ، حاول تاني');
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen grid place-items-center bg-navy px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4 bg-gradient-to-br from-[#1a1a12] to-[#080e19] border border-[#9b7127] text-2xl">
          🔑
        </div>
        <h1 className="text-xl font-black mb-1">نسيت كلمة السر؟</h1>
        <p className="text-muted text-sm mb-6">اكتب إيميلك وهنبعتلك رابط لإعادة تعيين كلمة السر</p>

        {sent ? (
          <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm rounded-lg p-4">
            تم إرسال رابط إعادة التعيين على <b>{email}</b> — افتحه من على نفس الجهاز.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            />
            <button disabled={loading} className="btn-gold w-full justify-center mt-5">
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted mt-5">
          رجعتلك الذاكرة؟ <a href="/login" className="text-gold font-bold">تسجيل الدخول</a>
        </p>
      </div>
    </main>
  );
}
