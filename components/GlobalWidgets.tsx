'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import BottomNav from './BottomNav';
import SupportWidget from './SupportWidget';

export default function GlobalWidgets() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(p?.role === 'admin');
      }
    })();
  }, []);

  return (
    <>
      <BottomNav />
      {!isAdmin && <SupportWidget userId={userId} />}
    </>
  );
}
