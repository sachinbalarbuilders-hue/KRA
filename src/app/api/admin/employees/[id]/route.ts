import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.employee.delete({
      where: { id }
    });
    return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Use a transaction to update employee and recreate KRAs
    const employee = await prisma.$transaction(async (tx) => {
      // Delete all existing KRAs for this employee
      await tx.kRATemplate.deleteMany({
        where: { employeeId: id }
      });

      // Update employee and create new KRAs
      return await tx.employee.update({
        where: { id },
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
        },
        include: {
          kras: true
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee
    });

  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}
