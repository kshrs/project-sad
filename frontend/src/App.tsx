import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { ReportProvider } from './context/ReportContext';
import Dashboard from './components/Dashboard';
import KILogo from './assets/KILogo.jpeg';
import { Shield, User as UserIcon, ArrowRight } from 'lucide-react';

function LoginScreen() {
  const { loginAsDev, loading } = useAuth();
  const [customEmail, setCustomEmail] = useState('');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f8fafc',
        fontFamily: 'var(--font-family-sans)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}
      >
        <img src={KILogo} alt="Kumaraguru Institutions" style={{ height: '64px', margin: '0 auto 16px', borderRadius: '6px' }} />
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1e2842', marginBottom: '6px' }}>
          Staff & Student Achievement Portal
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>
          Kumaraguru College of Technology
        </p>

        {/* 1-Click Dev Fast Logins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => loginAsDev('kishorjsk2006@gmail.com')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#1e2842',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(30, 40, 66, 0.2)'
            }}
          >
            <Shield size={16} /> Sign in as Admin (kishorjsk2006@gmail.com)
          </button>

          <button
            onClick={() => loginAsDev('kishor14112006@gmail.com')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <UserIcon size={16} /> Sign in as Staff 1 (kishor14112006@gmail.com)
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => loginAsDev('staff2@kct.ac.in')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <UserIcon size={14} /> Staff 2 (staff2@kct.ac.in)
            </button>
            <button
              onClick={() => loginAsDev('staff3@kct.ac.in')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <UserIcon size={14} /> Staff 3 (staff3@kct.ac.in)
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', margin: '20px 0', borderTop: '1px solid #e2e8f0' }}>
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#ffffff', padding: '0 8px', fontSize: '11px', color: '#94a3b8' }}>
            or custom staff email
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customEmail) loginAsDev(customEmail);
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="email"
            placeholder="staff@kct.ac.in"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !customEmail}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#1e2842',
              color: '#ffffff',
              fontWeight: 700
            }}
          >
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b', fontSize: '13px' }}>
        Loading portal session...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <ReportProvider>
      <Dashboard />
    </ReportProvider>
  );
}
