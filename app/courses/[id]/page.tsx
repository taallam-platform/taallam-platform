'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import SecureMaterialPlayer from '@/components/SecureMaterialPlayer';
import EnrollButton from './EnrollButton';

const TYPE_LABELS: Record<string, string> = {
  video: '🎬 فيديو', pdf: '📄 PDF', docx: '📝 Word', pptx: '📊 PowerPoint', link: '🔗 رابط',
};

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [course, setCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadReviews() {
    const { data: r } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, student_id, profiles:student_id(full_name, avatar_url)')
      .eq('course_id', params.id)
      .order('created_at', { ascending: false });
    setReviews(r ?? []);
  }

  async function handleSubmitReview() {
    if (!myRating) return;
    setSubmittingReview(true);
    await supabase.from('reviews').upsert(
      { course_id: params.id, student_id: userId, rating: myRating, comment: myComment || null },
      { onConflict: 'student_id,course_id' }
    );
    setSubmittingReview(false);
    loadReviews();
  }

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: c } = await supabase
      .from('courses')
      .select('*, profiles:teacher_id(full_name)')
      .eq('id', params.id)
      .single();
    setCourse(c);
    await loadReviews();

    if (user) {
      setUserId(user.id);
      const { data: p } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();
      setProfile(p);

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('student_id', user.id)
        .eq('course_id', params.id)
        .maybeSingle();
      setIsEnrolled(enrollment?.status === 'approved');
      setIsPending(enrollment?.status === 'pending');

      const { data: myReview } = await supabase
        .from('reviews')
        .select('rating, comment')
        .eq('course_id', params.id)
        .eq('student_id', user.id)
        .maybeSingle();
      if (myReview) {
        setMyRating(myReview.rating);
        setMyComment(myReview.comment ?? '');
      }

      if (enrollment) {
        const { data: m } = await supabase
          .from('course_materials')
          .select('*')
          .eq('course_id', params.id)
          .order('order_index');
        setMaterials(m ?? []);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id]);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) return <div className="min-h-screen bg-navy grid place-items-center text-muted">جاري التحميل...</div>;
  if (!course) return <div className="min-h-screen bg-navy grid place-items-center text-muted">الكورس غير موجود</div>;

  return (
    <>
      <Navbar profile={profile} />
      <main className="container-app py-10">
        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-black mb-2">{course.title}</h1>
          <p className="text-muted text-sm mb-4">{course.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted mb-4 flex-wrap">
            <span>👤 {course.profiles?.full_name ?? 'مدرّس'}</span>
            <span>📂 {course.category}</span>
            {reviews.length > 0 && (
              <span className="text-gold font-bold">
                ⭐ {avgRating.toFixed(1)} ({reviews.length} تقييم)
              </span>
            )}
          </div>

          {isPending && (
            <div className="border-t border-line pt-4">
              <div className="bg-amber-950/40 border border-amber-800 text-amber-300 text-sm rounded-lg p-3.5">
                ⏳ طلبك قيد المراجعة، هتقدر تدخل الكورس بمجرد ما الإدارة توافق.
              </div>
            </div>
          )}

          {!isEnrolled && !isPending && (
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="text-gold font-black text-xl">{course.price} ج.م</span>
              <EnrollButton courseId={course.id} price={course.price} onEnrolled={loadData} />
            </div>
          )}
        </div>

        {isEnrolled && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">محتوى الكورس ({materials.length} مادة)</h2>
            <div className="space-y-3">
              {materials.map((m) => (
                <div key={m.id} className="card p-4">
                  <span className="text-xs text-gold font-bold">{TYPE_LABELS[m.type]}</span>
                  <h3 className="font-bold text-sm mt-1 mb-2">{m.title}</h3>
                  {m.type === 'link' ? (
                    <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm inline-block">
                      فتح الرابط ↗
                    </a>
                  ) : (
                    <SecureMaterialPlayer materialId={m.id} type={m.type} title={m.title} />
                  )}
                </div>
              ))}
              {materials.length === 0 && (
                <p className="text-muted text-sm card p-6 text-center">لسه المدرّس مضافش مواد للكورس ده.</p>
              )}
            </div>
          </div>
        )}

        {/* التقييمات */}
        <div>
          <h2 className="text-lg font-bold mb-4">التقييمات {reviews.length > 0 && `(${reviews.length})`}</h2>

          {isEnrolled && (
            <div className="card p-5 mb-5">
              <p className="text-sm font-bold mb-2.5">قيّم الكورس ده</p>
              <div className="flex gap-1.5 mb-3 text-2xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setMyRating(n)} className={n <= myRating ? 'text-gold' : 'text-[#2c3d52]'}>
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="اكتب رأيك في الكورس (اختياري)"
                rows={3}
                className="w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold text-sm mb-3"
              />
              <button
                onClick={handleSubmitReview}
                disabled={!myRating || submittingReview}
                className="btn-gold text-sm"
              >
                {submittingReview ? 'جاري الحفظ...' : 'إرسال التقييم'}
              </button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-muted text-sm card p-6 text-center">لسه مفيش تقييمات للكورس ده.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold">{r.profiles?.full_name ?? 'طالب'}</span>
                    <span className="text-gold text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
