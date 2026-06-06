import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kra-super-secret-jwt-key-change-this-in-production-2024'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/evaluate') ||
    pathname.startsWith('/print') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check for admin session cookie
  const token = request.cookies.get('admin_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Token invalid or expired
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
