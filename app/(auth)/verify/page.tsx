'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageInner />
    </Suspense>
  );
}

function VerifyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const email = searchParams.get('email') ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'signup',
    });

    if (verifyError || !data.user) {
      setLoading(false);
      setError('الكود غير صحيح أو منتهي الصلاحية');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    setLoading(false);
    if (profile?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
    router.refresh();
  }

  async function handleResend() {
    setResending(true);
    setError('');
    setInfo('');
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (resendError) {
      setError('فشل إعادة الإرسال، حاول بعد شوية');
    } else {
      setInfo('تم إرسال كود جديد على بريدك ✓');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-navy px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4 bg-gradient-to-br from-[#1a1a12] to-[#080e19] border border-[#9b7127] text-2xl">
          ✉️
        </div>
        <h1 className="text-xl font-black mb-1">تأكيد البريد الإلكتروني</h1>
        <p className="text-muted text-sm mb-6">
          بعتنالك كود مكون من 6 أرقام على <span className="text-gold font-bold">{email}</span>
        </p>

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}
        {info && (
          <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm rounded-lg p-3 mb-4">{info}</div>
        )}

        <form onSubmit={handleVerify}>
          <input
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-[0.5em] bg-[#071221] border border-line rounded-lg px-3.5 py-3 outline-none focus:border-gold"
          />
          <button disabled={loading || code.length !== 6} className="btn-gold w-full justify-center mt-5">
            {loading ? 'جاري التأكيد...' : 'تأكيد الحساب'}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-gold font-bold mt-5"
        >
          {resending ? 'جاري الإرسال...' : 'إعادة إرسال الكود'}
        </button>
      </div>
    </main>
  );
}
