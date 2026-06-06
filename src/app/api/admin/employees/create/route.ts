import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, department, hodName, hodEmail, kras } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Employee name and email are required' }, { status: 400 });
    }

    if (!kras || !Array.isArray(kras) || kras.length === 0) {
      return NextResponse.json({ error: 'At least one KRA is required' }, { status: 400 });
    }

    // Validate weights sum to 100
    const totalWeight = kras.reduce((sum, kra) => sum + (parseInt(kra.weightage) || 0), 0);
    if (totalWeight !== 100) {
      return NextResponse.json({ error: `KRA weights must sum up to exactly 100. Current total: ${totalWeight}` }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        department: department || null,
        hodName: hodName || 'Admin',
        hodEmail: hodEmail || 'admin@balarbuilders.com',
        kras: {
          create: kras.map(k => ({
            kra: k.kra,
            kpi: k.kpi,
            weightage: parseInt(k.weightage) || 0
          }))
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Employee and KRAs added successfully',
      employee
    });

  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
