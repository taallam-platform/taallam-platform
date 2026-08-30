# تعلّم — منصة تعليمية (Next.js 14 + Supabase)

## 1. تجهيز Termux

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git -y
node -v   # لازم 18 أو أعلى
```

## 2. إنشاء مشروع Supabase

1. روح على https://supabase.com وسجل دخول، اعمل مشروع جديد.
2. من **SQL Editor** الصق محتوى `supabase/schema.sql` كامل وشغّله (Run).
3. من **Storage** تأكد إن الـ buckets `avatars` و `course-materials` اتعملوا (الملف بيعملهم تلقائي).
4. من **Authentication → Providers → Email** فعّل "Confirm email" عشان يبعت إيميل تفعيل تلقائي.
5. **مهم جدًا عشان يبعت كود مش رابط:** روح **Authentication → Email Templates → Confirm signup**
   وامسح المحتوى الافتراضي واستبدله بحاجة زي:
   ```html
   <h2>كود تأكيد حسابك في تعلّم</h2>
   <p>الكود بتاعك هو:</p>
   <h1>{{ .Token }}</h1>
   <p>الكود صالح لمدة ساعة واحدة.</p>
   ```
   المهم إنك تستخدم `{{ .Token }}` بدل `{{ .ConfirmationURL }}` — ده اللي بيخلي المستخدم
   ياخد كود 6 أرقام يكتبه في صفحة `/verify` بدل ما يدوس على رابط.
5. من **Authentication → URL Configuration** حط الـ Site URL بتاع Railway بعد النشر.
6. من **Project Settings → API** انسخ:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (سري جدًا، متحطوش في أي مكان public)

## 3. أول أدمن (تلقائي)

حط إيميلك في متغير `ADMIN_EMAIL` في `.env.local` (وفي Railway بعد النشر برضه).
أي حساب يتسجل أو يدخل بنفس الإيميل ده هيتحول تلقائيًا لأدمن ويروح على طول
لـ `/admin/dashboard` — من غير أي تعديل يدوي في Supabase.

⚠️ `ADMIN_EMAIL` سيرفر بس (متتحطش قدامها `NEXT_PUBLIC_`) عشان محدش يشوفها من الفرونت إند.

## 4. الشغل محليًا من Termux

```bash
cd elearn
cp .env.example .env.local
nano .env.local   # املأ القيم اللي نسختها فوق
npm install
npm run dev
```

افتح المتصفح على `http://localhost:3000`.

## 5. رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "أول نسخة من منصة تعلّم"
git branch -M main
git remote add origin https://github.com/USERNAME/taallam.git
git push -u origin main
```

(لازم تعمل الـ repo فاضي الأول من موقع GitHub، وتسجل دخول بـ Personal Access Token في Termux بدل الباسورد العادي).

## 6. النشر على Railway

1. من https://railway.app اعمل **New Project → Deploy from GitHub repo** واختار الـ repo.
2. في تبويب **Variables** ضيف نفس متغيرات `.env.local` (الأربعة).
3. Railway هيكتشف Next.js تلقائي ويعمل `npm run build` ثم `npm start`.
4. بعد النشر خد الدومين اللي هيديهولك وحطه في:
   - `NEXT_PUBLIC_SITE_URL` في Railway نفسه
   - Supabase → Authentication → URL Configuration → Site URL

## ملاحظات أمان مهمة

- ملف `.env.local` **متضيفوش أبدًا** لـ git (موجود بالفعل في `.gitignore`).
- `SUPABASE_SERVICE_ROLE_KEY` بيتستخدم في السيرفر بس (API routes)، أبدًا في الـ client.
- الـ RLS policies شغالة على مستوى الداتابيز نفسها، فحتى لو حصل باگ في الفرونت إند
  الطالب مش هيقدر يشوف كورسات غير مشترك فيها ولا يعدل بيانات حد تاني.
- فيديوهات لحد 500MB — Supabase Storage بيستحمل ده، بس لو الكورسات كتّرت جدًا
  فكر تستخدم خدمة بث متخصصة (Mux / Cloudflare Stream) بدل رفع الفيديو الخام.
