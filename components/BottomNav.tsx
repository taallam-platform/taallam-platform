'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', icon: '🏠', label: 'البيت' },
  { href: '/courses', icon: '📚', label: 'الدورات' },
  { href: '/progress', icon: '📈', label: 'التقدم' },
  { href: '/profile', icon: '👤', label: 'أنت' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#030913f5] backdrop-blur-xl border-t border-line lg:hidden">
      <div className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition ${
                active ? 'text-gold' : 'text-[#7a8699]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
