import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { month, year, editDeadline, evalStart, evalEnd } = await request.json();

    if (!month || !year || !editDeadline || !evalStart || !evalEnd) {
      return NextResponse.json({ error: 'Missing required cycle details or timeline dates' }, { status: 400 });
    }

    // Create Evaluation Cycle
    const cycle = await prisma.evaluationCycle.create({
      data: {
        month,
        year: parseInt(year),
        kraEditDeadline: new Date(editDeadline),
        empEvalStartDate: new Date(evalStart),
        empEvalEndDate: new Date(evalEnd),
        isActive: true,
      },
    });

    const employees = await prisma.employee.findMany({ include: { kras: true } });

    const submissionsData = [];
    for (const emp of employees) {
      if (emp.kras.length === 0 || emp.isException) continue;
      submissionsData.push({
        employeeId: emp.id,
        evaluationCycleId: cycle.id,
        status: 'PENDING_EMP',
        empToken: crypto.randomBytes(32).toString('hex'),
      });
    }

    if (submissionsData.length > 0) {
      await prisma.submission.createMany({ data: submissionsData });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${submissionsData.length} evaluation link(s) for the cycle.`,
      cycleId: cycle.id,
    });

  } catch (error) {
    console.error('Error generating links:', error);
    return NextResponse.json({ error: 'Failed to generate links' }, { status: 500 });
  }
}
