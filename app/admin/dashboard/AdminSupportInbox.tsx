'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminSupportInbox() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadConversations() {
    const { data } = await supabase
      .from('support_messages')
      .select('student_id, message, sender_role, created_at, profiles:student_id(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    const grouped: Record<string, any> = {};
    for (const m of (data ?? []) as any[]) {
      if (!grouped[m.student_id]) {
        grouped[m.student_id] = {
          student_id: m.student_id,
          full_name: m.profiles?.full_name ?? 'طالب',
          last_message: m.message,
          last_time: m.created_at,
        };
      }
    }
    setConversations(Object.values(grouped));
    setLoading(false);
  }

  async function loadMessages(studentId: string) {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedStudent) loadMessages(selectedStudent);
  }, [selectedStudent]);

  async function handleReply() {
    if (!text.trim() || !selectedStudent) return;
    setSending(true);
    await supabase.from('support_messages').insert({
      student_id: selectedStudent,
      sender_role: 'admin',
      message: text.trim(),
    });
    setText('');
    setSending(false);
    loadMessages(selectedStudent);
    loadConversations();
  }

  if (loading) return <p className="text-[#7a7f8a] text-sm">جاري التحميل...</p>;

  if (conversations.length === 0) {
    return <p className="text-[#7a7f8a] text-sm bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-6 text-center">مفيش رسايل من الطلاب لسه.</p>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 bg-[#0a0d13] border border-[#1b2029] rounded-2xl overflow-hidden" style={{ minHeight: 420 }}>
      <div className="lg:col-span-1 border-l border-[#1b2029] divide-y divide-[#1b2029] max-h-[500px] overflow-y-auto">
        {conversations.map((c) => (
          <button
            key={c.student_id}
            onClick={() => setSelectedStudent(c.student_id)}
            className={`w-full text-right p-3.5 hover:bg-[#12151c] transition ${selectedStudent === c.student_id ? 'bg-[#12151c]' : ''}`}
          >
            <p className="font-bold text-sm">{c.full_name}</p>
            <p className="text-[#7a7f8a] text-xs truncate mt-0.5">{c.last_message}</p>
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 flex flex-col">
        {!selectedStudent ? (
          <p className="text-[#7a7f8a] text-sm p-6 text-center m-auto">اختار محادثة من القايمة</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.sender_role === 'admin'
                        ? 'bg-gradient-to-br from-[#e8ad3c] to-[#b07a1a] text-[#111] rounded-br-sm'
                        : 'bg-[#161c26] text-white rounded-bl-sm'
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[#1b2029] flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder="اكتب ردك..."
                className="flex-1 bg-[#050608] border border-[#22262e] rounded-full px-4 py-2.5 text-sm outline-none focus:border-gold"
              />
              <button
                onClick={handleReply}
                disabled={sending || !text.trim()}
                className="bg-gold text-[#111] font-bold rounded-full px-4 text-sm"
              >
                رد
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
