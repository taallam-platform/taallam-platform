import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';

const CATEGORIES = [
  ['💻', 'البرمجة'], ['🎨', 'التصميم'], ['📣', 'التسويق'],
  ['💼', 'إدارة الأعمال'], ['🌐', 'اللغات'], ['📊', 'البيانات'], ['🧠', 'التطوير الشخصي'],
];

const COVER_GRADIENTS: Record<string, string> = {
  blue: 'from-[#073c74] to-[#071525]',
  purple: 'from-[#4a146e] to-[#101329]',
  green: 'from-[#075d4c] to-[#071b20]',
  orange: 'from-[#6c3c0c] to-[#15110a]',
};

async function getFeaturedCourses() {
  const supabase = createClient();
  const { data } = await supabase
    .from('courses')
    .select('id, title, price, cover_color, category, teacher_id, profiles:teacher_id(full_name)')
    .eq('is_published', true)
    .limit(8);
  return data ?? [];
}

async function getProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();
  return data;
}

export default async function HomePage() {
  const [courses, profile] = await Promise.all([getFeaturedCourses(), getProfile()]);

  return (
    <>
      <Navbar profile={profile} />

      <main id="home">
        {/* Hero */}
        <section className="container-app grid lg:grid-cols-2 gap-5 items-center py-14">
          <div className="text-center lg:text-right">
            <span className="inline-flex items-center gap-2 text-gold-light bg-[#b07a1a13] border border-[#a97a2a45] rounded-full px-3.5 py-1.5 text-xs font-extrabold">
              ✦ تعلّم بطريقة مختلفة
            </span>
            <h1 className="text-[42px] lg:text-[70px] leading-[1.08] font-black mt-4 -tracking-wider">
              تعلّم بلا حدود
              <br />
              <span className="text-gold drop-shadow-[0_0_35px_#d99b2530]">واصنع مستقبلك</span>
            </h1>
            <p className="text-[#aab6c8] leading-loose max-w-xl mx-auto lg:mx-0 mt-4">
              منصة تعليمية متكاملة توفر لك آلاف الكورسات عالية الجودة من أفضل الخبراء
              والمدربين في مختلف المجالات، في تجربة تعلم احترافية وممتعة.
            </p>
            <div className="flex gap-3 flex-wrap justify-center lg:justify-start mt-7">
              <a href="#courses" className="btn-gold">ابدأ التعلم الآن ←</a>
              <a href="/courses" className="btn-outline">استكشف الكورسات ▦</a>
            </div>
          </div>

          <div className="h-[380px] lg:h-[520px] grid place-items-center relative">
            <div className="w-[90%] max-w-[650px] h-[280px] rounded-[22px] bg-gradient-to-br from-[#101d2e] to-navy border border-[#38516b] shadow-2xl p-4">
              <div className="h-full rounded-xl bg-gradient-to-br from-[#07172b] to-[#0b2440] border border-[#233f5c] grid place-items-center">
                <div className="w-14 h-14 rounded-full bg-gold grid place-items-center text-[#111] text-xl shadow-[0_0_30px_#e8ad3c55]">
                  ▶
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="container-app -mt-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 bg-gradient-to-l from-[#081525] to-[#0a1728] border border-[#1e334a] rounded-2xl p-5 shadow-2xl">
            {[['+1,200', 'كورس'], ['+50,000', 'طالب'], ['+300', 'مدرّس'], ['4.9', 'تقييم المنصة'], ['+120', 'دولة']].map(
              ([n, l]) => (
                <div key={l} className="text-center border-l border-[#26394e] last:border-0 py-2">
                  <strong className="block text-2xl text-gold">{n}</strong>
                  <span className="text-xs text-[#8392a8]">{l}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Categories */}
        <section id="paths" className="container-app py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">تصفح حسب الفئة</h2>
              <p className="text-muted text-sm mt-1.5">اختر المجال الذي تريد تطوير مهاراتك فيه</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {CATEGORIES.map(([icon, name]) => (
              <div key={name} className="min-w-[145px] border border-[#1a2d43] bg-[#071322] rounded-2xl p-4 text-center font-extrabold text-[#bdc8d7] hover:border-[#8f6826] hover:text-gold transition cursor-pointer">
                <span className="text-2xl block mb-1.5">{icon}</span>
                {name}
              </div>
            ))}
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="container-app py-4 pb-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">⭐ الكورسات المميزة</h2>
              <p className="text-muted text-sm mt-1.5">تعلم من خبراء متخصصين وبأسلوب عملي</p>
            </div>
          </div>

          {courses.length === 0 ? (
            <p className="text-muted text-sm text-center py-10 card">
              لسه مفيش كورسات منشورة — هتظهر هنا أول ما الأدمن يضيفها من لوحة التحكم.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {courses.map((c: any) => (
                <article key={c.id} className="card overflow-hidden hover:-translate-y-1 hover:border-[#8f6826] transition">
                  <div className={`h-[150px] p-3.5 bg-gradient-to-br relative overflow-hidden ${COVER_GRADIENTS[c.cover_color] ?? COVER_GRADIENTS.blue}`}>
                    <div className="absolute bottom-3.5 right-3.5 text-xl font-black">{c.category}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm leading-7 mb-2 font-bold">{c.title}</h3>
                    <div className="text-[#8493a7] text-[11px]">👤 {c.profiles?.full_name ?? 'مدرّس'}</div>
                    <div className="flex justify-between items-center mt-3.5 text-xs">
                      <span className="text-gold font-black text-[15px]">{c.price} ر.س</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section id="pricing" className="container-app my-8 mb-16 border border-[#6e5122] rounded-3xl bg-gradient-to-r from-[#0b192b] to-[#07101c] p-8 lg:p-11 flex flex-col lg:flex-row items-center justify-between gap-5 text-center lg:text-right">
          <div>
            <h2 className="text-xl font-bold mb-1.5">جاهز تبدأ رحلتك التعليمية؟</h2>
            <p className="text-[#8998ad] text-sm">انضم إلى آلاف المتعلمين وابدأ تطوير مهاراتك اليوم.</p>
          </div>
          <a href="/register" className="btn-gold">ابدأ الآن ←</a>
        </section>
      </main>

      <footer id="contact" className="border-t border-[#15273a] py-8 text-[#718198] text-xs">
        <div className="container-app flex flex-col lg:flex-row justify-between gap-5 text-center lg:text-right">
          <div>© 2026 تعلّم — منصة تعليمية متكاملة</div>
          <div>الخصوصية &nbsp; الشروط &nbsp; تواصل معنا</div>
        </div>
      </footer>
    </>
  );
}
