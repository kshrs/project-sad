import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, CheckCircle, RefreshCw } from 'lucide-react';

export default function ProfileHover() {
  const { user, logout, loginAsDev } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderRadius: '24px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          cursor: 'pointer'
        }}
        aria-label="User Profile"
      >
        <img
          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=1e2842&color=fff`}
          alt={user.displayName}
          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e2842', paddingRight: '4px' }}>
          {user.displayName}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: isAdmin ? '#eff6ff' : '#f0fdf4',
            color: isAdmin ? '#1e40af' : '#166534',
            border: `1px solid ${isAdmin ? '#bfdbfe' : '#bbf7d0'}`
          }}
        >
          {user.role}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '46px',
            width: '280px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            padding: '16px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=1e2842&color=fff`}
              alt={user.displayName}
              style={{ width: '44px', height: '44px', borderRadius: '50%' }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.email}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {user.department}
              </div>
            </div>
          </div>

          {/* Quick Dev Switcher */}
          <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Switch Test Account (Dev)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                onClick={() => {
                  loginAsDev('kishorjsk2006@gmail.com');
                  setIsOpen(false);
                }}
                style={{
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: user.email === 'kishorjsk2006@gmail.com' ? '#1e2842' : '#ffffff',
                  color: user.email === 'kishorjsk2006@gmail.com' ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1'
                }}
              >
                Admin
              </button>
              <button
                onClick={() => {
                  loginAsDev('kishor14112006@gmail.com');
                  setIsOpen(false);
                }}
                style={{
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: user.email === 'kishor14112006@gmail.com' ? '#1e2842' : '#ffffff',
                  color: user.email === 'kishor14112006@gmail.com' ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1'
                }}
              >
                Staff 1
              </button>
              <button
                onClick={() => {
                  loginAsDev('staff2@kct.ac.in');
                  setIsOpen(false);
                }}
                style={{
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: user.email === 'staff2@kct.ac.in' ? '#1e2842' : '#ffffff',
                  color: user.email === 'staff2@kct.ac.in' ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1'
                }}
              >
                Staff 2
              </button>
              <button
                onClick={() => {
                  loginAsDev('staff3@kct.ac.in');
                  setIsOpen(false);
                }}
                style={{
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  backgroundColor: user.email === 'staff3@kct.ac.in' ? '#1e2842' : '#ffffff',
                  color: user.email === 'staff3@kct.ac.in' ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1'
                }}
              >
                Staff 3
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
