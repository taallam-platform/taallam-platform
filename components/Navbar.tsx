'use client';

import Link from 'next/link';
import Image from 'next/image';

type Profile = {
  full_name: string;
  avatar_url: string | null;
  role?: string;
} | null;

export function AvatarBadge({ profile, size = 40 }: { profile: Profile; size?: number }) {
  const initial = profile?.full_name?.trim()?.[0]?.toUpperCase() ?? '؟';

  if (profile?.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={profile.full_name}
        width={size}
        height={size}
        className="rounded-full object-cover border border-line"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full grid place-items-center border border-line bg-gradient-to-br from-[#536b83] to-[#16253a] font-extrabold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

export default function Navbar({ profile }: { profile: Profile }) {
  const links = [
    { href: '/courses', label: 'الكورسات' },
    { href: '/#teachers', label: 'المدرسون' },
    { href: '/#paths', label: 'مسارات التعلم' },
    { href: '/#pricing', label: 'الأسعار' },
    { href: '/#features', label: 'المميزات' },
  ];

  return (
    <header className="h-[82px] border-b border-line bg-[#030913dd] backdrop-blur-xl sticky top-0 z-50">
      <div className="container-app h-full flex items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-2 font-black text-[25px]">
          <span className="w-12 h-12 border border-[#9b7127] rounded-2xl grid place-items-center text-gold text-2xl bg-gradient-to-br from-[#1a1a12] to-[#080e19] shadow-[0_0_25px_#d99b2415]">
            🎓
          </span>
          <span>
            تعلّم
            <small className="block text-[8px] text-[#8492a5] font-medium">منصة تعليمية متكاملة</small>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-[#d3d9e5]">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="py-7 hover:text-gold transition">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {profile ? (
            <>
              {(profile.role === 'teacher' || profile.role === 'admin') && (
                <Link href="/teacher/dashboard" className="text-sm font-bold text-[#d3d9e5] hover:text-gold hidden sm:block">
                  لوحة المدرّس
                </Link>
              )}
              <Link href="/dashboard" className="text-sm font-bold text-[#d3d9e5] hover:text-gold hidden sm:block">
                كورساتي
              </Link>
              <Link href="/profile" className="flex items-center gap-2">
                <AvatarBadge profile={profile} size={42} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline text-sm !px-5 !py-2.5">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn-gold text-sm !px-5 !py-2.5">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
