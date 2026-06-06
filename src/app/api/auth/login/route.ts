import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kra-super-secret-jwt-key-change-this-in-production-2024'
);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    console.log('Login attempt:', { inputUser: username, envUser: adminUsername });
    console.log('Stored Hash Check:', { 
      hash: adminPasswordHash,
      startsWithQuote: adminPasswordHash.startsWith("'") || adminPasswordHash.startsWith('"')
    });

    if (username !== adminUsername) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    let cleanHash = adminPasswordHash.trim();
    if (cleanHash.startsWith("'") && cleanHash.endsWith("'")) {
      cleanHash = cleanHash.slice(1, -1);
    }
    if (cleanHash.startsWith('"') && cleanHash.endsWith('"')) {
      cleanHash = cleanHash.slice(1, -1);
    }

    console.log('Username matched, checking password...');
    const passwordMatch = await bcrypt.compare(password, cleanHash);
    console.log('Password match result:', passwordMatch);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    // Create JWT token valid for 8 hours
    const token = await new SignJWT({ username, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
