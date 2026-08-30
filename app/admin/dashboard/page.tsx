import { createClient } from '@/lib/supabase/server';
import CoursesList from './CoursesList';
import UsersTable from './UsersTable';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [{ count: studentsCount }, { count: coursesCount }, { data: users }, { data: courses }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, avatar_url, role, is_banned').order('created_at', { ascending: false }).limit(50),
    supabase.from('courses').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-6 lg:p-10">
      <h1 className="text-2xl font-black mb-1">لوحة تحكم الأدمن</h1>
      <p className="text-[#7a7f8a] text-sm mb-8">نظرة عامة وإدارة المستخدمين والكورسات</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-5">
          <span className="text-[#7a7f8a] text-xs">إجمالي الطلاب</span>
          <strong className="block text-3xl mt-1 text-gold">{studentsCount ?? 0}</strong>
        </div>
        <div className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl p-5">
          <span className="text-[#7a7f8a] text-xs">إجمالي الكورسات</span>
          <strong className="block text-3xl mt-1 text-gold">{coursesCount ?? 0}</strong>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">إدارة الكورسات</h2>
        <a href="/admin/dashboard/courses/new" className="btn-gold text-sm !px-4 !py-2">+ إضافة كورس جديد</a>
      </div>
      <CoursesList courses={courses ?? []} />

      <h2 className="text-lg font-bold mb-4">إدارة المستخدمين</h2>
      <div className="bg-[#0a0d13] border border-[#1b2029] rounded-2xl overflow-hidden">
        <UsersTable users={users ?? []} />
      </div>
    </main>
  );
}
