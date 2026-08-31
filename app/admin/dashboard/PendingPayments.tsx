'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type PendingRequest = {
  id: string;
  student_name: string;
  course_title: string;
  course_price: number;
};

export default function PendingPayments({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setLoadingId(id);
    await fetch(`/api/admin/enrollments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    router.refresh();
  }

  if (requests.length === 0) {
    return <p className="text-[#7a7f8a] text-sm bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-6 text-center">مفيش طلبات دفع قيد المراجعة حاليًا.</p>;
  }

  return (
    <div className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl overflow-hidden divide-y divide-[#1b2029]">
      {requests.map((r) => (
        <div key={r.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-bold text-sm">{r.student_name}</p>
            <p className="text-[#7a7f8a] text-xs mt-0.5">{r.course_title} · {r.course_price} ج.م</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(r.id, 'approved')}
              disabled={loadingId === r.id}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg px-3.5 py-2 transition"
            >
              ✓ موافقة
            </button>
            <button
              onClick={() => handleAction(r.id, 'rejected')}
              disabled={loadingId === r.id}
              className="bg-red-900 hover:bg-red-800 text-white text-xs font-bold rounded-lg px-3.5 py-2 transition"
            >
              ✕ رفض
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
