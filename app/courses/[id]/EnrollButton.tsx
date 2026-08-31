'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const VODAFONE_CASH = '01069661113';
const INSTAPAY = '01121153193';
const WHATSAPP_PHONE = '01069769099';
const WHATSAPP_LINK = `https://wa.me/2${WHATSAPP_PHONE}`;

export default function EnrollButton({ courseId, price, onEnrolled }: { courseId: string; price: number; onEnrolled: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [requested, setRequested] = useState(false);

  async function handleFreeEnroll() {
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/courses/${courseId}`);
      return;
    }
    setLoading(true);
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({ student_id: user.id, course_id: courseId, status: 'approved' });
    setLoading(false);
    if (enrollError) {
      setError('حصل خطأ، حاول تاني');
      return;
    }
    onEnrolled();
  }

  async function handlePaidRequest() {
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/courses/${courseId}`);
      return;
    }
    setLoading(true);
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({ student_id: user.id, course_id: courseId, status: 'pending' });
    setLoading(false);
    if (enrollError) {
      setError('حصل خطأ، أو إنك بعتت طلب قبل كده');
      return;
    }
    setRequested(true);
  }

  if (requested) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm rounded-lg p-3.5">
        ✓ تم إرسال طلبك، هيتم تفعيل الكورس بعد ما الإدارة تتأكد من الدفع.
      </div>
    );
  }

  if (price <= 0) {
    return (
      <div>
        {error && <span className="text-red-400 text-xs block mb-2">{error}</span>}
        <button onClick={handleFreeEnroll} disabled={loading} className="btn-gold">
          {loading ? 'جاري التسجيل...' : 'اشترك في الكورس الآن'}
        </button>
      </div>
    );
  }

  if (!showPayment) {
    return (
      <button onClick={() => setShowPayment(true)} className="btn-gold">
        اشترك في الكورس الآن
      </button>
    );
  }

  return (
    <div className="card p-4 max-w-sm">
      {error && <span className="text-red-400 text-xs block mb-2">{error}</span>}
      <p className="text-sm font-bold mb-2">حوّل مبلغ {price} ج.م على أحد الأرقام دي:</p>
      <div className="space-y-1.5 mb-3.5">
        <p className="text-xs text-muted">فودافون كاش</p>
        <p className="text-gold font-black text-lg" dir="ltr">{VODAFONE_CASH}</p>
        <p className="text-xs text-muted mt-2">انستاباي</p>
        <p className="text-gold font-black text-lg" dir="ltr">{INSTAPAY}</p>
      </div>
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#1fae54] hover:bg-[#189646] text-white font-bold text-sm rounded-lg py-2.5 mb-3.5 transition"
      >
        💬 تواصل واتساب
      </a>
      <p className="text-xs text-muted mb-3.5">بعد التحويل، دوس "دفعت" وهتقدر تدخل الكورس بمجرد ما الإدارة توافق على طلبك.</p>
      <button onClick={handlePaidRequest} disabled={loading} className="btn-gold w-full justify-center">
        {loading ? 'جاري الإرسال...' : '✓ دفعت'}
      </button>
    </div>
  );
}
