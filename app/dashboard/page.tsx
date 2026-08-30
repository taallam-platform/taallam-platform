import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';

export default async function StudentDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user!.id)
    .single();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, courses(title, cover_color, category)')
    .eq('student_id', user!.id);

  return (
    <>
      <Navbar profile={profile} />
      <main className="container-app py-10">
        <h1 className="text-2xl font-black mb-6">كورساتي</h1>
        {(!enrollments || enrollments.length === 0) ? (
          <p className="text-muted card p-8 text-center">لسه معندكش اشتراك في أي كورس.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((e: any) => (
              <div key={e.course_id} className="card p-5">
                <h3 className="font-bold">{e.courses?.title}</h3>
                <span className="text-muted text-xs">{e.courses?.category}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
