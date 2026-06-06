import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cycles = await prisma.evaluationCycle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: {
          select: {
            status: true,
            empToken: true,
            hodToken: true,
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ cycles });
  } catch (error) {
    console.error('Error fetching cycles:', error);
    return NextResponse.json({ error: 'Failed to fetch cycles' }, { status: 500 });
  }
}
