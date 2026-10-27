import React, { useState, useEffect } from 'react';
import { Menu, Plus, Database, Sparkles } from 'lucide-react';
import { api } from '../api/client';

const Navbar = ({ onToggleSidebar, onOpenAddModal, title, subtitle }) => {
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    const checkDb = async () => {
      try {
        const res = await api.health.check();
        if (isMounted) {
          setDbStatus(res.database === 'connected' ? 'connected' : 'disconnected');
        }
      } catch {
        if (isMounted) setDbStatus('offline');
      }
    };

    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="page-title-box">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="topbar-right">
        {/* Database Health Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
          title={
            dbStatus === 'connected'
              ? 'MongoDB is running and successfully connected'
              : 'MongoDB is disconnected or offline'
          }
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: dbStatus === 'connected' ? '#10b981' : '#ef4444',
              boxShadow: dbStatus === 'connected' ? '0 0 8px #10b981' : 'none',
            }}
          />
          <Database size={13} />
          <span>{dbStatus === 'connected' ? 'MongoDB Active' : 'DB Offline'}</span>
        </div>

        {/* Global Add Application Button */}
        <button
          className="btn btn-primary"
          onClick={onOpenAddModal}
          style={{ padding: '0.55rem 1rem' }}
        >
          <Plus size={16} />
          <span>New Application</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
