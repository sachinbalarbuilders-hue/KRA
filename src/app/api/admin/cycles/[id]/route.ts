import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Delete submissions first (scores and edit requests cascade), then the cycle
    await prisma.submission.deleteMany({ where: { evaluationCycleId: id } });
    await prisma.evaluationCycle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // P2025 = Record to delete does not exist. If it's already gone, treat as success!
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: true });
    }
    console.error('Delete cycle error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete cycle',
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}
