import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    // 1. Fetch submission including employee, cycle and scores
    const submission = await prisma.submission.findFirst({
      where: {
        OR: [
          { empToken: token },
          { hodToken: token }
        ]
      },
      include: {
        employee: {
          include: {
            kras: {
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        evaluationCycle: true,
        editRequest: true,
        scores: {
          include: {
            kraTemplate: true
          },
          orderBy: {
            kraTemplate: {
              createdAt: 'asc'
            }
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Evaluation link not found or expired.' }, { status: 404 });
    }

    // Check if the cycle is active
    if (!submission.evaluationCycle.isActive) {
      return NextResponse.json({ error: 'This evaluation cycle has been deactivated by the administrator.' }, { status: 403 });
    }

    // Merge pending KRA/KPI edit requests if status is PENDING
    let employeeKras = submission.employee.kras;
    const hasPendingEditRequest = submission.editRequest?.status === 'PENDING';
    
    if (submission.editRequest && hasPendingEditRequest) {
      const proposed = submission.editRequest.proposedKras as any[];
      employeeKras = employeeKras.map(k => {
        const prop = proposed.find((p: any) => p.kraTemplateId === k.id);
        if (prop) {
          return { ...k, kra: prop.kra, kpi: prop.kpi };
        }
        return k;
      });
    }

    const mergedEmployee = {
      ...submission.employee,
      kras: employeeKras
    };

    // 2. Employee token path
    if (token === submission.empToken) {
      if (submission.status === 'PENDING_EMP') {
        const now = new Date();
        const kraEditDeadline = new Date(submission.evaluationCycle.kraEditDeadline);
        const empEvalStartDate = new Date(submission.evaluationCycle.empEvalStartDate);
        const empEvalEndDate = new Date(submission.evaluationCycle.empEvalEndDate);

        const canEditKra = now <= kraEditDeadline;
        const isTooEarly = now < empEvalStartDate;
        const canSubmitScore = now >= empEvalStartDate && now <= empEvalEndDate;

        if (now > empEvalEndDate) {
          return NextResponse.json({ error: 'The evaluation deadline has passed. This link is locked.' }, { status: 403 });
        }

        return NextResponse.json({
          status: 'ok',
          type: 'EMP',
          submissionId: submission.id,
          canEditKra,
          isTooEarly,
          canSubmitScore,
          hasPendingEditRequest,
          employee: mergedEmployee,
          cycle: submission.evaluationCycle,
          kras: employeeKras,
        });
      } else if (submission.status === 'PENDING_HOD' || submission.status === 'COMPLETED') {
        // If it's already submitted by employee, we can either block it or show completed
        if (submission.status === 'COMPLETED') {
          return NextResponse.json({
            status: 'ok',
            type: 'COMPLETED',
            submissionId: submission.id,
            employee: submission.employee,
            cycle: submission.evaluationCycle,
            scores: submission.scores,
          });
        }
        return NextResponse.json({
          status: 'used',
          message: 'Employee has already submitted this evaluation.'
        });
      }
    }

    // 3. HOD token path
    if (token === submission.hodToken) {
      if (submission.status === 'PENDING_EMP') {
        return NextResponse.json({
          status: 'used',
          message: 'Waiting for the employee to submit their evaluation first.'
        });
      } else if (submission.status === 'PENDING_HOD') {
        return NextResponse.json({
          status: 'ok',
          type: 'HOD',
          submissionId: submission.id,
          employee: submission.employee,
          cycle: submission.evaluationCycle,
          scores: submission.scores,
        });
      } else if (submission.status === 'COMPLETED') {
        return NextResponse.json({
          status: 'ok',
          type: 'COMPLETED',
          submissionId: submission.id,
          employee: submission.employee,
          cycle: submission.evaluationCycle,
          scores: submission.scores,
        });
      }
    }

    return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 404 });

  } catch (error) {
    console.error('Error fetching evaluation by token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, type, scores, remarks, updatedKras, updatedKpis } = body;

    const submission = await prisma.submission.findFirst({
      where: {
        OR: [
          { empToken: token },
          { hodToken: token }
        ]
      },
      include: {
        evaluationCycle: true
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    if (!submission.evaluationCycle.isActive) {
      return NextResponse.json({ error: 'This evaluation cycle is inactive.' }, { status: 403 });
    }

    // Action A: Save KRA edits during Setup Phase
    if (action === 'save_kras') {
      if (token !== submission.empToken) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
      if (submission.status !== 'PENDING_EMP') {
        return NextResponse.json({ error: 'Cannot edit KRAs after submitting evaluation.' }, { status: 400 });
      }
      const now = new Date();
      if (now > new Date(submission.evaluationCycle.kraEditDeadline)) {
        return NextResponse.json({ error: 'The setup deadline has passed.' }, { status: 400 });
      }

      const templates = await prisma.kRATemplate.findMany({
        where: { employeeId: submission.employeeId },
        orderBy: { createdAt: 'asc' }
      });

      if (!updatedKras || !updatedKpis || updatedKras.length !== templates.length) {
        return NextResponse.json({ error: 'Mismatch in KRA/KPI list.' }, { status: 400 });
      }

      const proposed = templates.map((t, idx) => ({
        kraTemplateId: t.id,
        kra: updatedKras[idx],
        kpi: updatedKpis[idx]
      }));

      await prisma.kraEditRequest.upsert({
        where: { submissionId: submission.id },
        update: {
          proposedKras: proposed,
          status: 'PENDING'
        },
        create: {
          submissionId: submission.id,
          proposedKras: proposed,
          status: 'PENDING'
        }
      });

      return NextResponse.json({ success: true, message: 'Your KRA/KPI edits have been submitted to the Admin for review.' });
    }

    // Action B: Employee Submission
    if (type === 'EMP') {
      if (token !== submission.empToken) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
      if (submission.status !== 'PENDING_EMP') {
        return NextResponse.json({ error: 'Evaluation already submitted.' }, { status: 400 });
      }

      const now = new Date();
      if (now < new Date(submission.evaluationCycle.empEvalStartDate)) {
        return NextResponse.json({ error: 'Evaluation has not started yet.' }, { status: 400 });
      }
      if (now > new Date(submission.evaluationCycle.empEvalEndDate)) {
        return NextResponse.json({ error: 'Evaluation deadline has passed.' }, { status: 400 });
      }

      const templates = await prisma.kRATemplate.findMany({
        where: { employeeId: submission.employeeId },
        orderBy: { createdAt: 'asc' }
      });

      if (!scores || scores.length !== templates.length) {
        return NextResponse.json({ error: 'Scores list is invalid or incomplete.' }, { status: 400 });
      }

      // If they also edited KRA/KPI (if deadline permits), send to Admin Review Queue instead of direct update
      if (now <= new Date(submission.evaluationCycle.kraEditDeadline) && updatedKras && updatedKpis && updatedKras.length === templates.length) {
        const proposed = templates.map((t, idx) => ({
          kraTemplateId: t.id,
          kra: updatedKras[idx],
          kpi: updatedKpis[idx]
        }));
        await prisma.kraEditRequest.upsert({
          where: { submissionId: submission.id },
          update: { proposedKras: proposed, status: 'PENDING' },
          create: { submissionId: submission.id, proposedKras: proposed, status: 'PENDING' }
        });
      }

      // Upsert employee scores
      for (let i = 0; i < templates.length; i++) {
        await prisma.submissionScore.upsert({
          where: {
            submissionId_kraTemplateId: {
              submissionId: submission.id,
              kraTemplateId: templates[i].id
            }
          },
          update: {
            empScore: parseFloat(scores[i]),
            empRemark: remarks[i] || '',
          },
          create: {
            submissionId: submission.id,
            kraTemplateId: templates[i].id,
            empScore: parseFloat(scores[i]),
            empRemark: remarks[i] || '',
          }
        });
      }

      // Advance status to PENDING_HOD, generate hodToken
      const hodToken = crypto.randomBytes(32).toString('hex');
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: 'PENDING_HOD',
          hodToken,
          empEvaluatedAt: new Date()
        }
      });

      // The auto-email to HOD has been disabled by request.
      // HODs will now only receive the consolidated department email when 
      // the Admin clicks the manual "Remind HOD" button on the dashboard.

      return NextResponse.json({ success: true });
    }

    // Action C: HOD Submission
    if (type === 'HOD') {
      if (token !== submission.hodToken) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
      if (submission.status !== 'PENDING_HOD') {
        return NextResponse.json({ error: 'Review not pending HOD.' }, { status: 400 });
      }

      const templates = await prisma.kRATemplate.findMany({
        where: { employeeId: submission.employeeId },
        orderBy: { createdAt: 'asc' }
      });

      if (!scores || scores.length !== templates.length) {
        return NextResponse.json({ error: 'Scores list is invalid or incomplete.' }, { status: 400 });
      }

      // Update HOD scores
      for (let i = 0; i < templates.length; i++) {
        await prisma.submissionScore.update({
          where: {
            submissionId_kraTemplateId: {
              submissionId: submission.id,
              kraTemplateId: templates[i].id
            }
          },
          data: {
            hodScore: parseFloat(scores[i]),
            hodRemark: remarks[i] || '',
          }
        });
      }

      // Complete submission with HOD timestamp
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: 'COMPLETED',
          hodEvaluatedAt: new Date()
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid operation.' }, { status: 400 });

  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
