import { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const locales = ['en', 'es'];
const defaultLocale = 'en';

function getLocale(request: NextRequest) {
  const acceptLang = request.headers.get("accept-language");
  if (acceptLang?.includes("es")) return "es";
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  // 1. Update Supabase Session
  const response = await updateSession(request);

  // 2. Add Locale Logic
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return response;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    response.cookies.set("NEXT_LOCALE", locale, { path: '/' });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
