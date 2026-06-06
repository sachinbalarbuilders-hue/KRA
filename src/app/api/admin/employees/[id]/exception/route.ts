import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { isException } = await request.json();

    if (typeof isException !== 'boolean') {
      return NextResponse.json({ error: 'isException boolean is required' }, { status: 400 });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { isException }
    });

    return NextResponse.json({
      success: true,
      message: `Employee marked as ${isException ? 'exception' : 'active'}`,
      isException: employee.isException
    });

  } catch (error) {
    console.error('Update exception error:', error);
    return NextResponse.json({ error: 'Failed to update exception status' }, { status: 500 });
  }
}
