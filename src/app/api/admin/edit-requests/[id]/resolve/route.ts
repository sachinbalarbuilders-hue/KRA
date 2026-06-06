import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { action, finalKras, adminNote } = await request.json();

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT.' }, { status: 400 });
    }

    const editRequest = await prisma.kraEditRequest.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            employee: { include: { kras: { orderBy: { createdAt: 'asc' } } } },
            evaluationCycle: true
          }
        }
      }
    });

    if (!editRequest) {
      return NextResponse.json({ error: 'Edit request not found.' }, { status: 404 });
    }

    if (editRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'This request has already been resolved.' }, { status: 400 });
    }

    const employee = editRequest.submission.employee;
    const cycle = editRequest.submission.evaluationCycle;
    const originalKras = employee.kras || [];
    const proposed = editRequest.proposedKras as any[];

    // finalKras = admin-edited version of proposed (or proposed itself if not edited)
    const toApply: any[] = finalKras || proposed;

    if (action === 'APPROVE') {
      // Apply the final (possibly admin-edited) KRAs to the employee's KRATemplates
      for (const item of toApply) {
        await prisma.kRATemplate.update({
          where: { id: item.kraTemplateId },
          data: { kra: item.kra, kpi: item.kpi }
        });
      }
    }

    // Update the edit request status
    await prisma.kraEditRequest.update({
      where: { id },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
    });

    // Save to history — always, for both approve and reject
    await prisma.kraEditHistory.create({
      data: {
        editRequestId: id,
        employeeId: employee.name,   // store name for easy display
        cycleName: `${cycle.month} ${cycle.year}`,
        action,
        originalKras: originalKras.map((k: any) => ({
          kraTemplateId: k.id,
          kra: k.kra,
          kpi: k.kpi,
          weightage: k.weightage
        })),
        proposedKras: proposed,
        finalKras: action === 'APPROVE' ? toApply : proposed,
        adminNote: adminNote || null
      }
    });

    return NextResponse.json({
      success: true,
      message: action === 'APPROVE'
        ? 'Proposed KRA/KPI edits approved and merged successfully.'
        : 'Proposed KRA/KPI edits rejected.'
    });

  } catch (error) {
    console.error('Error resolving edit request:', error);
    return NextResponse.json({ error: 'Failed to resolve edit request' }, { status: 500 });
  }
}
