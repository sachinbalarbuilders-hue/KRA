'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiSend, FiPrinter } from 'react-icons/fi';

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'emp' | 'hod'>('emp');
  const [sending, setSending] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSendMail = async (target: 'EMP' | 'HOD', selectedEmployeeIds?: string[]) => {
    const key = target + (selectedEmployeeIds ? selectedEmployeeIds.join(',') : '');
    setSending(key);
    try {
      const res = await fetch(`/api/admin/cycles/${params.id}/send-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, selectedEmployeeIds })
      });
      const d = await res.json();
      alert(d.success ? d.message : d.error);
      if (d.success) {
        const r = await fetch(`/api/admin/cycles/${params.id}/tracking`);
        const data = await r.json();
        if (data.cycle) setCycle(data.cycle);
      }
    } catch {
      alert('Failed to send mail.');
    } finally {
      setSending(null);
    }
  };

  useEffect(() => {
    fetch(`/api/admin/cycles/${params.id}/tracking`)
      .then(res => res.json())
      .then(d => {
        if (d.cycle) setCycle(d.cycle);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading tracking data...</div>;
  if (!cycle) return <div style={{ padding: 40, textAlign: 'center' }}>Cycle not found</div>;

  const groupedByHod = cycle.submissions.reduce((acc: any, sub: any) => {
    const hod = sub.employee.hodName || 'Unassigned HOD';
    if (!acc[hod]) acc[hod] = [];
    acc[hod].push(sub);
    return acc;
  }, {});

  const fmt = (d: string) => d ? new Date(d).toLocaleString('en-IN') : '—';

  return (
    <div className="app-shell" style={{ padding: '0 32px' }}>
      <header className="topbar" style={{ justifyContent: 'center', padding: '0' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '1280px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={() => router.push('/')}>&larr; Back to Dashboard</button>
            <span style={{ marginLeft: 20, fontWeight: 600 }}>Tracking: {cycle.month} {cycle.year}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            Log out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '40px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <button className={`btn ${tab === 'emp' ? 'btn-black' : 'btn-outline'}`} onClick={() => setTab('emp')}>Employee Tracking</button>
            <button className={`btn ${tab === 'hod' ? 'btn-black' : 'btn-outline'}`} onClick={() => setTab('hod')}>HOD Tracking</button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>

            {tab === 'emp' ? (
              <button 
                className="btn btn-black" 
                onClick={() => handleSendMail('EMP')} 
                disabled={!!sending || !cycle.submissions.some((s: any) => s.status === 'PENDING_EMP')}
                style={{ opacity: !cycle.submissions.some((s: any) => s.status === 'PENDING_EMP') ? 0.5 : 1 }}
              >
                <FiSend size={14} style={{ marginRight: 8 }} />
                {sending === 'EMP' ? 'Sending to all...' : 'Send Reminders to All Pending Employees'}
              </button>
            ) : (
              <button 
                className="btn btn-black" 
                onClick={() => handleSendMail('HOD')} 
                disabled={!!sending || !cycle.submissions.some((s: any) => s.status === 'PENDING_HOD')}
                style={{ opacity: !cycle.submissions.some((s: any) => s.status === 'PENDING_HOD') ? 0.5 : 1 }}
              >
                <FiSend size={14} style={{ marginRight: 8 }} />
                {sending === 'HOD' ? 'Sending to all...' : 'Send Review Links to All Pending HODs'}
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            {tab === 'emp' ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Email Sent</th>
                    <th>Evaluated</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cycle.submissions.map((sub: any) => (
                    <tr key={sub.id}>
                      <td>{sub.employee.name} <br/><small style={{color:'#6b7280'}}>{sub.employee.email}</small></td>
                      <td>{sub.employee.department || '—'}</td>
                      <td>{fmt(sub.empEmailSentAt)}</td>
                      <td>{fmt(sub.empEvaluatedAt)}</td>
                      <td><span className="badge badge-indigo">{sub.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <a href={`/print/submission/${sub.id}`} target="_blank" className="btn btn-outline btn-sm" style={{ padding: '4px 12px', fontSize: '12px', textDecoration: 'none' }}>
                            <FiPrinter size={12} style={{ marginRight: 6 }} /> Print
                          </a>
                          {sub.status === 'PENDING_EMP' && (
                            <button 
                              className="btn btn-outline btn-sm" 
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                              onClick={() => handleSendMail('EMP', [sub.employee.id])}
                              disabled={!!sending}
                            >
                              <FiSend size={12} style={{ marginRight: 6 }} /> 
                              {sending === 'EMP'+sub.employee.id ? 'Sending...' : 'Remind'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 24 }}>
                {Object.keys(groupedByHod).map(hod => (
                  <div key={hod} style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#111827' }}>{hod}</h3>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: 4 }}>Email: {groupedByHod[hod][0]?.employee.hodEmail || 'Unknown Email'}</div>
                      </div>
                      {groupedByHod[hod].some((s: any) => s.status === 'PENDING_HOD') && (
                        <button 
                          className="btn btn-black btn-sm"
                          onClick={() => handleSendMail('HOD', groupedByHod[hod].map((s:any) => s.employee.id))}
                          disabled={!!sending}
                        >
                          <FiSend size={12} style={{ marginRight: 6 }} /> 
                          {sending === 'HOD'+groupedByHod[hod].map((s:any)=>s.employee.id).join(',') ? 'Sending...' : 'Send Review Link'}
                        </button>
                      )}
                    </div>
                    <table className="data-table" style={{ border: '1px solid #e5e7eb' }}>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Emp Status</th>
                          <th>HOD Evaluated</th>
                          <th>Final Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedByHod[hod].map((sub: any) => (
                          <tr key={sub.id}>
                            <td>{sub.employee.name}</td>
                            <td>{sub.employee.department || '—'}</td>
                            <td>{sub.empEvaluatedAt ? '✅ Done' : '⏳ Pending'}</td>
                            <td>{fmt(sub.hodEvaluatedAt)}</td>
                            <td><span className="badge badge-indigo">{sub.status}</span></td>
                            <td style={{ textAlign: 'right' }}>
                              <a href={`/print/submission/${sub.id}`} target="_blank" className="btn btn-outline btn-sm" style={{ padding: '4px 12px', fontSize: '12px', textDecoration: 'none' }}>
                                <FiPrinter size={12} style={{ marginRight: 6 }} /> Print
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}