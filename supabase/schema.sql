-- ============================================================
-- منصة "تعلّم" — Supabase Schema + RLS
-- شغّل الملف ده كامل في Supabase SQL Editor
-- ============================================================

-- 1) الأدوار
create type user_role as enum ('admin', 'teacher', 'student');

-- 2) جدول البروفايلات (مرتبط بـ auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  avatar_url text,
  role user_role not null default 'student',
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- إنشاء بروفايل تلقائيًا عند تسجيل مستخدم جديد
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) الكورسات
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  description text,
  teacher_id uuid references public.profiles(id) on delete set null,
  category text,
  price numeric(10,2) not null default 0 check (price >= 0),
  cover_color text default 'blue',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4) مواد الكورس (فيديو / مستند / رابط)
create type material_type as enum ('video', 'pdf', 'docx', 'pptx', 'link');

create table public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  type material_type not null,
  storage_path text,
  external_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- 5) الاشتراكات (الطالب مسجل في كورس)
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- 6) محاولات الدخول الفاشلة (Rate limiting بسيط على مستوى الـ DB)
create table public.login_attempts (
  id bigserial primary key,
  ip_address text not null,
  email text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index on public.login_attempts (ip_address, attempted_at);

-- ============================================================
-- تفعيل RLS على كل الجداول
-- ============================================================
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_materials enable row level security;
alter table public.enrollments enable row level security;
alter table public.login_attempts enable row level security;

-- Helper: هل المستخدم الحالي أدمن؟
create or replace function public.is_admin()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- profiles ----------
create policy "المستخدم يشوف بروفايله"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "المستخدم يعدل بروفايله بس"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (
    id = auth.uid() and role = 'student' -- الطالب مينفعش يغير role نفسه
    or public.is_admin()
  );

create policy "الأدمن يحذف يوزرز"
  on public.profiles for delete
  using (public.is_admin());

-- ---------- courses ----------
create policy "الكل يشوف الكورسات المنشورة"
  on public.courses for select
  using (is_published = true or public.is_admin() or teacher_id = auth.uid());

create policy "الأدمن أو المدرس يضيف كورسات"
  on public.courses for insert
  with check (
    public.is_admin()
    or (auth.uid() = teacher_id and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'teacher'
    ))
  );

create policy "الأدمن أو المدرس صاحب الكورس يعدل"
  on public.courses for update
  using (public.is_admin() or teacher_id = auth.uid());

create policy "الأدمن بس يحذف كورسات"
  on public.courses for delete
  using (public.is_admin());

-- ---------- course_materials (الطالب لازم يكون مشترك في الكورس) ----------
create policy "الطالب المشترك أو الأدمن يشوف المواد"
  on public.course_materials for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = course_id and c.teacher_id = auth.uid()
    )
    or exists (
      select 1 from public.enrollments e
      where e.course_id = course_materials.course_id and e.student_id = auth.uid()
    )
  );

create policy "الأدمن أو المدرس صاحب الكورس يضيف مواد"
  on public.course_materials for insert
  with check (
    public.is_admin()
    or exists (select 1 from public.courses c where c.id = course_id and c.teacher_id = auth.uid())
  );

create policy "الأدمن أو المدرس صاحب الكورس يعدل مواد"
  on public.course_materials for update
  using (
    public.is_admin()
    or exists (select 1 from public.courses c where c.id = course_id and c.teacher_id = auth.uid())
  );

create policy "الأدمن أو المدرس صاحب الكورس يحذف مواد"
  on public.course_materials for delete
  using (
    public.is_admin()
    or exists (select 1 from public.courses c where c.id = course_id and c.teacher_id = auth.uid())
  );

-- ---------- enrollments ----------
create policy "الطالب يشوف اشتراكاته بس"
  on public.enrollments for select
  using (student_id = auth.uid() or public.is_admin());

create policy "الطالب يسجل نفسه بس"
  on public.enrollments for insert
  with check (student_id = auth.uid() or public.is_admin());

create policy "الأدمن بس يحذف اشتراك"
  on public.enrollments for delete
  using (public.is_admin());

-- ---------- login_attempts (سيرفر فقط) ----------
create policy "محدش يقرا محاولات الدخول غير الأدمن"
  on public.login_attempts for select
  using (public.is_admin());
-- الإدراج بيتم عن طريق service_role من الـ API route (بيتخطى RLS تلقائيًا)

-- ============================================================
-- Storage Buckets
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png']),
  ('course-materials', 'course-materials', false, 524288000,
    array['video/mp4','application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation']);

-- avatars: أي حد لوجن يرفع صورته بس، وكل حد يقدر يشوف أي أفاتار (public)
create policy "الكل يشوف الأفاتارز"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "المستخدم يرفع أفاتار في فولدر بمعرفه بس"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "المستخدم يحدث أفاتاره بس"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- course-materials: خاص، الطالب المشترك بس (أو الأدمن) يقدر يقرا عن طريق signed URL
create policy "الأدمن أو المدرس صاحب الكورس يرفع مواد"
  on storage.objects for insert
  with check (
    bucket_id = 'course-materials'
    and (
      public.is_admin()
      or exists (
        select 1 from public.courses c
        where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid()
      )
    )
  );

create policy "الأدمن أو المدرس صاحب الكورس يحذف مواد"
  on storage.objects for delete
  using (
    bucket_id = 'course-materials'
    and (
      public.is_admin()
      or exists (
        select 1 from public.courses c
        where c.id::text = (storage.foldername(name))[1] and c.teacher_id = auth.uid()
      )
    )
  );

-- ملحوظة: القراءة (select) على bucket الخاص ده بتتم عن طريق signed URL
-- تتولد من API route بعد التحقق من اشتراك الطالب، مش بشكل مباشر من الـ client.
