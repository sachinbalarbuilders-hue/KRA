'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiX, FiTrash2, FiEdit2, FiSend, FiChevronRight } from 'react-icons/fi';

// ── TYPES ──────────────────────────────────────────────────────
interface KPI { text: string }
interface KRA { kra: string; weightage: string; kpis: KPI[] }
interface Employee { id: string; name: string; email: string; hodName?: string; hodEmail?: string; kras?: any[]; isException?: boolean }
interface Cycle { id: string; month: string; year: number; kraEditDeadline: string; empEvalStartDate: string; empEvalEndDate: string; isActive: boolean; submissions?: any[] }
interface Provider { id: string; title: string; host: string; port: string; encryption: string; secure: boolean; fromName?: string; email: string; isActive: boolean }
interface Department { id: string; name: string }



export default function Dashboard() {
  const [tab, setTab] = useState<'cycles' | 'employees' | 'settings'>('cycles');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Cycles
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [month, setMonth] = useState('July');
  const [year, setYear] = useState('2026');
  const [editDeadline, setEditDeadline] = useState('2026-07-10');
  const [evalStart, setEvalStart] = useState('2026-08-01');
  const [evalEnd, setEvalEnd] = useState('2026-08-05');
  const [generating, setGenerating] = useState(false);
  const [sendingCycleId, setSendingCycleId] = useState<string | null>(null);
  const [sendingHodCycleId, setSendingHodCycleId] = useState<string | null>(null);

  // Email Panel States
  const [emailPanel, setEmailPanel] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState<'all' | 'select'>('all');
  const [checkedEmployees, setCheckedEmployees] = useState<string[]>([]);

  // Results Panel
  const [resultsPanel, setResultsPanel] = useState(false);
  const [deletingCycleId, setDeletingCycleId] = useState<string | null>(null);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empPanel, setEmpPanel] = useState(false);
  const [savingEmp, setSavingEmp] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [hodName, setHodName] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [kras, setKras] = useState<KRA[]>([{ kra: '', weightage: '', kpis: [{ text: '' }] }]);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);

  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptPanel, setDeptPanel] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Providers
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provPanel, setProvPanel] = useState(false);
  const [savingProv, setSavingProv] = useState(false);
  const [mpTitle, setMpTitle] = useState('');
  const [mpHost, setMpHost] = useState('smtp.gmail.com');
  const [mpPort, setMpPort] = useState('465');
  const [mpEnc, setMpEnc] = useState('TLS / SSL / STARTTLS');
  const [mpSecure, setMpSecure] = useState(true);
  const [mpFrom, setMpFrom] = useState('');
  const [mpEmail, setMpEmail] = useState('');
  const [mpPass, setMpPass] = useState('');
  const [editProvId, setEditProvId] = useState<string | null>(null);
  const [testingProvId, setTestingProvId] = useState<string | null>(null);

  // Edit Requests
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [reqPanel, setReqPanel] = useState(false);
  const [resolvingReqId, setResolvingReqId] = useState<string | null>(null);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  const loadData = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      fetch('/api/admin/cycles').then(r => r.json()),
      fetch('/api/admin/employees').then(r => r.json()),
      fetch('/api/admin/mail-providers').then(r => r.json()),
      fetch('/api/admin/edit-requests').then(r => r.json()),
      fetch('/api/admin/departments').then(r => r.json())
    ]).then(([cyclesData, employeesData, providersData, editRequestsData, deptsData]) => {
      setCycles(cyclesData.cycles || []);
      setEmployees(employeesData.employees || []);
      setProviders(providersData.providers || []);
      setDepartments(deptsData.departments || []);
      
      const reqs = editRequestsData.requests || [];
      setEditRequests(reqs);
      if (reqs.length > 0) {
        setSelectedReq((prev: any) => {
          if (prev && reqs.some((r: any) => r.id === prev.id)) {
            return reqs.find((r: any) => r.id === prev.id);
          }
          return reqs[0];
        });
      } else {
        setSelectedReq(null);
      }
    }).catch(err => {
      console.error('Failed to load dashboard data:', err);
    }).finally(() => {
      setLoading(false);
    });
  };

  const handleResolveRequest = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setResolvingReqId(id);
    try {
      const res = await fetch(`/api/admin/edit-requests/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const d = await res.json();
      if (d.success) {
        alert(d.message);
        loadData();
      } else {
        alert(d.error || 'Failed to resolve request');
      }
    } catch {
      alert('Connection error');
    } finally {
      setResolvingReqId(null);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Cycles handlers
  const handleGenerateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-links', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, editDeadline, evalStart, evalEnd }),
      });
      const d = await res.json();
      alert(d.success ? d.message : d.error);
      if (d.success) loadData();
    } catch { alert('Failed'); }
    finally { setGenerating(false); }
  };

  const openEmailPanel = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    setEmailMode('all');
    
    // Find the cycle and pre-populate all pending employee IDs as checked
    const cycle = cycles.find(c => c.id === cycleId);
    if (cycle && cycle.submissions) {
      const pendingIds = cycle.submissions
        .filter((sub: any) => sub.status === 'PENDING_EMP')
        .map((sub: any) => sub.employee?.id)
        .filter(Boolean);
      setCheckedEmployees(pendingIds);
    } else {
      setCheckedEmployees([]);
    }
    
    setEmailPanel(true);
  };

  const openResultsPanel = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    setResultsPanel(true);
  };

  const toggleException = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}/exception`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isException: !currentStatus })
      });
      const d = await res.json();
      if (d.success) {
        setEmployees(employees.map(emp => emp.id === id ? { ...emp, isException: !currentStatus } : emp));
      } else {
        alert(d.error || 'Failed to update exception status');
      }
    } catch {
      alert('Connection error');
    }
  };

  const handleDeleteCycle = async (cycleId: string, label: string) => {
    if (!confirm(`Delete cycle "${label}"? This will permanently remove all submissions and scores. This cannot be undone.`)) return;
    
    // If it's a sample preview cycle, just remove it from local state immediately
    if (cycleId.startsWith('s')) {
      setCycles(prev => prev.filter(c => c.id !== cycleId));
      return;
    }

    setDeletingCycleId(cycleId);
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setCycles(prev => prev.filter(c => c.id !== cycleId));
      } else {
        alert(result.error || 'Failed to delete cycle.\nDetail: ' + (result.detail || ''));
      }
    } catch {
      alert('Connection error. Please try again.');
    } finally {
      setDeletingCycleId(null);
    }
  };

  const handleSendEmails = async () => {
    if (!selectedCycleId) return;
    const isSample = selectedCycleId.startsWith('s');
    if (isSample) {
      alert("This is a sample cycle. Please create a real cycle to send emails.");
      setEmailPanel(false);
      return;
    }

    setSendingCycleId(selectedCycleId);
    setEmailPanel(false);

    try {
      const payload: any = {};
      if (emailMode === 'select') {
        payload.selectedEmployeeIds = checkedEmployees;
      }
      
      const res = await fetch(`/api/admin/cycles/${selectedCycleId}/send-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) {
        alert(d.message);
        loadData();
      } else {
        alert(d.error || 'Failed to send emails');
      }
    } catch {
      alert('Connection error');
    } finally {
      setSendingCycleId(null);
    }
  };

  const handleSendHodEmails = async (cycleId: string) => {
    if (cycleId.startsWith('s')) {
      alert("This is a sample cycle. Please create a real cycle to send emails.");
      return;
    }
    const pendingHod = cycles.find(c => c.id === cycleId)?.submissions?.filter((s: any) => s.status === 'PENDING_HOD').length ?? 0;
    if (pendingHod === 0) {
      alert('No HOD reviews are pending for this cycle.');
      return;
    }
    setSendingHodCycleId(cycleId);
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}/send-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'HOD' }),
      });
      const d = await res.json();
      alert(d.success ? d.message : d.error || 'Failed to send HOD reminders');
      if (d.success) loadData();
    } catch {
      alert('Connection error');
    } finally {
      setSendingHodCycleId(null);
    }
  };

  const cycleStatus = (c: Cycle) => {
    const now = new Date();
    const start = new Date(c.empEvalStartDate);
    const end = new Date(c.empEvalEndDate);
    if (c.isActive && now >= start && now <= end) return { label: 'Active', cls: 'badge-green' };
    if (c.isActive && now < start) return { label: 'Draft', cls: 'badge-amber' };
    return { label: 'Closed', cls: 'badge-gray' };
  };

  // Department handlers
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      const url = editingDeptId ? `/api/admin/departments/${editingDeptId}` : '/api/admin/departments';
      const method = editingDeptId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName.trim() })
      });
      const d = await res.json();
      if (d.success) {
        setNewDeptName('');
        setEditingDeptId(null);
        loadData();
      } else alert(d.error);
    } catch { alert('Failed to save department'); }
  };

  const deleteDept = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`/api/admin/departments/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) loadData(); else alert(d.error);
    } catch { alert('Failed to delete department'); }
  };

  // Employee handlers
  const resetEmp = () => {
    setEmpName(''); setEmpEmail(''); setEmpDepartment(''); setHodName(''); setHodEmail('');
    setKras([{ kra: '', weightage: '', kpis: [{ text: '' }] }]);
    setEditEmpId(null);
    setEmpPanel(false);
  };

  const handleSaveEmp = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingEmp(true);
    try {
      const mappedKras = kras.map(k => ({ kra: k.kra, weightage: k.weightage, kpi: k.kpis.map(p => p.text).join('\n') }));
      const isSample = editEmpId?.startsWith('e');
      const url = (editEmpId && !isSample) ? `/api/admin/employees/${editEmpId}` : '/api/admin/employees/create';
      const method = (editEmpId && !isSample) ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: empName, email: empEmail, department: empDepartment, hodName, hodEmail, kras: mappedKras }),
      });
      const d = await res.json();
      if (d.success) { resetEmp(); loadData(); } else alert(d.error);
    } catch { alert('Failed to save'); }
    finally { setSavingEmp(false); }
  };

  const totalWeight = (kras || []).reduce((s, k) => s + (k ? (parseInt(k.weightage) || 0) : 0), 0);

  const addKra = () => setKras([...kras, { kra: '', weightage: '', kpis: [{ text: '' }] }]);
  const removeKra = (i: number) => setKras(kras.filter((_, idx) => idx !== i));
  const updateKra = (i: number, field: keyof KRA, val: string) => {
    const next = [...kras]; (next[i] as any)[field] = val; setKras(next);
  };
  const addKpi = (ki: number) => {
    const next = [...kras]; next[ki].kpis.push({ text: '' }); setKras(next);
  };
  const removeKpi = (ki: number, pi: number) => {
    const next = [...kras]; next[ki].kpis = next[ki].kpis.filter((_, i) => i !== pi); setKras(next);
  };
  const updateKpi = (ki: number, pi: number, val: string) => {
    const next = [...kras]; next[ki].kpis[pi].text = val; setKras(next);
  };

  const editEmployee = (emp: any) => {
    setEmpName(emp.name || '');
    setEmpEmail(emp.email || '');
    setEmpDepartment(emp.department || '');
    setHodName(emp.hodName || '');
    setHodEmail(emp.hodEmail || '');
    
    // Normalize and filter out any empty array slots or non-object values from sample data
    const rawKras = Array.isArray(emp.kras) ? emp.kras.filter(Boolean) : [];
    
    if (rawKras.length > 0) {
      setKras(rawKras.map((k: any) => {
        let parsedKpis = (k?.kpi || '').split('\n').map((t: string) => ({ text: t.trim() })).filter((kp: any) => kp.text !== '');
        if (parsedKpis.length === 0) parsedKpis = [{ text: '' }];
        return {
          kra: k?.kra || '',
          weightage: String(k?.weightage || ''),
          kpis: parsedKpis
        };
      }));
    } else {
      setKras([{ kra: '', weightage: '', kpis: [{ text: '' }] }]);
    }
    setEditEmpId(emp.id);
    setEmpPanel(true);
  };

  const delEmployee = async (id: string) => {
    if (id.startsWith('e')) {
      alert("This is a sample employee for demo purposes. Please add your own employees to test deletion.");
      return;
    }
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { loadData(); } else alert(d.error || 'Failed to delete');
    } catch { alert('Failed to delete'); }
  };

  // Provider handlers
  const resetProv = () => {
    setMpTitle(''); setMpHost('smtp.gmail.com'); setMpPort('465'); setMpEnc('TLS / SSL / STARTTLS');
    setMpSecure(true); setMpFrom(''); setMpEmail(''); setMpPass('');
    setEditProvId(null);
    setProvPanel(false);
  };

  const handleSaveProv = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProv(true);
    try {
      const isSample = editProvId?.startsWith('p');
      const url = (editProvId && !isSample) ? `/api/admin/mail-providers/${editProvId}` : '/api/admin/mail-providers';
      const method = (editProvId && !isSample) ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: mpTitle, host: mpHost, port: mpPort, encryption: mpEnc, secure: mpSecure, fromName: mpFrom, email: mpEmail, password: mpPass }),
      });
      const d = await res.json();
      if (d.success) { resetProv(); loadData(); } else alert(d.error);
    } catch { alert('Failed'); }
    finally { setSavingProv(false); }
  };

  const editProvider = (prov: Provider) => {
    setMpTitle(prov.title || '');
    setMpHost(prov.host || '');
    setMpPort(prov.port || '');
    setMpEnc(prov.encryption || 'TLS / SSL / STARTTLS');
    setMpSecure(!!prov.secure);
    setMpFrom(prov.fromName || '');
    setMpEmail(prov.email || '');
    setMpPass('');
    setEditProvId(prov.id);
    setProvPanel(true);
  };

  const setActive = async (id: string) => {
    await fetch(`/api/admin/mail-providers/${id}`, { method: 'PATCH' }); loadData();
  };
  const delProvider = async (id: string) => {
    if (id.startsWith('p')) {
      alert("This is a sample mail provider for demo purposes. Please add your own mail providers to test deletion.");
      return;
    }
    if (!confirm('Delete this provider?')) return;
    await fetch(`/api/admin/mail-providers/${id}`, { method: 'DELETE' }); loadData();
  };

  const sendTestEmail = async (id: string) => {
    if (id.startsWith('p')) {
      alert("This is a sample mail provider for demo purposes. Please click '+ Add Provider' to configure your own SMTP account and test it.");
      return;
    }
    setTestingProvId(id);
    try {
      const res = await fetch(`/api/admin/mail-providers/${id}`, { method: 'POST' });
      const d = await res.json();
      alert(d.success ? d.message : d.error || 'Failed to send test email');
    } catch {
      alert('Failed to send test email');
    } finally {
      setTestingProvId(null);
    }
  };

  return (
    <div className="app-shell">
      {/* ── TOP BAR ── */}
      <header className="topbar" style={{ justifyContent: 'center', padding: '0 32px' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '1280px', alignItems: 'center' }}>
          <span className="topbar-logo">Balar Builders · Performance</span>
          <nav className="nav-tabs" style={{ marginLeft: 'auto' }}>
            <button className={`nav-tab ${tab === 'cycles' ? 'active' : ''}`} onClick={() => setTab('cycles')}>Evaluation Cycles</button>
            <button className={`nav-tab ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}>Employee Base</button>
            <button className={`nav-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>System Settings</button>
          </nav>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              marginLeft: '16px'
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="page-content">

        {editRequests.length > 0 && (
          <div className="banner banner-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px 20px', borderRadius: '8px', border: '1px solid #fcd34d', background: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiSend size={20} style={{ color: '#d97706' }} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 600, color: '#92400e', fontSize: '14px' }}>Pending KRA Edit Requests</h4>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#b45309' }}>
                  {editRequests.length} employee{editRequests.length > 1 ? 's' : ''} requested KRA updates that require your review.
                </p>
              </div>
            </div>
            <button className="btn btn-black btn-sm" onClick={() => { if (editRequests.length > 0) { setSelectedReq(editRequests[0]); setReqPanel(true); } }}>
              Review Requests
            </button>
          </div>
        )}

        {/* ════ CYCLES ════ */}
        {tab === 'cycles' && (
          loading ? (
            <div className="two-col">
              {/* Left — Form Skeleton */}
              <div>
                <div className="section-head">
                  <div>
                    <div className="skeleton skeleton-title" style={{ width: '150px', height: '24px', marginBottom: '8px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '220px', height: '14px' }}></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-head">
                    <div className="skeleton skeleton-text" style={{ width: '120px', height: '16px', margin: 0 }}></div>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-row">
                      <div>
                        <div className="skeleton skeleton-text" style={{ width: '50px', height: '12px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '4px' }}></div>
                      </div>
                      <div>
                        <div className="skeleton skeleton-text" style={{ width: '50px', height: '12px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="skeleton skeleton-text" style={{ width: '90px', height: '12px', marginBottom: '8px' }}></div>
                      <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '4px' }}></div>
                    </div>
                    <div className="form-row">
                      <div>
                        <div className="skeleton skeleton-text" style={{ width: '70px', height: '12px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '4px' }}></div>
                      </div>
                      <div>
                        <div className="skeleton skeleton-text" style={{ width: '70px', height: '12px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div className="skeleton" style={{ height: '38px', width: '100%', borderRadius: '4px', marginTop: '8px' }}></div>
                  </div>
                </div>
              </div>

              {/* Right — Table Skeleton */}
              <div>
                <div className="section-head">
                  <div>
                    <div className="skeleton skeleton-title" style={{ width: '130px', height: '24px', marginBottom: '8px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '14px' }}></div>
                  </div>
                </div>
                <div className="card">
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}><div className="skeleton skeleton-text" style={{ width: '20px', height: '12px', margin: 0 }}></div></th>
                          <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '12px', margin: 0 }}></div></th>
                          <th><div className="skeleton skeleton-text" style={{ width: '100px', height: '12px', margin: 0 }}></div></th>
                          <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '12px', margin: 0 }}></div></th>
                          <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '12px', margin: 0 }}></div></th>
                          <th><div className="skeleton skeleton-text" style={{ width: '60px', height: '12px', margin: 0 }}></div></th>
                          <th style={{ width: 180 }}><div className="skeleton skeleton-text" style={{ width: '120px', height: '12px', margin: 0 }}></div></th>
                          <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '12px', margin: 0 }}></div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map(i => (
                          <tr key={i}>
                            <td><div className="skeleton skeleton-text" style={{ width: '15px', height: '12px', margin: 0 }}></div></td>
                            <td><div className="skeleton skeleton-text" style={{ width: '90px', height: '14px', margin: 0 }}></div></td>
                            <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '12px', margin: 0 }}></div></td>
                            <td><div className="skeleton skeleton-text" style={{ width: '70px', height: '12px', margin: 0 }}></div></td>
                            <td><div className="skeleton skeleton-text" style={{ width: '70px', height: '12px', margin: 0 }}></div></td>
                            <td><div className="skeleton" style={{ width: '50px', height: '18px', borderRadius: '12px' }}></div></td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div className="skeleton skeleton-text" style={{ width: '100%', height: '10px', margin: 0 }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '80%', height: '10px', margin: 0 }}></div>
                              </div>
                            </td>
                            <td><div className="skeleton skeleton-button" style={{ width: '90px', height: '28px', borderRadius: '4px' }}></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="two-col">
              {/* Left — Form */}
              <div>
                <div className="section-head">
                  <div><h2>Launch New Cycle</h2><p>Create evaluation links for all employees</p></div>
                </div>
                <div className="card">
                  <div className="card-head"><span className="card-head-title">Cycle Configuration</span></div>
                  <div className="card-body">
                    <form onSubmit={handleGenerateCycle}>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Month <span className="req">*</span></label>
                          <select className="form-control" value={month} onChange={e => setMonth(e.target.value)}>
                            {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Year <span className="req">*</span></label>
                          <input type="number" className="form-control" value={year} onChange={e => setYear(e.target.value)} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Setup Deadline <span className="req">*</span></label>
                        <input type="date" className="form-control" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} required />
                        <div className="form-hint">KRA text editing locks after this date</div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Eval Opens <span className="req">*</span></label>
                          <input type="date" className="form-control" value={evalStart} onChange={e => setEvalStart(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Eval Closes <span className="req">*</span></label>
                          <input type="date" className="form-control" value={evalEnd} onChange={e => setEvalEnd(e.target.value)} required />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-black btn-full" disabled={generating}>
                        {generating ? 'Creating...' : 'Create Cycle'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right — Table */}
              <div>
                <div className="section-head">
                  <div><h2>Recent Cycles</h2><p>{cycles.length} cycle{cycles.length !== 1 ? 's' : ''} total</p></div>
                </div>
                <div className="card">
                  {cycles.length === 0 ? (
                    <div className="empty-state">
                      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <h3>No cycles yet</h3><p>Launch your first evaluation cycle using the form.</p>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead><tr>
                          <th style={{ width: 50 }}>#</th>
                          <th>Cycle</th>
                          <th>Setup Deadline</th>
                          <th>Eval Opens</th>
                          <th>Eval Closes</th>
                          <th>Status</th>
                          <th style={{ width: '180px' }}>Evaluation Progress</th>
                          <th>Actions</th>
                        </tr></thead>
                        <tbody>
                          {cycles.map((c, index) => {
                            const st = cycleStatus(c);
                            return (
                              <tr key={c.id}>
                                <td style={{ color: '#6b7280', fontWeight: 500 }}>{index + 1}</td>
                                <td className="td-primary">{c.month} {c.year}</td>
                                <td>{new Date(c.kraEditDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td>{new Date(c.empEvalStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                <td>{new Date(c.empEvalEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                <td><span className={`badge badge-dot ${st.cls}`}>{st.label}</span></td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                                      <span>Employee:</span>
                                      <span style={{ fontWeight: 600, color: '#111827', marginLeft: '6px' }}>
                                        {c.submissions?.filter((s: any) => s.status === 'PENDING_HOD' || s.status === 'COMPLETED').length ?? 0}
                                        <span style={{ color: '#9ca3af', fontWeight: 400 }}>/{c.submissions?.length ?? 0}</span>
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                                      <span>HOD:</span>
                                      <span style={{ fontWeight: 600, color: '#111827', marginLeft: '6px' }}>
                                        {c.submissions?.filter((s: any) => s.status === 'COMPLETED').length ?? 0}
                                        <span style={{ color: '#9ca3af', fontWeight: 400 }}>/{c.submissions?.length ?? 0}</span>
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <a
                                      href={`/admin/tracking/${c.id}`}
                                      className="btn btn-outline btn-sm"
                                      style={{ color: '#10b981', borderColor: '#a7f3d0' }}
                                      title="Open Tracking Dashboard"
                                    >
                                      📊 Tracking
                                    </a>
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleDeleteCycle(c.id, `${c.month} ${c.year}`)}
                                      disabled={deletingCycleId === c.id}
                                      style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                                      title="Delete this cycle permanently"
                                    >
                                      {deletingCycleId === c.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* ════ EMPLOYEES ════ */}
        {tab === 'employees' && (
          loading ? (
            <>
              <div className="section-head">
                <div>
                  <div className="skeleton skeleton-title" style={{ width: '150px', height: '24px', marginBottom: '8px' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }}></div>
                </div>
                <div className="skeleton skeleton-button" style={{ width: '120px', height: '36px', borderRadius: '4px' }}></div>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}><div className="skeleton skeleton-text" style={{ width: '20px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '120px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '120px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '60px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '12px', margin: 0 }}></div></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i}>
                          <td><div className="skeleton skeleton-text" style={{ width: '15px', height: '12px', margin: 0 }}></div></td>
                          <td>
                            <div className="skeleton skeleton-text" style={{ width: '130px', height: '14px', marginBottom: '4px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '180px', height: '11px', margin: 0 }}></div>
                          </td>
                          <td>
                            <div className="skeleton skeleton-text" style={{ width: '110px', height: '14px', marginBottom: '4px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '160px', height: '11px', margin: 0 }}></div>
                          </td>
                          <td><div className="skeleton" style={{ width: '60px', height: '18px', borderRadius: '12px' }}></div></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div className="skeleton skeleton-circle" style={{ width: '28px', height: '28px' }}></div>
                              <div className="skeleton skeleton-circle" style={{ width: '28px', height: '28px' }}></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="section-head">
                <div><h2>Employee Base</h2><p>{employees.length} employee{employees.length !== 1 ? 's' : ''} registered</p></div>
                <button className="btn btn-black btn-md" onClick={() => setEmpPanel(true)}><FiPlus size={14} /> Add Employee</button>
              </div>
              <div className="card">
                {employees.length === 0 ? (
                  <div className="empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <h3>No employees yet</h3><p>Add your first employee to get started.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr>
                        <th style={{ width: 50 }}>#</th>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>HOD</th>
                        <th>KRAs</th>
                        <th>Exception</th>
                        <th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {employees.map((emp, index) => (
                          <tr key={emp.id}>
                            <td style={{ color: '#6b7280', fontWeight: 500 }}>{index + 1}</td>
                            <td>
                              <div className="td-primary">{emp.name}</div>
                              <div className="td-sub">{emp.email}</div>
                            </td>
                            <td>
                              <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px' }}>
                                {emp.department || '—'}
                              </span>
                            </td>
                            <td>
                              <div className="td-primary">{emp.hodName || '—'}</div>
                              <div className="td-sub">{emp.hodEmail}</div>
                            </td>
                            <td><span className="badge badge-indigo">{emp.kras?.length || 0} KRAs</span></td>
                            <td>
                              <label className="toggle-sw">
                                <input 
                                  type="checkbox" 
                                  checked={!!emp.isException} 
                                  onChange={() => toggleException(emp.id, !!emp.isException)} 
                                />
                                <div className="toggle-track" />
                              </label>
                            </td>
                            <td>
                              <div className="table-actions">
                                <a 
                                  href={`/print/employee/${emp.id}/blank`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-outline btn-sm" 
                                  style={{ padding: '0 8px', height: '28px', color: '#4b5563', borderColor: '#d1d5db' }}
                                  title="Print Blank KRA Form"
                                >
                                  Print Form
                                </a>
                                <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => editEmployee(emp)}><FiEdit2 size={13} /></button>
                                <button className="btn btn-danger-ghost btn-sm btn-icon" title="Delete" onClick={() => delEmployee(emp.id)}><FiTrash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        )}

        {/* ════ SETTINGS ════ */}
        {tab === 'settings' && (
          loading ? (
            <>
              <div className="section-head">
                <div>
                  <div className="skeleton skeleton-title" style={{ width: '140px', height: '24px', marginBottom: '8px' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '250px', height: '14px' }}></div>
                </div>
                <div className="skeleton skeleton-button" style={{ width: '120px', height: '36px', borderRadius: '4px' }}></div>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}><div className="skeleton skeleton-text" style={{ width: '20px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '100px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '150px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '50px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '100px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '60px', height: '12px', margin: 0 }}></div></th>
                        <th><div className="skeleton skeleton-text" style={{ width: '120px', height: '12px', margin: 0 }}></div></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2].map(i => (
                        <tr key={i}>
                          <td><div className="skeleton skeleton-text" style={{ width: '15px', height: '12px', margin: 0 }}></div></td>
                          <td>
                            <div className="skeleton skeleton-text" style={{ width: '120px', height: '14px', marginBottom: '4px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '160px', height: '11px', margin: 0 }}></div>
                          </td>
                          <td><div className="skeleton skeleton-text" style={{ width: '110px', height: '13px', margin: 0, fontFamily: 'monospace' }}></div></td>
                          <td><div className="skeleton" style={{ width: '40px', height: '18px', borderRadius: '12px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '12px', margin: 0 }}></div></td>
                          <td><div className="skeleton" style={{ width: '50px', height: '18px', borderRadius: '12px' }}></div></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <div className="skeleton skeleton-button" style={{ width: '75px', height: '26px', borderRadius: '4px' }}></div>
                              <div className="skeleton skeleton-circle" style={{ width: '26px', height: '26px' }}></div>
                              <div className="skeleton skeleton-circle" style={{ width: '26px', height: '26px' }}></div>
                              <div className="skeleton skeleton-circle" style={{ width: '26px', height: '26px' }}></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="section-head">
                <div><h2>Mail Providers</h2><p>SMTP accounts used to dispatch evaluation emails</p></div>
                <button className="btn btn-black btn-md" onClick={() => setProvPanel(true)}><FiPlus size={14} /> Add Provider</button>
              </div>
              <div className="card">
                {providers.length === 0 ? (
                  <div className="empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <h3>No mail providers</h3><p>Add an SMTP account to enable email dispatch.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr>
                        <th style={{ width: 50 }}>#</th>
                        <th>Title</th>
                        <th>Host</th>
                        <th>Port</th>
                        <th>Encryption</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {providers.map((p, index) => (
                          <tr key={p.id}>
                            <td style={{ color: '#6b7280', fontWeight: 500 }}>{index + 1}</td>
                            <td>
                              <div className="td-primary">{p.title}</div>
                              <div className="td-sub">{p.email}</div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.host}</td>
                            <td><span className="badge badge-gray">{p.port}</span></td>
                            <td style={{ fontSize: 12.5, color: '#6b7280' }}>{p.encryption}</td>
                            <td>
                              {p.isActive
                                ? <span className="badge badge-green badge-dot">Active</span>
                                : <span className="badge badge-gray">Inactive</span>}
                            </td>
                            <td>
                              <div className="table-actions">
                                {!p.isActive && <button className="btn btn-outline btn-sm" onClick={() => setActive(p.id)}>Set Active</button>}
                                <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => editProvider(p)}><FiEdit2 size={13} /></button>
                                <button className="btn btn-ghost btn-sm btn-icon" title={testingProvId === p.id ? "Sending..." : "Send Test Email"} onClick={() => sendTestEmail(p.id)} disabled={testingProvId !== null}>
                                  <FiSend size={13} style={{ opacity: testingProvId === p.id ? 0.5 : 1 }} />
                                </button>
                                <button className="btn btn-danger-ghost btn-sm btn-icon" title="Delete" onClick={() => delProvider(p.id)}><FiTrash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </main>

      {/* ════ EMPLOYEE SLIDE PANEL ════ */}
      {empPanel && (
        <>
          <div className="panel-overlay" onClick={resetEmp} />
          <aside className="slide-panel">
            <div className="panel-head">
              <div>
                <h3>{editEmpId ? 'Edit Employee' : 'Add Employee'}</h3>
                <p>{editEmpId ? 'Update employee details and refine their KRA profile' : 'Fill in employee details and define their KRA profile'}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={resetEmp}><FiX size={18} /></button>
            </div>

            <form onSubmit={handleSaveEmp} style={{ display: 'contents' }}>
              <div className="panel-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="req">*</span></label>
                    <input className="form-control" type="text" value={empName} onChange={e => setEmpName(e.target.value)} placeholder="e.g. Ravi Shankar" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span className="req">*</span></label>
                    <input className="form-control" type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="ravi@company.com" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="form-control" value={empDepartment} onChange={e => setEmpDepartment(e.target.value)}>
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-outline btn-icon" style={{ padding: '0 12px' }} title="Manage Departments" onClick={() => setDeptPanel(true)}><FiEdit2 size={14} /></button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">HOD Name</label>
                    <input className="form-control" type="text" value={hodName} onChange={e => setHodName(e.target.value)} placeholder="Manager name" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">HOD Email</label>
                    <input className="form-control" type="email" value={hodEmail} onChange={e => setHodEmail(e.target.value)} placeholder="manager@company.com" />
                  </div>
                </div>

                <div className="divider" />
                <div className="section-label">KRA Builder</div>

                {kras && kras.filter(Boolean).map((kra, ki) => (
                  <div key={ki} className="kra-card">
                    <div className="kra-card-head">
                      <span className="kra-card-label">KRA {ki + 1}</span>
                      <div className="flex-center gap-8">
                        {kra.weightage && <span className="badge badge-indigo">{kra.weightage}%</span>}
                        <button type="button" className="btn btn-danger-ghost btn-icon" onClick={() => removeKra(ki)} disabled={kras.length === 1}><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="kra-card-body">
                      <div className="form-row" style={{ marginBottom: 10 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Key Result Area <span className="req">*</span></label>
                          <textarea className="form-control" style={{ height: 64, resize: 'vertical', paddingTop: 8 }} value={kra.kra} onChange={e => updateKra(ki, 'kra', e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Weightage % <span className="req">*</span></label>
                          <input className="form-control" type="number" min="1" max="100" value={kra.weightage} onChange={e => updateKra(ki, 'weightage', e.target.value)} required />
                        </div>
                      </div>
                      <label className="form-label">KPIs</label>
                      {kra.kpis.map((kpi, pi) => (
                        <div key={pi} className="kpi-item">
                          <span className="kpi-bullet" />
                          <input className="form-control" type="text" style={{ flex: 1 }} placeholder={`KPI ${pi + 1}`} value={kpi.text} onChange={e => updateKpi(ki, pi, e.target.value)} required />
                          <button type="button" className="btn btn-danger-ghost btn-icon" onClick={() => removeKpi(ki, pi)} disabled={kra.kpis.length === 1}><FiTrash2 size={12} /></button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-outline btn-sm mt-8" onClick={() => addKpi(ki)}>+ KPI</button>
                    </div>
                  </div>
                ))}

                <button type="button" className="btn btn-outline btn-full mt-8" onClick={addKra}><FiPlus size={13} /> Add KRA</button>
              </div>

              <div className="panel-foot">
                <div className="weight-bar">
                  <span>Total Weight</span>
                  <span className={`weight-num ${totalWeight > 100 ? 'over' : totalWeight === 100 ? 'perfect' : ''}`}>{totalWeight}%</span>
                  {totalWeight === 100 && <span className="badge badge-green">✓</span>}
                  {totalWeight > 100 && <span className="badge badge-red">Over by {totalWeight - 100}%</span>}
                </div>
                <div className="flex-center gap-8">
                  <button type="button" className="btn btn-outline btn-md" onClick={resetEmp}>Cancel</button>
                  <button type="submit" className="btn btn-black btn-md" disabled={savingEmp}>{savingEmp ? 'Saving...' : editEmpId ? 'Save Changes' : 'Save Employee'}</button>
                </div>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* ════ MAIL PROVIDER SLIDE PANEL ════ */}
      {provPanel && (
        <>
          <div className="panel-overlay" onClick={resetProv} />
          <aside className="slide-panel">
            <div className="panel-head">
              <div>
                <h3>{editProvId ? 'Edit Mail Provider' : 'Add Mail Provider'}</h3>
                <p>{editProvId ? 'Update SMTP account configuration' : 'Configure an SMTP account for sending evaluation emails'}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={resetProv}><FiX size={18} /></button>
            </div>

            <form onSubmit={handleSaveProv} style={{ display: 'contents' }}>
              <div className="panel-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title <span className="req">*</span></label>
                    <input className="form-control" type="text" value={mpTitle} onChange={e => setMpTitle(e.target.value)} placeholder="e.g. Corporate Gmail" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mail From Name</label>
                    <input className="form-control" type="text" value={mpFrom} onChange={e => setMpFrom(e.target.value)} placeholder="e.g. HR Department" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mail Host <span className="req">*</span></label>
                    <input className="form-control" type="text" value={mpHost} onChange={e => setMpHost(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Port <span className="req">*</span></label>
                    <input className="form-control" type="number" value={mpPort} onChange={e => setMpPort(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Encryption</label>
                  <select className="form-control" value={mpEnc} onChange={e => setMpEnc(e.target.value)}>
                    <option>TLS / SSL / STARTTLS</option>
                    <option>None</option>
                  </select>
                </div>
                <div className="toggle-row">
                  <span className="toggle-label">Secure Connection (SSL/TLS)</span>
                  <label className="toggle-sw">
                    <input type="checkbox" checked={mpSecure} onChange={e => setMpSecure(e.target.checked)} />
                    <span className="toggle-track" />
                  </label>
                </div>

                <div className="divider" />
                <div className="section-label">Authentication</div>

                <div className="form-group">
                  <label className="form-label">Username / Email <span className="req">*</span></label>
                  <input className="form-control" type="email" value={mpEmail} onChange={e => setMpEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password / App Password {!editProvId && <span className="req">*</span>}</label>
                  <input className="form-control" type="password" value={mpPass} onChange={e => setMpPass(e.target.value)} required={!editProvId} placeholder={editProvId ? "•••••••• (leave blank to keep current)" : ""} />
                  <div className="form-hint">For Gmail, use a 16-character App Password from Google Account → Security → 2FA.</div>
                </div>
              </div>

              <div className="panel-foot">
                <span />
                <div className="flex-center gap-8">
                  <button type="button" className="btn btn-outline btn-md" onClick={resetProv}>Cancel</button>
                  <button type="submit" className="btn btn-black btn-md" disabled={savingProv}>{savingProv ? 'Saving...' : editProvId ? 'Save Changes' : 'Add Provider'}</button>
                </div>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* ════ EMAIL SELECTION PANEL ════ */}
      {emailPanel && (
        <>
          <div className="panel-overlay" onClick={() => setEmailPanel(false)} />
          <aside className="slide-panel" style={{ maxWidth: '540px' }}>
            <div className="panel-head">
              <div>
                <h3>Send Evaluation Emails</h3>
                <p>Select recipients for the evaluation cycle</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEmailPanel(false)}><FiX size={18} /></button>
            </div>

            <div className="panel-body" style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '10px' }}>Recipient Mode</label>
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1f2937' }}>
                    <input
                      type="radio"
                      name="emailMode"
                      value="all"
                      checked={emailMode === 'all'}
                      onChange={() => setEmailMode('all')}
                      style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                    />
                    <span>All Pending Employees</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1f2937' }}>
                    <input
                      type="radio"
                      name="emailMode"
                      value="select"
                      checked={emailMode === 'select'}
                      onChange={() => setEmailMode('select')}
                      style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                    />
                    <span>Select Specific Employees</span>
                  </label>
                </div>
              </div>

              {emailMode === 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Select Employees ({checkedEmployees.length} selected)</label>
                  
                  {/* Select All Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <input
                      type="checkbox"
                      id="select-all-emails"
                      checked={
                        (() => {
                          const cycle = cycles.find(c => c.id === selectedCycleId);
                          const pending = cycle?.submissions?.filter((s: any) => s.status === 'PENDING_EMP') || [];
                          return pending.length > 0 && pending.every((s: any) => checkedEmployees.includes(s.employee?.id));
                        })()
                      }
                      onChange={(e) => {
                        const cycle = cycles.find(c => c.id === selectedCycleId);
                        const pending = cycle?.submissions?.filter((s: any) => s.status === 'PENDING_EMP') || [];
                        if (e.target.checked) {
                          setCheckedEmployees(pending.map((s: any) => s.employee?.id).filter(Boolean));
                        } else {
                          setCheckedEmployees([]);
                        }
                      }}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                    />
                    <label htmlFor="select-all-emails" style={{ fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#374151' }}>Select / Deselect All</label>
                  </div>

                  <div style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '8px'
                  }}>
                    {(() => {
                      const cycle = cycles.find(c => c.id === selectedCycleId);
                      const pending = cycle?.submissions?.filter((s: any) => s.status === 'PENDING_EMP') || [];
                      
                      if (pending.length === 0) {
                        return <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>No pending employee reviews for this cycle.</div>;
                      }

                      return pending.map((sub: any) => {
                        const emp = sub.employee;
                        if (!emp) return null;
                        const isChecked = checkedEmployees.includes(emp.id);
                        return (
                          <div key={emp.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            background: isChecked ? '#f0fdf4' : 'transparent',
                            transition: 'background 0.1s'
                          }}>
                            <input
                              type="checkbox"
                              id={`emp-email-${emp.id}`}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCheckedEmployees(prev => [...prev, emp.id]);
                                } else {
                                  setCheckedEmployees(prev => prev.filter(id => id !== emp.id));
                                }
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                            />
                            <label htmlFor={`emp-email-${emp.id}`} style={{ display: 'flex', flexDirection: 'column', flex: 1, cursor: 'pointer' }}>
                              <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>{emp.name}</span>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>{emp.email}</span>
                            </label>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="panel-foot">
              <span />
              <div className="flex-center gap-8">
                <button type="button" className="btn btn-outline btn-md" onClick={() => setEmailPanel(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-black btn-md"
                  onClick={handleSendEmails}
                  disabled={sendingCycleId === selectedCycleId || (emailMode === 'select' && checkedEmployees.length === 0)}
                >
                  {sendingCycleId === selectedCycleId ? 'Sending...' : 'Send Magic Links'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ════ KRA EDIT REQUESTS SLIDE PANEL ════ */}
      {reqPanel && selectedReq && (
        <>
          <div className="panel-overlay" onClick={() => setReqPanel(false)} />
          <aside className="slide-panel" style={{ maxWidth: '840px' }}>
            <div className="panel-head">
              <div>
                <h3>Review KRA Edit Requests</h3>
                <p>Employee proposed changes to their KRA / KPI profiles</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setReqPanel(false)}><FiX size={18} /></button>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'row', height: '500px', padding: 0 }}>
              {/* Left sidebar: list of employees who requested edits */}
              <div style={{ width: '250px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#f8fafc' }}>
                {editRequests.map(req => {
                  const emp = req.submission.employee;
                  const cycle = req.submission.evaluationCycle;
                  const isSelected = selectedReq.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e5e7eb',
                        background: isSelected ? '#ffffff' : 'transparent',
                        fontWeight: isSelected ? '600' : 'normal',
                        borderLeft: isSelected ? '4px solid #10b981' : '4px solid transparent',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#1f2937' }}>{emp.name}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{cycle.month} {cycle.year}</div>
                    </div>
                  );
                })}
              </div>

              {/* Right panel: comparison view for selected request */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {selectedReq.submission.employee.name}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Department: {selectedReq.submission.employee.department || '—'} &nbsp;·&nbsp; Cycle: {selectedReq.submission.evaluationCycle.month} {selectedReq.submission.evaluationCycle.year}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    const originalKras = selectedReq.submission.employee.kras || [];
                    const proposed = selectedReq.proposedKras as any[];

                    return originalKras.map((orig: any, index: number) => {
                      const prop = proposed.find((p: any) => p.kraTemplateId === orig.id) || { kra: orig.kra, kpi: orig.kpi };
                      const kraChanged = orig.kra !== prop.kra;
                      const kpiChanged = orig.kpi !== prop.kpi;

                      return (
                        <div key={orig.id} style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '16px',
                          background: '#ffffff'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>KRA {index + 1}</span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Weightage: {orig.weightage}%</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Key Result Area Comparison */}
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Key Result Area</label>
                              <div style={{ fontSize: '13px', color: '#4b5563', padding: '6px', border: '1px solid #f3f4f6', borderRadius: '4px', background: '#f9fafb', minHeight: '40px' }}>
                                {orig.kra}
                              </div>
                              {kraChanged && (
                                <div style={{ fontSize: '13px', color: '#065f46', padding: '6px', border: '1px solid #a7f3d0', borderRadius: '4px', background: '#ecfdf5', marginTop: '6px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '11px', color: '#047857' }}>PROPOSED:</span><br/>
                                  {prop.kra}
                                </div>
                              )}
                            </div>

                            {/* Key Performance Indicators Comparison */}
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Key Performance Indicators</label>
                              <div style={{ fontSize: '13px', color: '#4b5563', padding: '6px', border: '1px solid #f3f4f6', borderRadius: '4px', background: '#f9fafb', minHeight: '40px', whiteSpace: 'pre-line' }}>
                                {orig.kpi}
                              </div>
                              {kpiChanged && (
                                <div style={{ fontSize: '13px', color: '#065f46', padding: '6px', border: '1px solid #a7f3d0', borderRadius: '4px', background: '#ecfdf5', marginTop: '6px', whiteSpace: 'pre-line' }}>
                                  <span style={{ fontWeight: 600, fontSize: '11px', color: '#047857' }}>PROPOSED:</span><br/>
                                  {prop.kpi}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="panel-foot">
              <span />
              <div className="flex-center gap-8">
                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={() => handleResolveRequest(selectedReq.id, 'REJECT')}
                  disabled={resolvingReqId === selectedReq.id}
                >
                  Reject Proposed Edits
                </button>
                <button
                  type="button"
                  className="btn btn-black btn-md"
                  onClick={() => handleResolveRequest(selectedReq.id, 'APPROVE')}
                  disabled={resolvingReqId === selectedReq.id}
                >
                  {resolvingReqId === selectedReq.id ? 'Approving...' : 'Approve & Merge'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
      {/* ════ RESULTS PANEL MODAL ════ */}
      {resultsPanel && selectedCycleId && (
        <>
          <div className="panel-overlay" onClick={() => setResultsPanel(false)} />
          <aside className="slide-panel" style={{ maxWidth: '600px' }}>
            <div className="panel-head">
              <div>
                <h3>Cycle Evaluation Results</h3>
                <p>View and print individual employee reports.</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setResultsPanel(false)}><FiX size={18} /></button>
            </div>

            <div className="panel-body" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
              <table className="data-table" style={{ margin: 0, border: 'none' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Employee</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const cycle = cycles.find(c => c.id === selectedCycleId);
                    const submissions = cycle?.submissions || [];
                    if (submissions.length === 0) {
                      return <tr><td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>No submissions yet.</td></tr>;
                    }
                    return submissions.map((sub: any) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="td-primary">{sub.employee?.name}</div>
                          <div className="td-sub">{sub.employee?.department || 'Employee'}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge badge-dot ${sub.status === 'COMPLETED' ? 'badge-green' : sub.status === 'PENDING_HOD' ? 'badge-amber' : 'badge-gray'}`}>
                            {sub.status === 'COMPLETED' ? 'Completed' : sub.status === 'PENDING_HOD' ? 'Pending HOD' : 'Pending Employee'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {sub.status === 'COMPLETED' ? (
                            <a
                              href={`/evaluate/${sub.empToken}?print=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ color: '#0ea5e9', borderColor: '#bae6fd' }}
                            >
                              Print
                            </a>
                          ) : (
                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            
            <div className="panel-foot">
              <span />
              <button type="button" className="btn btn-outline btn-md" onClick={() => setResultsPanel(false)}>Close</button>
            </div>
          </aside>
        </>
      )}

      {/* ════ DEPARTMENT PANEL MODAL ════ */}
      {deptPanel && (
        <>
          <div className="panel-overlay" onClick={() => setDeptPanel(false)} />
          <aside className="slide-panel" style={{ maxWidth: '500px' }}>
            <div className="panel-head">
              <div>
                <h3>Manage Departments</h3>
                <p>Add, edit, or remove departments</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeptPanel(false)}><FiX size={18} /></button>
            </div>
            <div className="panel-body">
              <form onSubmit={handleSaveDept} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <input className="form-control" type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Department Name" required />
                <button type="submit" className="btn btn-black">{editingDeptId ? 'Update' : 'Add'}</button>
                {editingDeptId && <button type="button" className="btn btn-outline" onClick={() => { setEditingDeptId(null); setNewDeptName(''); }}>Cancel</button>}
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {departments.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{d.name}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => { setEditingDeptId(d.id); setNewDeptName(d.name); }}><FiEdit2 size={14} color="#64748b" /></button>
                      <button type="button" className="btn btn-danger-ghost btn-icon" onClick={() => deleteDept(d.id)}><FiTrash2 size={14} color="#ef4444" /></button>
                    </div>
                  </div>
                ))}
                {departments.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No departments found.</div>}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
