'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #0f172a;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .login-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.1) 0%, transparent 50%),
                      radial-gradient(ellipse at 60% 80%, rgba(245,158,11,0.08) 0%, transparent 50%);
          z-index: 0;
        }

        .login-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 0;
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 48px;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
          margin: 16px;
        }

        .login-logo {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 8px 20px rgba(99,102,241,0.4);
          font-size: 24px;
        }

        .login-title {
          font-size: 26px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .login-sub {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 36px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 8px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .input-wrap {
          position: relative;
        }

        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 15px;
          color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          outline: none;
        }

        .form-input::placeholder { color: #475569; }

        .form-input:focus {
          border-color: #6366f1;
          background: rgba(99,102,241,0.08);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        .toggle-pass {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #475569;
          font-size: 16px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .toggle-pass:hover { color: #94a3b8; }

        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(99,102,241,0.4);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.07);
          text-align: center;
          font-size: 12px;
          color: #334155;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-bg" />
      <div className="login-grid" />

      <div className="login-card">
        <div className="login-logo">🎯</div>
        <div className="login-title">Admin Portal</div>
        <div className="login-sub">Performance Evaluation System</div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-box">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <><div className="spinner" /> Signing in…</>
            ) : (
              '→  Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          🔒 Secure Admin Access · Balar Builders KRA System
        </div>
      </div>
    </>
  );
}
