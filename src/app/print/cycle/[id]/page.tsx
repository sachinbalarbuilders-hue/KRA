import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function PrintCyclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id },
    include: {
      submissions: {
        where: { status: 'COMPLETED' },
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
    notFound();
  }

  if (cycle.submissions.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>No completed evaluations found for this cycle.</h2>
        <p>Only fully completed evaluations are included in the bulk print report.</p>
        <button id="close-tab-btn" style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Close Tab</button>
        <script dangerouslySetInnerHTML={{ __html: `
          var btn = document.getElementById('close-tab-btn');
          if (btn) btn.addEventListener('click', function() { window.close(); });
        ` }} />
      </div>
    );
  }

  return (
    <div className="print-bulk-container">
      <style>{`
        body { background: white !important; font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; }
        @media print {
          @page { size: A4; margin: 20mm 18mm; }
          .page-break { page-break-after: always; }
          .no-print { display: none !important; }
        }
        
        .page-break { page-break-after: always; padding: 2rem; max-width: 800px; margin: 0 auto; }
        .page-break:last-child { page-break-after: auto; }

        .eval-card { break-inside: avoid; border: 1px solid #d1d5db !important; margin-bottom: 18px !important; border-radius: 8px; overflow: hidden; }
        .eval-card-header { background: #f3f4f6 !important; padding: 10px 16px !important; border-bottom: 1px solid #d1d5db; display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; }
        .eval-card-body { padding: 14px 16px !important; }
        .eval-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .eval-divider { margin: 12px 0 !important; border: 0; border-top: 1px solid #e5e7eb; }
        
        .print-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #111827; display: flex; justify-content: space-between; align-items: flex-start; }
        .print-summary { display: flex; justify-content: flex-end; gap: 32px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
        
        .form-group { margin-bottom: 0; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 4px; }
      `}</style>

      <div className="no-print" style={{ padding: '1rem', background: '#f3f4f6', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <button id="manual-print-btn" style={{ padding: '0.5rem 1rem', background: '#111827', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Print Now</button>
        <span style={{ marginLeft: '1rem', color: '#4b5563', fontSize: '14px' }}>Please configure your print settings to A4 size.</span>
      </div>

      {cycle.submissions.map((sub) => {
        const totalWeight = sub.scores.reduce((acc, score) => acc + (score.kraTemplate?.weightage || 0), 0);
        const totalEmpScore = sub.scores.reduce((acc, score) => acc + (score.empScore || 0), 0);
        const totalHodScore = sub.scores.reduce((acc, score) => acc + (score.hodScore || 0), 0);

        return (
          <div key={sub.id} className="page-break">
            
            {/* Header */}
            <div className="print-header">
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>Performance Evaluation Report</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{sub.employee?.name}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{sub.employee?.department || 'Employee'} &nbsp;·&nbsp; {cycle.month} {cycle.year}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Generated on</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style={{ marginTop: '8px', background: '#f0fdf4', border: '1px solid #86efac', color: '#14532d', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-block' }}>COMPLETED</div>
              </div>
            </div>

            {/* Summary */}
            <div className="print-summary">
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>Total Employee Score</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{totalEmpScore} <span style={{ fontSize: '14px', fontWeight: 400, color: '#9ca3af' }}>/ {totalWeight}</span></div>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>Total HOD Score</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{totalHodScore} <span style={{ fontSize: '14px', fontWeight: 400, color: '#9ca3af' }}>/ {totalWeight}</span></div>
              </div>
            </div>

            {/* KRAs */}
            <div>
              {sub.scores.map((score, index) => {
                const weight = score.kraTemplate?.weightage || 0;
                return (
                  <div key={score.id} className="eval-card">
                    <div className="eval-card-header">
                      <span>KRA {index + 1}</span>
                      <span style={{ color: '#4f46e5' }}>{weight}% Weightage</span>
                    </div>
                    <div className="eval-card-body">
                      <div className="eval-two-col" style={{ marginBottom: '12px' }}>
                        <div>
                          <label className="form-label">KRA Description</label>
                          <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{score.kraTemplate?.kra}</div>
                        </div>
                        <div>
                          <label className="form-label">Key Performance Indicators</label>
                          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                            {(score.kraTemplate?.kpi || '').split('\n').filter(k => k.trim()).map((k, i) => (
                              <li key={i} style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>{k.trim()}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <hr className="eval-divider" />

                      <div className="eval-two-col" style={{ marginBottom: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Employee Score</label>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: '#3b82f6' }}>{score.empScore}<span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 400 }}>/{weight}</span></div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Employee Remark</label>
                          <div style={{ fontSize: '14px', color: '#374151', padding: '4px 0' }}>{score.empRemark || '—'}</div>
                        </div>
                      </div>

                      <div className="eval-two-col">
                        <div className="form-group">
                          <label className="form-label">HOD Score</label>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: '#f59e0b' }}>{score.hodScore}<span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 400 }}>/{weight}</span></div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">HOD Remark</label>
                          <div style={{ fontSize: '14px', color: '#374151', padding: '4px 0' }}>{score.hodRemark || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}

      <script dangerouslySetInnerHTML={{ __html: `
        window.onload = function() { 
          setTimeout(function() { window.print(); }, 500); 
          var btn = document.getElementById('manual-print-btn');
          if (btn) btn.addEventListener('click', function() { window.print(); });
        }
      ` }} />
    </div>
  );
}
