import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';

const prisma = new PrismaClient();

export default async function PrintBlankKraForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { kras: { orderBy: { createdAt: 'asc' } } },
  });

  if (!employee) return notFound();

  const totalWeight = employee.kras.reduce((acc, k) => acc + k.weightage, 0);

  return (
    <div className="main-container" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #d1d5db' }}>
        <h1 style={{ margin: 0, fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px', color: '#111827' }}>Performance Evaluation</h1>
      </div>

      <div className="header-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', backgroundColor: '#f9fafb', border: '1px solid #9ca3af', padding: '16px 24px', borderRadius: '4px' }}>
        <div style={{ lineHeight: '1.6' }}>
          <p style={{ margin: '0' }}><strong>Employee:</strong> {employee.name}</p>
          <p style={{ margin: '0' }}><strong>Department:</strong> {employee.department || '—'}</p>
        </div>
        <div style={{ lineHeight: '1.6' }}>
          <p style={{ margin: '0' }}><strong>HOD:</strong> {employee.hodName}</p>
          <p style={{ margin: '0' }}><strong>Evaluation Cycle:</strong> _______________________</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6', color: '#111827' }}>
            <th style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', width: '40px' }}>#</th>
            <th style={{ border: '1px solid #374151', padding: '12px', textAlign: 'left', width: '25%' }}>KRA</th>
            <th style={{ border: '1px solid #374151', padding: '12px', textAlign: 'left', width: '25%' }}>KPI</th>
            <th style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', width: '60px' }}>Weight</th>
            <th style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', width: '60px' }}>Self<br/>Score</th>
            <th style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', width: '60px' }}>HOD<br/>Score</th>
            <th style={{ border: '1px solid #374151', padding: '12px', textAlign: 'left' }}>Remarks / Comments</th>
          </tr>
        </thead>
        <tbody>
          {employee.kras.map((kra, idx) => (
            <tr key={kra.id}>
              <td style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #374151', padding: '12px', verticalAlign: 'top' }}><strong>{kra.kra}</strong></td>
              <td style={{ border: '1px solid #374151', padding: '12px', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{kra.kpi}</td>
              <td style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>{kra.weightage}%</td>
              <td style={{ border: '1px solid #374151', padding: '12px' }}></td>
              <td style={{ border: '1px solid #374151', padding: '12px' }}></td>
              <td style={{ border: '1px solid #374151', padding: '12px' }}></td>
            </tr>
          ))}
          {employee.kras.length === 0 && (
            <tr>
              <td colSpan={7} style={{ border: '1px solid #374151', padding: '20px', textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }}>No KRAs defined for this employee.</td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <td colSpan={3} style={{ border: '1px solid #374151', padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL SCORE</td>
            <td style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{totalWeight}%</td>
            <td style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}></td>
            <td style={{ border: '1px solid #374151', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}></td>
            <td style={{ border: '1px solid #374151', padding: '12px' }}></td>
          </tr>
        </tbody>
      </table>

      <div className="signatures" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>Employee Signature</div>
          <div style={{ marginTop: '10px', color: '#666' }}>Date: ____/____/________</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>HOD Signature</div>
          <div style={{ marginTop: '10px', color: '#666' }}>Date: ____/____/________</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { 
            -webkit-print-color-adjust: exact; 
          }
          .main-container { padding: 0 !important; }
          .no-print { display: none !important; }
          table th, table td { padding: 4px 6px !important; font-size: 11px !important; }
          h1 { font-size: 16px !important; margin-bottom: 2px !important; }
          .header-info { padding: 6px 12px !important; margin-bottom: 10px !important; }
          .header-info div { line-height: 1.2 !important; }
          table { margin-bottom: 10px !important; }
          .signatures { margin-top: 15px !important; }
          tr { page-break-inside: avoid; }
        }
      `}} />
      
      <PrintButton />
    </div>
  );
}