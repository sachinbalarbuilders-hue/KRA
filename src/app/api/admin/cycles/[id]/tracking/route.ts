export const dynamic = 'force-dynamic';

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cycle = await prisma.evaluationCycle.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                hodName: true,
                hodEmail: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    return NextResponse.json({ cycle });
  } catch (error: any) {
    console.error('Tracking API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 });
  }
}
