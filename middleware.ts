import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isSharedCoursePath = path.startsWith('/admin/dashboard/courses');
  const isAdminPath = path.startsWith('/admin') && path !== '/admin/login' && !isSharedCoursePath;
  const isTeacherPath = path.startsWith('/teacher') || isSharedCoursePath;

  // حماية كل صفحات /admin/* ماعدا صفحة تسجيل دخول الأدمن نفسها
  if (isAdminPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin' || profile.is_banned) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // حماية صفحات المدرّس — أدمن أو تيتشر بس
  if (isTeacherPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role) || profile.is_banned) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // حماية صفحات الطالب اللي محتاجة تسجيل دخول
  const protectedStudentPaths = ['/profile', '/dashboard'];
  if (protectedStudentPaths.some((p) => path.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
  ],
};
