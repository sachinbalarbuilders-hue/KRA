import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Get the cycle details
    const cycle = await prisma.evaluationCycle.findUnique({
      where: { id }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Evaluation cycle not found.' }, { status: 404 });
    }

    // Parse requested selectedEmployeeIds if any
    let selectedEmployeeIds: string[] | undefined;
    let target: 'EMP' | 'HOD' = 'EMP';
    try {
      const body = await request.json();
      if (body && Array.isArray(body.selectedEmployeeIds)) {
        selectedEmployeeIds = body.selectedEmployeeIds;
      }
      if (body && body.target === 'HOD') {
        target = 'HOD';
      }
    } catch (e) {
      // Ignore: empty body means send to all employees
    }

    // 2. Get the active mail provider
    const provider = await prisma.mailProvider.findFirst({
      where: { isActive: true }
    });

    if (!provider) {
      return NextResponse.json({ error: 'No active SMTP mail provider found. Please configure and activate one in settings.' }, { status: 400 });
    }

    // 3. Get submissions for this cycle based on target
    const queryConditions: any = {
      evaluationCycleId: id,
      status: target === 'HOD' ? 'PENDING_HOD' : 'PENDING_EMP',
    };

    if (selectedEmployeeIds) {
      queryConditions.employeeId = { in: selectedEmployeeIds };
    }

    const submissions = await prisma.submission.findMany({
      where: queryConditions,
      include: { employee: true }
    });

    if (submissions.length === 0) {
      return NextResponse.json({ success: true, message: target === 'HOD' ? 'No pending HOD reviews found.' : 'No pending employee submissions found to send emails for.' });
    }

    // 4. Initialize Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: provider.host,
      port: parseInt(provider.port),
      secure: provider.secure,
      auth: { user: provider.email, pass: provider.password },
    });

    const senderName = provider.fromName || provider.title || 'HR Department';
    let emailsSent = 0;

    if (target === 'HOD') {
      // Group by HOD Email
      const groupedHods: Record<string, { hodName: string, subIds: string[], employees: { name: string, department: string, link: string }[] }> = {};
      
      for (const sub of submissions) {
        if (!sub.employee.hodEmail || !sub.hodToken) continue;
        const email = sub.employee.hodEmail;
        if (!groupedHods[email]) {
          groupedHods[email] = { hodName: sub.employee.hodName || 'HOD', subIds: [], employees: [] };
        }
        const hodLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/evaluate/${sub.hodToken}`;
        groupedHods[email].subIds.push(sub.id);
        groupedHods[email].employees.push({
          name: sub.employee.name,
          department: sub.employee.department || 'General',
          link: hodLink
        });
      }

      for (const [hodEmail, data] of Object.entries(groupedHods)) {
        try {
          const rows = data.employees.map(e => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${e.name}</strong><br/><span style="font-size: 12px; color: #6b7280;">${e.department}</span></td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                <a href="${e.link}" style="background: #111827; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">Review →</a>
              </td>
            </tr>
          `).join('');

          await transporter.sendMail({
            from: `"${senderName}" <${provider.email}>`,
            to: hodEmail,
            subject: `Action Required: Team Performance Reviews – ${cycle.month} ${cycle.year}`,
            html: `
              <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                <div style="background: #111827; padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 22px;">Team Review Required</h1>
                  <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">${cycle.month} ${cycle.year} Performance Evaluation</p>
                </div>
                <div style="padding: 32px; background: white;">
                  <p style="font-size: 16px; color: #344054;">Hello <strong>${data.hodName}</strong>,</p>
                  <p style="color: #667085; line-height: 1.6;">Your team members have completed their self-evaluations for <strong>${cycle.month} ${cycle.year}</strong>. Please review their submissions below:</p>
                  
                  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                    ${rows}
                  </table>
                  
                  <p style="color: #98A2B3; font-size: 13px; margin-top: 32px;">Please complete these reviews as soon as possible.</p>
                </div>
                <div style="padding: 20px 32px; background: #f8fafc; text-align: center; color: #98A2B3; font-size: 13px;">
                  Sent by ${senderName} · HR Management System
                </div>
              </div>
            `,
          });
          // Stamp hodEmailSentAt on all submissions in this HOD group
          await prisma.submission.updateMany({
            where: { id: { in: data.subIds } },
            data: { hodEmailSentAt: new Date() }
          });
          emailsSent++;
        } catch (err) {
          console.error(`Failed to send email to HOD ${hodEmail}`, err);
        }
      }
    } else {
      // Send individual emails to employees
      for (const sub of submissions) {
        try {
          if (!sub.employee.email) continue;
          const link = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/evaluate/${sub.empToken}`;
          await transporter.sendMail({
            from: `"${senderName}" <${provider.email}>`,
            to: sub.employee.email,
            subject: `Action Required: ${cycle.month} ${cycle.year} Performance Evaluation`,
            html: `
              <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                <div style="background: #4F46E5; padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 22px;">Performance Evaluation</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${cycle.month} ${cycle.year}</p>
                </div>
                <div style="padding: 32px; background: white;">
                  <p style="font-size: 16px; color: #344054;">Hello <strong>${sub.employee.name}</strong>,</p>
                  <p style="color: #667085; line-height: 1.6;">Your performance evaluation for <strong>${cycle.month} ${cycle.year}</strong> is ready. Please click the button below to access your evaluation form.</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${link}" style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Open Evaluation Form →</a>
                  </div>
                  <p style="color: #98A2B3; font-size: 13px;">If the button doesn't work, copy this link: <a href="${link}" style="color: #4F46E5;">${link}</a></p>
                </div>
                <div style="padding: 20px 32px; background: #f8fafc; text-align: center; color: #98A2B3; font-size: 13px;">
                  Sent by ${senderName} · HR Management System
                </div>
              </div>
            `,
          });
          // Stamp empEmailSentAt on this submission
          await prisma.submission.update({
            where: { id: sub.id },
            data: { empEmailSentAt: new Date() }
          });
          emailsSent++;
        } catch (err) {
          console.error(`Failed to send email for ${sub.employee.name}`, err);
        }
      }
    }

    // 5. Update timestamp on cycle
    if (emailsSent > 0) {
      await prisma.evaluationCycle.update({
        where: { id },
        data: target === 'HOD' ? { lastHodRemindedAt: new Date() } : { lastEmpRemindedAt: new Date() }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${emailsSent} of ${submissions.length} email(s) for the cycle.`
    });

  } catch (error: any) {
    console.error('Send emails error:', error);
    return NextResponse.json({ error: `Failed to dispatch emails: ${error.message || error}` }, { status: 500 });
  }
}
