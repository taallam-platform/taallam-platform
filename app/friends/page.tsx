'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { AvatarBadge } from '@/components/Navbar';

export default function FriendsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();
        setProfile(p);
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(60);
      setStudents((data ?? []).filter((s) => s.id !== user?.id));
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Navbar profile={profile} />
      <main className="container-app py-10 pb-24">
        <h1 className="text-2xl font-black mb-1">الطلاب في تعلّم</h1>
        <p className="text-muted text-sm mb-8">تعرّف على زمايلك في المنصة</p>

        {loading ? (
          <p className="text-muted text-center py-10">جاري التحميل...</p>
        ) : students.length === 0 ? (
          <p className="text-muted text-center card p-10">لسه مفيش طلاب تانيين انضموا.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {students.map((s) => (
              <div key={s.id} className="card p-4 text-center">
                <div className="flex justify-center mb-2.5">
                  <AvatarBadge profile={s} size={56} />
                </div>
                <p className="font-bold text-sm">{s.full_name}</p>
                <p className="text-[11px] text-muted mt-0.5">طالب</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
