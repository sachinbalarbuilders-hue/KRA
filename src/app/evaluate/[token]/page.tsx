'use client';

import { useState, useEffect, use } from 'react';

export default function EvaluatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingKras, setSavingKras] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scores, setScores] = useState<string[]>([]);
  const [remarks, setRemarks] = useState<string[]>([]);
  const [updatedKras, setUpdatedKras] = useState<string[]>([]);
  const [updatedKpis, setUpdatedKpis] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch(`/api/evaluate/${token}`)
      .then(r => r.json())
      .then(result => {
        if (result.status === 'ok') {
          setData(result);
          const len = result.kras?.length || result.scores?.length || 0;
          setScores(Array(len).fill(''));
          setRemarks(Array(len).fill(''));
          if (result.type === 'EMP') {
            setUpdatedKras(result.kras.map((k: any) => k.kra));
            setUpdatedKpis(result.kras.map((k: any) => k.kpi));
          }
          
          if (typeof window !== 'undefined' && window.location.search.includes('print=true')) {
            setTimeout(() => window.print(), 500);
          }
        } else {
          setError(result.message || result.error || 'Invalid link');
        }
      })
      .catch(() => setError('Connection error. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/evaluate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: data.submissionId,
          type: data.type,
          scores,
          remarks,
          updatedKras: data.canEditKra ? updatedKras : undefined,
          updatedKpis: data.canEditKra ? updatedKpis : undefined,
        }),
      });
      const result = await res.json();
      if (result.success) setSuccess(true);
      else alert(result.error);
    } catch { alert('Submission failed.'); }
    finally { setSubmitting(false); }
  };

  const handleSaveKras = async () => {
    setSavingKras(true);
    try {
      const res = await fetch(`/api/evaluate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: data.submissionId,
          action: 'save_kras',
          updatedKras,
          updatedKpis,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('Changes requested & under review. Admin will review your request.');
      } else {
        showToast(result.error || 'Failed to submit request.', 'error');
      }
    } catch {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setSavingKras(false);
    }
  };

  if (loading) return <div className="spinner" />;

  if (error) return (
    <div style={{ maxWidth: 480, margin: '5rem auto', padding: '0 1.5rem' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <svg width="24" height="24" fill="none" stroke="var(--danger)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{error}</p>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ maxWidth: 480, margin: '5rem auto', padding: '0 1.5rem' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <svg width="24" height="24" fill="none" stroke="var(--success)" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Your evaluation has been recorded securely.</p>
      </div>
    </div>
  );

  const isEmp = data.type === 'EMP';
  const isCompleted = data.type === 'COMPLETED';
  const roleName = isEmp ? 'Employee' : 'HOD';
  const items = isEmp ? data.kras : data.scores;
  
  const totalWeight = items?.reduce((acc: number, item: any) => acc + (isEmp ? item.weightage : item.kraTemplate?.weightage || 0), 0) || 0;
  const totalEmpScore = isCompleted ? (data.scores?.reduce((acc: number, s: any) => acc + (s.empScore || 0), 0) || 0) : 0;
  const totalHodScore = isCompleted ? (data.scores?.reduce((acc: number, s: any) => acc + (s.hodScore || 0), 0) || 0) : 0;

  if (isCompleted) {
    return <CompletedReportView data={data} totalWeight={totalWeight} totalEmpScore={totalEmpScore} totalHodScore={totalHodScore} />;
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem', position: 'relative' }} className="animate-fade-in eval-page-container">

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
            Performance Evaluation
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem', margin: '0.25rem 0 0 0' }}>
            {data.cycle.month} {data.cycle.year} &nbsp;·&nbsp; {data.employee.name}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="no-print">
          {isCompleted && <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Download PDF</button>}
          <span className={`badge ${isCompleted ? 'badge-success' : isEmp ? 'badge-info' : 'badge-warning'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            {isCompleted ? 'Completed' : `${roleName} View`}
          </span>
        </div>
      </div>

      {/* Phase Banners */}
      {isEmp && data.canEditKra && (
        <div className="banner banner-info no-print">
          <h4>Setup Phase Active</h4>
          <p>You can edit your KRA and KPI text. Score submission opens on {new Date(data.cycle.empEvalStartDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}.</p>
        </div>
      )}
      {isEmp && data.isTooEarly && !data.canEditKra && (
        <div className="banner banner-warning no-print">
          <h4>Waiting Period</h4>
          <p>Setup window has closed. Score submission opens on {new Date(data.cycle.empEvalStartDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}.</p>
        </div>
      )}
      {isEmp && data.canSubmitScore && (
        <div className="banner banner-success no-print">
          <h4>Evaluation Window Open</h4>
          <p>Please submit your scores before {new Date(data.cycle.empEvalEndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}.</p>
        </div>
      )}
      {isCompleted && (
        <div className="banner banner-gray no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>Evaluation Closed</h4>
            <p>This evaluation has been fully submitted and is locked for editing.</p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>Emp Score</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{totalEmpScore} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#9ca3af' }}>/ {totalWeight}</span></div>
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>HOD Score</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{totalHodScore} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#9ca3af' }}>/ {totalWeight}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Print Summary */}
      {isCompleted && (
        <div className="print-summary" style={{ display: 'none', justifyContent: 'flex-end', gap: '32px', marginBottom: '24px', padding: '16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>Total Employee Score</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{totalEmpScore} <span style={{ fontSize: '14px', fontWeight: 400, color: '#9ca3af' }}>/ {totalWeight}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>Total HOD Score</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{totalHodScore} <span style={{ fontSize: '14px', fontWeight: 400, color: '#9ca3af' }}>/ {totalWeight}</span></div>
          </div>
        </div>
      )}
      {isEmp && !data.canSubmitScore && !data.isTooEarly && !data.canEditKra && !isCompleted && (
        <div className="banner banner-gray no-print">
          <h4>Evaluation Closed</h4>
          <p>The evaluation window ended on {new Date(data.cycle.empEvalEndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}.</p>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: toast.type === 'success' ? '#14532d' : '#991b1b',
          padding: '0.875rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          fontSize: '0.9rem', fontWeight: 500, maxWidth: '340px',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.type === 'success'
            ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.message}
        </div>
      )}

      {/* KRA Cards */}
      <form onSubmit={handleSubmit}>
        {items.map((item: any, index: number) => {
          const kraText = isEmp ? item.kra : item.kraTemplate.kra;
          const kpiText = isEmp ? item.kpi : item.kraTemplate.kpi;
          const weight  = isEmp ? item.weightage : item.kraTemplate.weightage;

          return (
            <div key={item.id} className="eval-card">
              <div className="eval-card-header">
                <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>KRA {index + 1}</span>
                <span className="badge banner-gray" style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}>{weight}% weightage</span>
              </div>
              <div className="eval-card-body">
                <div className="eval-two-col">
                  <div>
                    <label className="form-label">Key Result Area</label>
                    {isEmp && data.canEditKra
                      ? <textarea className="form-control form-control-textarea" value={updatedKras[index]} onChange={e => { const a = [...updatedKras]; a[index] = e.target.value; setUpdatedKras(a); }} required />
                      : <div style={{ padding: '0.75rem 0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{kraText}</div>
                    }
                  </div>
                  <div>
                    <label className="form-label">Key Performance Indicators</label>
                    {isEmp && data.canEditKra
                      ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(updatedKpis[index] || '').split('\n').map((kpiStr: string, bulletIndex: number, arr: string[]) => (
                            <div key={bulletIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                              <input 
                                className="form-control" 
                                style={{ flex: 1 }}
                                value={kpiStr} 
                                onChange={e => {
                                  const newArr = [...arr];
                                  newArr[bulletIndex] = e.target.value;
                                  const newUpdatedKpis = [...updatedKpis];
                                  newUpdatedKpis[index] = newArr.join('\n');
                                  setUpdatedKpis(newUpdatedKpis);
                                }} 
                                placeholder="Enter KPI requirement" 
                                required 
                              />
                              <button 
                                type="button" 
                                className="btn btn-danger-ghost btn-icon" 
                                onClick={() => {
                                  if (arr.length > 1) {
                                    const newArr = arr.filter((_, i) => i !== bulletIndex);
                                    const newUpdatedKpis = [...updatedKpis];
                                    newUpdatedKpis[index] = newArr.join('\n');
                                    setUpdatedKpis(newUpdatedKpis);
                                  }
                                }}
                                disabled={arr.length <= 1}
                                title="Remove Bullet"
                              >
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            className="btn btn-outline btn-sm" 
                            style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
                            onClick={() => {
                              const newUpdatedKpis = [...updatedKpis];
                              newUpdatedKpis[index] = (newUpdatedKpis[index] || '') + '\n';
                              setUpdatedKpis(newUpdatedKpis);
                            }}
                          >
                            + Add Bullet Point
                          </button>
                        </div>
                      )
                      : <div style={{ padding: '0.75rem 0.875rem', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                            {kpiText.split('\n').filter((k: string) => k.trim()).map((k: string, i: number) => (
                              <li key={i} style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>{k.trim()}</li>
                            ))}
                          </ul>
                        </div>
                    }
                  </div>
                </div>

                <hr className="eval-divider" />

                {/* Employee score display for HOD / Completed */}
                {(!isEmp || isCompleted) && (
                  <div className="eval-two-col" style={{ marginBottom: isCompleted ? '1rem' : 0 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Employee Score</label>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3b82f6' }}>{item.empScore}<span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 400 }}>/{weight}</span></div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Employee Remark</label>
                      <div style={{ fontSize: '0.9375rem', color: '#374151', padding: '0.5rem 0' }}>{item.empRemark || '—'}</div>
                    </div>
                  </div>
                )}

                {/* HOD scores display for Completed */}
                {isCompleted && (
                  <div className="eval-two-col" style={{ marginTop: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">HOD Score</label>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f59e0b' }}>{item.hodScore}<span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 400 }}>/{weight}</span></div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">HOD Remark</label>
                      <div style={{ fontSize: '0.9375rem', color: '#374151', padding: '0.5rem 0' }}>{item.hodRemark || '—'}</div>
                    </div>
                  </div>
                )}

                {/* Score input for active forms */}
                {!isCompleted && (
                  <div className="eval-two-col no-print">
                    <div className="form-group" style={{ margin: 0 }} title={isEmp && !data.canSubmitScore ? `Scoring opens on ${new Date(data.cycle.empEvalStartDate).toLocaleDateString()}` : undefined}>
                      <label className="form-label">{roleName} Score (Max: {weight}) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="number" min="0" max={weight} step="0.5" className="form-control"
                        value={scores[index]}
                        onChange={e => { const a = [...scores]; a[index] = e.target.value; setScores(a); }}
                        required disabled={isEmp && !data.canSubmitScore} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }} title={isEmp && !data.canSubmitScore ? `Scoring opens on ${new Date(data.cycle.empEvalStartDate).toLocaleDateString()}` : undefined}>
                      <label className="form-label">{roleName} Remark</label>
                      <input type="text" className="form-control" placeholder="Optional remarks..."
                        value={remarks[index]}
                        onChange={e => { const a = [...remarks]; a[index] = e.target.value; setRemarks(a); }}
                        disabled={isEmp && !data.canSubmitScore} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="eval-footer eval-footer-mobile-sticky no-print">
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: '#374151', fontSize: '1rem' }}>
              Total Weight: {items?.reduce((acc: number, item: any) => acc + (isEmp ? item.weightage : item.kraTemplate.weightage), 0) || 0}%
            </div>
            <div style={{ fontWeight: 600, color: '#4f46e5', fontSize: '1rem' }}>
              Total Score: {scores.reduce((acc, s) => acc + (parseFloat(s) || 0), 0)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isEmp && data.canEditKra && (
              <button type="button" className="btn btn-outline" style={{ height: '40px', padding: '0 1rem', fontSize: '0.9375rem' }}
                onClick={handleSaveKras} disabled={savingKras || submitting}>
                {savingKras ? 'Requesting...' : 'Request Changes'}
              </button>
            )}
            <button type="submit" className="btn btn-black" style={{ height: '40px', padding: '0 1.5rem', fontSize: '0.9375rem' }}
              disabled={submitting || (isEmp && !data.canSubmitScore) || savingKras}
              title={isEmp && !data.canSubmitScore ? `Scoring opens on ${new Date(data.cycle.empEvalStartDate).toLocaleDateString()}` : undefined}>
              {submitting ? 'Submitting...' : `Submit Evaluation`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ════ COMPLETED REPORT VIEW (SCREEN & A4 PORTRAIT) ════
function CompletedReportView({ data, totalWeight, totalEmpScore, totalHodScore }: { data: any, totalWeight: number, totalEmpScore: number, totalHodScore: number }) {
  return (
    <div className="report-container">
      <style>{`
        body { background: #f8fafc; font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; }
        .report-container { max-width: 900px; margin: 2rem auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); position: relative; }
        
        .r-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
        .r-title { font-size: 24px; font-weight: 800; color: #111827; text-align: center; flex: 1; }
        .r-company { font-size: 14px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; width: 150px; }
        .r-date { font-size: 12px; color: #6b7280; width: 150px; text-align: right; }
        
        .r-info-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .r-emp-name { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
        .r-emp-sub { font-size: 14px; color: #4b5563; margin-top: 2px; }
        .r-badge { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; }

        .r-score-bar { display: flex; gap: 16px; margin-bottom: 24px; }
        .r-score-block { flex: 1; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        .r-score-emp { background: #eff6ff; border: 1px solid #bfdbfe; }
        .r-score-hod { background: #fffbeb; border: 1px solid #fde68a; }
        .r-score-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; }
        .r-score-val { font-size: 24px; font-weight: 800; }

        .r-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .r-card { border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; min-width: 0; }
        .r-card-head { background: #f9fafb; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px; color: #374151; flex-wrap: nowrap; white-space: nowrap; }
        .r-card-body { padding: 14px; }
        .r-card-desc { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
        .r-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; display: block; }
        .r-text { font-size: 14px; color: #374151; line-height: 1.6; }
        .r-kpi-list { margin: 0; padding-left: 18px; font-size: 14px; color: #374151; line-height: 1.6; }
        
        .r-score-row { display: flex; gap: 0; border-top: 1px solid #f3f4f6; padding-top: 12px; margin-top: 4px; }
        .r-score-item { flex: 1; padding: 0 14px 0 0; }
        .r-score-item + .r-score-item { border-left: 1px solid #e5e7eb; padding-left: 14px; }
        .r-val { font-size: 18px; font-weight: 700; display: block; margin-top: 2px; }
        .r-remark-text { font-size: 13px; color: #374151; display: block; margin-top: 2px; }

        .r-print-btn { position: absolute; top: 16px; right: 16px; background: #111827; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; }

        /* ════ PRINT STYLES ════ */
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body { background: white !important; font-size: 8.5px !important; }
          .report-container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; }
          .r-print-btn { display: none !important; }
          
          /* Compress Header */
          .r-header { border-bottom: 1px solid #111827; padding-bottom: 4px; margin-bottom: 8px; }
          .r-title { font-size: 14px !important; }
          .r-company, .r-date { font-size: 9px !important; width: auto; }
          
          /* Compress Info & Scores into one line */
          .r-info-bar { margin-bottom: 10px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }
          .r-emp-name { font-size: 14px !important; display: inline-block; margin-right: 8px !important; }
          .r-emp-sub { font-size: 10px !important; display: inline-block; }
          .r-badge { padding: 2px 6px !important; font-size: 9px !important; margin-left: 8px !important; }
          .r-score-bar { display: none !important; } /* Hide large score bar */

          /* Add slim score summary in header */
          .print-slim-scores { display: flex !important; gap: 12px; font-size: 10px !important; font-weight: 700; align-items: center; }

          /* Two-Column Grid */
          .r-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
          
          /* Card Compression */
          .r-card { border: 0.5px solid #9ca3af !important; border-radius: 0 !important; break-inside: avoid !important; }
          .r-card-head { padding: 4px 6px !important; font-size: 10px !important; border-bottom: 0.5px solid #d1d5db !important; }
          .r-card-body { padding: 5px 8px !important; }
          .r-card-desc { gap: 8px !important; margin-bottom: 6px !important; }
          
          .r-label { font-size: 8px !important; margin-bottom: 2px !important; }
          .r-text { font-size: 8.5px !important; line-height: 1.3 !important; }
          .r-kpi-list { font-size: 8px !important; padding-left: 10px !important; line-height: 1.2 !important; }
          
          /* Inline Score Row */
          .r-score-row { display: flex !important; flex-wrap: nowrap !important; gap: 6px !important; padding-top: 4px !important; margin-top: 4px !important; border-top: 0.5px solid #e5e7eb !important; }
          .r-score-item { flex: auto !important; border-right: 0.5px solid #e5e7eb; padding-right: 6px; }
          .r-score-item:last-child { border-right: none; padding-right: 0; }
          .r-val { font-size: 10px !important; display: inline-block; margin-left: 4px; }
          .r-remark-text { font-size: 8.5px !important; display: inline-block; margin-left: 4px; }
        }
        .print-slim-scores { display: none; }
      `}</style>

      <button className="r-print-btn no-print" onClick={() => window.print()}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Print / PDF
      </button>

      <div className="r-header">
        <div className="r-title">Performance Evaluation Report</div>
        <div className="r-date">Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>

      <div className="r-info-bar">
        <div>
          <span className="r-emp-name">{data.employee?.name}</span>
          <span className="r-emp-sub">{data.employee?.department || 'Employee'} &nbsp;·&nbsp; {data.cycle?.month} {data.cycle?.year}</span>
          <span className="r-badge">COMPLETED</span>
        </div>
        
        {/* Only visible in print to save space */}
        <div className="print-slim-scores">
          <span style={{ color: '#2563eb' }}>Emp: {totalEmpScore} / {totalWeight}</span>
          <span style={{ color: '#d97706' }}>HOD: {totalHodScore} / {totalWeight}</span>
        </div>
      </div>

      <div className="r-score-bar no-print">
        <div className="r-score-block r-score-emp">
          <div className="r-score-label">Total Employee Score</div>
          <div className="r-score-val" style={{ color: '#2563eb' }}>{totalEmpScore} <span style={{ fontSize: '16px', color: '#60a5fa' }}>/ {totalWeight}</span></div>
        </div>
        <div className="r-score-block r-score-hod">
          <div className="r-score-label">Total HOD Score</div>
          <div className="r-score-val" style={{ color: '#d97706' }}>{totalHodScore} <span style={{ fontSize: '16px', color: '#fbbf24' }}>/ {totalWeight}</span></div>
        </div>
      </div>

      <div className="r-grid">
        {data.scores.map((score: any, index: number) => {
          const weight = score.kraTemplate?.weightage || 0;
          return (
            <div key={score.id} className="r-card">
              <div className="r-card-head">
                <span>KRA {index + 1}</span>
                <span style={{ color: '#4f46e5' }}>{weight}% Weightage</span>
              </div>
              
              <div className="r-card-body">
                <div className="r-card-desc">
                  <div>
                    <span className="r-label">Key Result Area</span>
                    <div className="r-text">{score.kraTemplate?.kra}</div>
                  </div>
                  <div>
                    <span className="r-label">Key Performance Indicators</span>
                    <ul className="r-kpi-list">
                      {(score.kraTemplate?.kpi || '').split('\n').filter((k: string) => k.trim()).map((k: string, i: number) => (
                        <li key={i}>{k.trim().replace(/^[-•]\s*/, '')}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="r-score-row">
                  <div className="r-score-item">
                    <span className="r-label" style={{ display: 'inline', marginRight: '4px' }}>EMP SCORE:</span>
                    <span className="r-val" style={{ color: '#2563eb' }}>{score.empScore}</span>
                  </div>
                  
                  {score.empRemark && (
                    <div className="r-score-item">
                      <span className="r-label" style={{ display: 'inline', marginRight: '4px' }}>EMP REMARK:</span>
                      <span className="r-remark-text r-text">{score.empRemark}</span>
                    </div>
                  )}

                  <div className="r-score-item">
                    <span className="r-label" style={{ display: 'inline', marginRight: '4px' }}>HOD SCORE:</span>
                    <span className="r-val" style={{ color: '#d97706' }}>{score.hodScore}</span>
                  </div>

                  {score.hodRemark && (
                    <div className="r-score-item">
                      <span className="r-label" style={{ display: 'inline', marginRight: '4px' }}>HOD REMARK:</span>
                      <span className="r-remark-text r-text">{score.hodRemark}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <script dangerouslySetInnerHTML={{ __html: 'if (window.location.search.includes("print=true")) { setTimeout(function() { window.print(); }, 500); }' }} />
    </div>
  );
}
