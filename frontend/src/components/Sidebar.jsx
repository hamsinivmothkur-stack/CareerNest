import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  Layers,
  Kanban,
  CalendarClock,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 35,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside
        className="sidebar"
        style={{
          transform: isOpen || window.innerWidth > 1024 ? 'translateX(0)' : 'translateX(-100%)',
          position: window.innerWidth <= 1024 ? 'fixed' : 'sticky',
        }}
      >
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Briefcase size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-title">CareerNest</span>
            <span className="brand-tag">MERN</span>
          </div>

          {window.innerWidth <= 1024 && (
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Layers size={19} />
            <span>Applications</span>
          </NavLink>

          <NavLink
            to="/pipeline"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Kanban size={19} />
            <span>Pipeline Board</span>
          </NavLink>

          <NavLink
            to="/deadlines"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <CalendarClock size={19} />
            <span>Deadlines</span>
          </NavLink>
        </nav>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-details">
              <div className="user-name" title={user?.name}>
                {user?.name || 'Student User'}
              </div>
              <div className="user-role" title={user?.email}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-icon"
            title="Log Out"
            style={{ color: '#f87171' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
