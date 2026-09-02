'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressAvatar } from '@/lib/image-compress';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [chosenRole, setChosenRole] = useState<'student' | 'teacher'>('student');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { ok: password.length >= 8, label: '8 أحرف على الأقل' },
    { ok: /[A-Z]/.test(password), label: 'حرف كبير' },
    { ok: /[a-z]/.test(password), label: 'حرف صغير' },
    { ok: /[0-9]/.test(password), label: 'رقم' },
  ];

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const compressed = await compressAvatar(f);
      setAvatarFile(compressed);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordRules.every((r) => r.ok)) {
      setError('كلمة السر لازم تحقق كل الشروط تحت');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, chosenRole, username, email, password, phone, whatsapp, fatherPhone, motherPhone, telegramUsername }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? 'حصل خطأ، حاول تاني');
      setLoading(false);
      return;
    }

    if (avatarFile) {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      await fetch('/api/upload/avatar', { method: 'POST', body: formData });
    }

    setLoading(false);
    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="min-h-screen grid place-items-center bg-navy px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-black text-center mb-1">إنشاء حساب جديد</h1>
        <p className="text-muted text-sm text-center mb-6">انضم لمنصة تعلّم وابدأ رحلتك</p>

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-5">
          <label className="cursor-pointer">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-line grid place-items-center overflow-hidden bg-[#0b1a2c]">
              {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted text-center">صورة<br />اختياري</span>
              )}
            </div>
            <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setChosenRole('student')}
            className={`rounded-xl py-3 text-sm font-bold border transition ${
              chosenRole === 'student' ? 'bg-gold text-[#111] border-gold' : 'border-line text-muted'
            }`}
          >
            🎓 طالب
          </button>
          <button
            type="button"
            onClick={() => setChosenRole('teacher')}
            className={`rounded-xl py-3 text-sm font-bold border transition ${
              chosenRole === 'teacher' ? 'bg-gold text-[#111] border-gold' : 'border-line text-muted'
            }`}
          >
            👨‍🏫 مدرّس
          </button>
        </div>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">الاسم الكامل</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="اسمك بالكامل"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">اسم المستخدم</span>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="username"
            dir="ltr"
            pattern="[a-zA-Z0-9_]+"
            title="حروف إنجليزي وأرقام و _ بس"
          />
          <span className="text-[11px] text-muted mt-1 block">هتستخدمه لتسجيل الدخول بعد كده</span>
        </label>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">البريد الإلكتروني</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="example@mail.com"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">رقم موبايلك (للمكالمات)</span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">رقم الواتساب</span>
          <input
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">رقم موبايل الأب</span>
          <input
            required
            value={fatherPhone}
            onChange={(e) => setFatherPhone(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">رقم موبايل الأم</span>
          <input
            required
            value={motherPhone}
            onChange={(e) => setMotherPhone(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-bold text-[#d3d9e5]">يوزر تيليجرام بتاعك</span>
          <input
            required
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="username (من غير @)"
            dir="ltr"
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm font-bold text-[#d3d9e5]">كلمة السر</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full bg-[#071221] border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-gold"
            placeholder="••••••••"
          />
        </label>

        <ul className="grid grid-cols-2 gap-1 mb-6 text-xs">
          {passwordRules.map((r) => (
            <li key={r.label} className={r.ok ? 'text-emerald-400' : 'text-muted'}>
              {r.ok ? '✓' : '○'} {r.label}
            </li>
          ))}
        </ul>

        <button disabled={loading} className="btn-gold w-full justify-center">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>

        <p className="text-center text-sm text-muted mt-5">
          عندك حساب بالفعل؟ <a href="/login" className="text-gold font-bold">تسجيل الدخول</a>
        </p>
      </form>
    </main>
  );
}
