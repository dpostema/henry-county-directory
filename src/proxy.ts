import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const locales = ['en', 'es'];
const defaultLocale = 'en';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute

function getLocale(request: NextRequest) {
  const acceptLang = request.headers.get("accept-language");
  if (acceptLang?.includes("es")) return "es";
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  // 1. Rate Limiting for API/Auth routes
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/auth/')) {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    if (ip !== 'unknown') {
      const now = Date.now();
      const userRecord = rateLimitMap.get(ip);
      
      if (!userRecord || now - userRecord.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        userRecord.count += 1;
        if (userRecord.count > MAX_REQUESTS_PER_WINDOW) {
          return new NextResponse('Too Many Requests. Please try again later.', { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((RATE_LIMIT_WINDOW_MS - (now - userRecord.lastReset)) / 1000).toString()
            }
          });
        }
      }
    }
  }

  // 2. Update Supabase Session
  const response = await updateSession(request);

  // 3. Add Locale Logic
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
