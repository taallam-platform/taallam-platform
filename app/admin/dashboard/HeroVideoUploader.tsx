'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function HeroVideoUploader({ currentUrl }: { currentUrl: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (file.type !== 'video/mp4') {
      setError('لازم يكون الفيديو بصيغة mp4');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('حجم الفيديو أكبر من 50 ميجا');
      return;
    }

    setUploading(true);
    const path = `hero-${Date.now()}.mp4`;
    const { error: uploadError } = await supabase.storage.from('site-media').upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setError('فشل الرفع، حاول تاني');
      return;
    }

    const { data: publicUrl } = supabase.storage.from('site-media').getPublicUrl(path);

    await fetch('/api/admin/hero-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: publicUrl.publicUrl }),
    });

    setUploading(false);
    router.refresh();
  }

  async function handleRemove() {
    setUploading(true);
    await fetch('/api/admin/hero-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: null }),
    });
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-5 mb-10">
      <h2 className="text-lg font-bold mb-3">🎬 فيديو الصفحة الرئيسية</h2>
      {error && <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-3">{error}</div>}

      {currentUrl && (
        <video src={currentUrl} controls className="w-full max-w-sm rounded-xl mb-3 border border-[#22262e]" />
      )}

      <div className="flex gap-3 items-center flex-wrap">
        <label className="btn-gold text-sm !px-4 !py-2 cursor-pointer">
          {uploading ? 'جاري الرفع...' : currentUrl ? 'استبدال الفيديو' : 'رفع فيديو'}
          <input type="file" accept="video/mp4" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
        {currentUrl && (
          <button onClick={handleRemove} disabled={uploading} className="text-red-400 text-sm font-bold">
            حذف الفيديو
          </button>
        )}
      </div>
      <p className="text-[11px] text-[#7a7f8a] mt-2">صيغة MP4 بس، أقصى حجم 50 ميجا.</p>
    </div>
  );
}
