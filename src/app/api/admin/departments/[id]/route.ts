import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name: name.trim() }
    });

    return NextResponse.json({ success: true, department });
  } catch (error: any) {
    console.error('Update department error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.department.delete({
      where: { id }
    });
    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
