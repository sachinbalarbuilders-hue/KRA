import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, departments });
  } catch (error) {
    console.error('Fetch departments error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: { name: name.trim() }
    });

    return NextResponse.json({ success: true, department });
  } catch (error: any) {
    console.error('Create department error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Department already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
