'use client';

import { useEffect } from 'react';

export default function PrintTrigger() {
  useEffect(() => {
    // Wait a brief moment to ensure fonts/layout have painted, then open print dialog
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="no-print" style={{ marginBottom: '20px', textAlign: 'center' }}>
      <button 
        onClick={() => window.print()}
        style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Print this Document
      </button>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>The print dialog should open automatically. If it doesn't, click the button above.</p>
    </div>
  );
}
