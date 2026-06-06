import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const history = await prisma.kraEditHistory.findMany({
      orderBy: { resolvedAt: 'desc' },
      take: 100
    });
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching edit history:', error);
    return NextResponse.json({ error: 'Failed to fetch edit history' }, { status: 500 });
  }
}
