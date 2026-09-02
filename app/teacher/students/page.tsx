import { createClient } from '@/lib/supabase/server';

export default async function TeacherStudentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, enrollments(status, student:student_id(full_name, phone, whatsapp, father_phone, mother_phone, telegram_username))')
    .eq('teacher_id', user!.id);

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-6 lg:p-10">
      <h1 className="text-2xl font-black mb-1">طلابي</h1>
      <p className="text-[#7a7f8a] text-sm mb-8">بيانات الطلاب وأرقام أولياء الأمور للمتابعة</p>

      {(!courses || courses.length === 0) ? (
        <p className="text-[#7a7f8a] text-sm bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-6 text-center">لسه معندكش طلاب.</p>
      ) : (
        <div className="space-y-6">
          {courses.map((c: any) => {
            const approved = (c.enrollments ?? []).filter((e: any) => e.status === 'approved');
            if (approved.length === 0) return null;
            return (
              <div key={c.id}>
                <h2 className="text-sm font-bold mb-3">{c.title} ({approved.length} طالب)</h2>
                <div className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl divide-y divide-[#1b2029]">
                  {approved.map((e: any, i: number) => (
                    <div key={i} className="p-4">
                      <p className="font-bold text-sm mb-1.5">{e.student?.full_name}</p>
                      <div className="text-[11px] text-[#7a7f8a] space-y-0.5">
                        {e.student?.phone && <div>📱 الطالب: {e.student.phone}</div>}
                        {e.student?.whatsapp && <div>💬 واتساب: {e.student.whatsapp}</div>}
                        {e.student?.father_phone && <div>👨 الأب: {e.student.father_phone}</div>}
                        {e.student?.mother_phone && <div>👩 الأم: {e.student.mother_phone}</div>}
                        {e.student?.telegram_username && <div>✈️ @{e.student.telegram_username}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
