'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SupportWidget({ userId }: { userId: string | null }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    if (!userId) return;
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
  }

  useEffect(() => {
    if (open) loadMessages();
  }, [open]);

  async function handleSend() {
    if (!text.trim() || !userId) return;
    setSending(true);
    await supabase.from('support_messages').insert({
      student_id: userId,
      sender_role: 'student',
      message: text.trim(),
    });
    setText('');
    setSending(false);
    loadMessages();
  }

  if (!userId) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 lg:bottom-6 left-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#e8ad3c] to-[#b07a1a] shadow-[0_4px_20px_#00000060] grid place-items-center text-2xl"
      >
        💬
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-end sm:place-items-center" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm sm:rounded-2xl bg-[#0a0d13] border border-[#1b2029] flex flex-col h-[75vh] sm:h-[560px]"
          >
            <div className="flex items-center gap-3 p-4 border-b border-[#1b2029]">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#536b83] to-[#16253a] grid place-items-center font-extrabold">
                A
              </div>
              <div>
                <p className="font-bold text-sm">AboYazan</p>
                <p className="text-[11px] text-emerald-400">● متاح للدعم</p>
              </div>
              <button onClick={() => setOpen(false)} className="mr-auto text-[#7a8699] text-xl px-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-[#7a8699] text-sm mt-10">ابعت رسالتك الأولى للأدمن هنا 👋</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.sender_role === 'admin'
                          ? 'bg-[#161c26] text-white rounded-bl-sm'
                          : 'bg-gradient-to-br from-[#e8ad3c] to-[#b07a1a] text-[#111] rounded-br-sm'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#1b2029] flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-[#071221] border border-line rounded-full px-4 py-2.5 text-sm outline-none focus:border-gold"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="bg-gold text-[#111] font-bold rounded-full px-4 text-sm"
              >
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
