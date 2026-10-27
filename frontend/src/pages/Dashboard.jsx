import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import DeadlineBadge from '../components/DeadlineBadge';
import ApplicationModal from '../components/ApplicationModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [deleteApp, setDeleteApp] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.applications.getStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleOpenDetail = (app) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (app) => {
    setIsDetailOpen(false);
    setEditApp(app);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (app) => {
    setDeleteApp(app);
  };

  const confirmDelete = async () => {
    if (!deleteApp) return;
    setIsDeleting(true);
    try {
      await api.applications.delete(deleteApp._id);
      addToast(`Deleted application for ${deleteApp.company}`, 'success');
      setDeleteApp(null);
      setIsDetailOpen(false);
      fetchStats();
    } catch (err) {
      addToast(err.message || 'Failed to delete application', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spin-animate" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <Briefcase size={32} color="#3b82f6" />
          </div>
          <div>Loading your application metrics...</div>
        </div>
      </div>
    );
  }

  const hasApplications = stats && stats.totalApplications > 0;

  return (
    <div className="page-body">
      {/* Top Welcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Here is your live internship recruitment overview and upcoming deadlines.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditApp(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Add Application</span>
        </button>
      </div>

      {/* Quick Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Applications</span>
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
            >
              <Briefcase size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.totalApplications || 0}</div>
          <div className="stat-meta">
            <span>Overall applications tracked</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">In Progress</span>
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.inProgress || 0}</div>
          <div className="stat-meta">
            <span>Applied, OA or in review</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Interviews Scheduled</span>
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}
            >
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.interviewsScheduled || 0}</div>
          <div className="stat-meta">
            <span>Active interview rounds</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Offers Received</span>
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
            >
              <Award size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: stats?.offersReceived > 0 ? '#34d399' : 'inherit' }}>
            {stats?.offersReceived || 0}
          </div>
          <div className="stat-meta">
            <span>Secured offers</span>
          </div>
        </div>
      </div>

      {!hasApplications ? (
        /* Empty State for brand new users */
        <div className="empty-state">
          <div className="empty-icon">
            <Briefcase size={28} />
          </div>
          <h2 className="empty-title">No applications tracked yet</h2>
          <p className="empty-desc">
            Get started by logging your first internship application. Track interview rounds,
            test deadlines, and offer letters all in one place.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditApp(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Track Your First Application</span>
          </button>
        </div>
      ) : (
        <>
          {/* Pipeline Visual Progress Distribution */}
          <div
            className="card"
            style={{
              marginBottom: '2rem',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Application Pipeline Distribution</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {stats?.totalApplications} total
              </span>
            </div>

            {/* Progress Segment Bar */}
            <div
              style={{
                height: '10px',
                borderRadius: '9999px',
                display: 'flex',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                marginBottom: '1rem',
              }}
            >
              {stats?.statusCounts &&
                Object.entries(stats.statusCounts).map(([status, count]) => {
                  if (count === 0) return null;
                  const pct = ((count / stats.totalApplications) * 100).toFixed(1);
                  let bg = '#3b82f6';
                  if (status === 'Assessment') bg = '#f59e0b';
                  if (status === 'Interview') bg = '#8b5cf6';
                  if (status === 'Offer') bg = '#10b981';
                  if (status === 'Rejected') bg = '#64748b';

                  return (
                    <div
                      key={status}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: bg,
                        transition: 'width 0.4s ease',
                      }}
                      title={`${status}: ${count} (${pct}%)`}
                    />
                  );
                })}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                fontSize: '0.825rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <span style={{ color: 'var(--text-muted)' }}>Applied:</span>
                <span style={{ fontWeight: 700 }}>{stats?.statusCounts?.Applied || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span style={{ color: 'var(--text-muted)' }}>Assessment:</span>
                <span style={{ fontWeight: 700 }}>{stats?.statusCounts?.Assessment || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                <span style={{ color: 'var(--text-muted)' }}>Interview:</span>
                <span style={{ fontWeight: 700 }}>{stats?.statusCounts?.Interview || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ color: 'var(--text-muted)' }}>Offer:</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>{stats?.statusCounts?.Offer || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }} />
                <span style={{ color: 'var(--text-muted)' }}>Rejected:</span>
                <span style={{ fontWeight: 700 }}>{stats?.statusCounts?.Rejected || 0}</span>
              </div>
            </div>
          </div>

          {/* Two Column Layout: Upcoming Deadlines + Recent Activity */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Upcoming Deadlines Widget */}
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#60a5fa" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Upcoming Deadlines</h2>
                </div>
                {stats?.overdueCount > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#f87171',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {stats.overdueCount} Overdue
                  </span>
                )}
              </div>

              {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.upcomingDeadlines.map((app) => (
                    <div
                      key={app._id}
                      onClick={() => handleOpenDetail(app)}
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{app.company}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.role}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <DeadlineBadge deadline={app.deadline} status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                  No impending application deadlines in the next 14 days!
                </div>
              )}
            </div>

            {/* Recent Activity Feed */}
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="#8b5cf6" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Activity</h2>
                </div>
              </div>

              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.recentActivity.map((app) => (
                    <div
                      key={app._id}
                      onClick={() => handleOpenDetail(app)}
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{app.company}</div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {app.role}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <div className={`status-badge ${app.status.toLowerCase()}`}>
                          <span className="status-dot" />
                          <span>{app.status}</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-dim)" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  No recent activity logged.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      <ApplicationDetailModal
        isOpen={isDetailOpen}
        application={selectedApp}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleOpenEdit}
        onDeleteRequest={handleDeleteRequest}
        onStatusChange={() => {
          fetchStats();
          setIsDetailOpen(false);
        }}
      />

      {/* Add / Edit Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editApp}
        onSuccess={() => {
          fetchStats();
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteApp}
        title="Delete Internship Application"
        message={`Are you sure you want to delete your application for ${deleteApp?.company}? All details and logs for this position will be permanently removed.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteApp(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Dashboard;
