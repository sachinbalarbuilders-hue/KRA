import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const requests = await prisma.kraEditRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        submission: {
          include: {
            employee: {
              include: { kras: { orderBy: { createdAt: 'asc' } } }
            },
            evaluationCycle: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching edit requests:', error);
    return NextResponse.json({ error: 'Failed to fetch edit requests' }, { status: 500 });
  }
}
