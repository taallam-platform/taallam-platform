'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EnrollButton({ courseId, onEnrolled }: { courseId: string; onEnrolled: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEnroll() {
    setError('');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=/courses/${courseId}`);
      return;
    }

    setLoading(true);
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({ student_id: user.id, course_id: courseId });
    setLoading(false);

    if (enrollError) {
      setError('حصل خطأ، حاول تاني');
      return;
    }
    onEnrolled();
  }

  return (
    <div>
      {error && <span className="text-red-400 text-xs block mb-2">{error}</span>}
      <button onClick={handleEnroll} disabled={loading} className="btn-gold">
        {loading ? 'جاري التسجيل...' : 'اشترك في الكورس الآن'}
      </button>
    </div>
  );
}
