'use client';

export default function PrintButton() {
  return (
    <div className="no-print" style={{ textAlign: 'center', marginTop: '40px' }}>
      <button 
        onClick={() => window.print()} 
        style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
      >
        Print Form
      </button>
    </div>
  );
}
