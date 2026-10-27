import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Plus,
  Eye,
  MapPin,
} from 'lucide-react';
import { api } from '../api/client';
import DeadlineBadge from '../components/DeadlineBadge';
import ApplicationModal from '../components/ApplicationModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const Deadlines = () => {
  const { addToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [deleteApp, setDeleteApp] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.applications.getAll({ sort: 'deadline_asc' });
      if (res.success) {
        setApplications(res.applications);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch deadlines', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
      fetchApplications();
    } catch (err) {
      addToast(err.message || 'Failed to delete application', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Group applications into categories
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdueList = applications.filter((app) => {
    if (!app.deadline) return false;
    if (app.status === 'Offer' || app.status === 'Rejected') return false;
    const d = new Date(app.deadline);
    d.setHours(0, 0, 0, 0);
    return d < now;
  });

  const urgentList = applications.filter((app) => {
    if (!app.deadline) return false;
    if (app.status === 'Offer' || app.status === 'Rejected') return false;
    const d = new Date(app.deadline);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 3;
  });

  const upcomingList = applications.filter((app) => {
    if (!app.deadline) return false;
    if (app.status === 'Offer' || app.status === 'Rejected') return false;
    const d = new Date(app.deadline);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 3;
  });

  const interviewList = applications.filter((app) => {
    return app.interviewDate || app.status === 'Interview';
  });

  return (
    <div className="page-body">
      {/* Header */}
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
            Deadlines & Interviews
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Time-sensitive application cutoff dates, technical assessments, and interview schedules
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
          <span>New Application</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          Loading deadlines...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section: Scheduled Interviews */}
          {interviewList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Clock size={19} color="#c084fc" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Scheduled Interviews ({interviewList.length})
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                }}
              >
                {interviewList.map((app) => (
                  <div
                    key={app._id}
                    className="card"
                    style={{
                      borderLeft: '4px solid var(--accent-purple)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{app.company}</h3>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{app.role}</div>
                      </div>
                      <div className="status-badge interview">Interview</div>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#e9d5ff',
                      }}
                    >
                      <Clock size={15} color="#c084fc" />
                      <span>
                        {app.interviewDate
                          ? new Date(app.interviewDate).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Date TBD — check inbox'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Overdue Deadlines */}
          {overdueList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <AlertTriangle size={19} color="#ef4444" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171' }}>
                  Overdue Deadlines ({overdueList.length})
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                }}
              >
                {overdueList.map((app) => (
                  <div
                    key={app._id}
                    className="card"
                    style={{
                      borderLeft: '4px solid var(--accent-rose)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{app.company}</h3>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{app.role}</div>
                      </div>
                      <DeadlineBadge deadline={app.deadline} status={app.status} />
                    </div>

                    <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Stage: <strong style={{ color: 'var(--text-main)' }}>{app.status}</strong>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(app);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Update Stage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Urgent Impending Deadlines (<= 3 days) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Clock size={19} color="#fbbf24" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Impending Next 3 Days ({urgentList.length})
              </h2>
            </div>

            {urgentList.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <CheckCircle2 size={18} color="#10b981" />
                <span>No urgent deadlines in the next 72 hours. All clear!</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                }}
              >
                {urgentList.map((app) => (
                  <div
                    key={app._id}
                    className="card"
                    style={{
                      borderLeft: '4px solid var(--accent-amber)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{app.company}</h3>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{app.role}</div>
                      </div>
                      <DeadlineBadge deadline={app.deadline} status={app.status} />
                    </div>

                    <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Stage: <strong style={{ color: 'var(--text-main)' }}>{app.status}</strong>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(app);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Upcoming Deadlines (> 3 days) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Calendar size={19} color="#60a5fa" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Upcoming Future Deadlines ({upcomingList.length})
              </h2>
            </div>

            {upcomingList.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                No upcoming application deadlines recorded.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                }}
              >
                {upcomingList.map((app) => (
                  <div
                    key={app._id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{app.company}</h3>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{app.role}</div>
                      </div>
                      <DeadlineBadge deadline={app.deadline} status={app.status} />
                    </div>

                    <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Location: {app.location || 'Remote'}
                      </span>
                      <div className={`status-badge ${app.status.toLowerCase()}`}>
                        <span>{app.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <ApplicationDetailModal
        isOpen={isDetailOpen}
        application={selectedApp}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleOpenEdit}
        onDeleteRequest={handleDeleteRequest}
        onStatusChange={() => {
          fetchApplications();
          setIsDetailOpen(false);
        }}
      />

      {/* Add / Edit Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editApp}
        onSuccess={() => {
          fetchApplications();
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

export default Deadlines;
