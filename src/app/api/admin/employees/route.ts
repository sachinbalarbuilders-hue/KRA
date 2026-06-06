export const dynamic = 'force-dynamic';

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        kras: true
      }
    });
    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
