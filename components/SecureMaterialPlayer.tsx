'use client';

import { useState } from 'react';

export default function SecureMaterialPlayer({ materialId, type, title }: { materialId: string; type: string; title: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/materials/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? 'مش متاح دلوقتي');
      return;
    }
    setUrl(json.url);
  }

  if (url && type === 'video') {
    return (
      <video controls controlsList="nodownload" className="w-full rounded-xl bg-black" src={url}>
        متصفحك مش بيدعم تشغيل الفيديو
      </video>
    );
  }

  if (url) {
    // فتح المستند في تبويب جديد عبر رابط مؤقت (بينتهي بعد ساعة)
    window.open(url, '_blank');
  }

  return (
    <button onClick={open} disabled={loading} className="btn-outline w-full text-sm">
      {loading ? 'جاري التحميل...' : `فتح: ${title}`}
      {error && <span className="block text-red-400 text-xs mt-1">{error}</span>}
    </button>
  );
}
