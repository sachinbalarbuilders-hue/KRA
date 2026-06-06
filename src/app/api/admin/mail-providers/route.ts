import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET all providers
export async function GET() {
  try {
    const providers = await prisma.mailProvider.findMany({
      select: {
        id: true,
        title: true,
        host: true,
        port: true,
        encryption: true,
        secure: true,
        fromName: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ providers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

// POST create new provider
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, host, port, encryption, secure, fromName, email, password } = body;

    if (!title || !host || !port || !email || !password) {
      return NextResponse.json({ error: 'Title, host, port, email, and password are required.' }, { status: 400 });
    }

    const provider = await prisma.mailProvider.create({
      data: { title, host, port, encryption: encryption || 'TLS / SSL / STARTTLS', secure: !!secure, fromName, email, password },
    });

    const { password: _, ...providerWithoutPassword } = provider;
    return NextResponse.json({ success: true, provider: providerWithoutPassword });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}
