import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const cycle = await prisma.evaluationCycle.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            employee: true,
            scores: {
              include: { kraTemplate: true }
            }
          }
        }
      }
    });

    if (!cycle) {
      return new NextResponse('Cycle not found', { status: 404 });
    }

    let csvContent = "Employee Name,Email,Department,HOD Name,KRA,KPI,Weightage,Emp Score,Emp Remark,HOD Score,HOD Remark,Status\n";

    for (const sub of cycle.submissions) {
      const emp = sub.employee;
      
      for (const score of sub.scores) {
        const kra = score.kraTemplate;
        // Escape quotes and wrap in quotes to prevent comma breaks
        const escapeCSV = (str: string | null) => `"${(str || '').replace(/"/g, '""')}"`;
        
        csvContent += `${escapeCSV(emp.name)},${escapeCSV(emp.email)},${escapeCSV(emp.department)},${escapeCSV(emp.hodName)},${escapeCSV(kra.kra)},${escapeCSV(kra.kpi)},${kra.weightage},${score.empScore || ''},${escapeCSV(score.empRemark)},${score.hodScore || ''},${escapeCSV(score.hodRemark)},${sub.status}\n`;
      }
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="Evaluation_Results_${cycle.month}_${cycle.year}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Failed to export CSV', { status: 500 });
  }
}
