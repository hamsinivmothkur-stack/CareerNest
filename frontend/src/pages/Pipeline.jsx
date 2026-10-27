import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Briefcase,
  MapPin,
  Calendar,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import DeadlineBadge from '../components/DeadlineBadge';
import ApplicationModal from '../components/ApplicationModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const STAGES = [
  { id: 'Applied', title: 'Applied', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { id: 'Assessment', title: 'Assessment', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'Interview', title: 'Interview', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'Offer', title: 'Offer Received', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'Rejected', title: 'Rejected', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
];

const Pipeline = () => {
  const { addToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [defaultStage, setDefaultStage] = useState('Applied');
  const [deleteApp, setDeleteApp] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.applications.getAll();
      if (res.success) {
        setApplications(res.applications);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch pipeline applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleMoveStage = async (app, direction) => {
    const currentIndex = STAGES.findIndex((s) => s.id === app.status);
    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    const targetStage = STAGES[targetIndex].id;

    // Optimistic UI update
    setApplications((prev) =>
      prev.map((item) => (item._id === app._id ? { ...item, status: targetStage } : item))
    );

    try {
      await api.applications.updateStatus(app._id, targetStage);
      addToast(`Moved ${app.company} to ${targetStage}`, 'success');
    } catch (err) {
      // Revert if error
      addToast(err.message || 'Failed to update pipeline stage', 'error');
      fetchApplications();
    }
  };

  const handleOpenAddForStage = (stageId) => {
    setDefaultStage(stageId);
    setEditApp({ status: stageId });
    setIsModalOpen(true);
  };

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

  return (
    <div className="page-body">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Application Pipeline
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Visual recruitment pipeline across all interview and decision phases
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          Loading pipeline board...
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="pipeline-board">
          {STAGES.map((stage, stageIndex) => {
            const stageApps = applications.filter((app) => app.status === stage.id);

            return (
              <div key={stage.id} className="pipeline-col">
                {/* Column Header */}
                <div className="pipeline-col-header">
                  <div className="col-title-group">
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: stage.color,
                      }}
                    />
                    <span>{stage.title}</span>
                    <span className="col-count">{stageApps.length}</span>
                  </div>

                  <button
                    onClick={() => handleOpenAddForStage(stage.id)}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                    title={`Add new application to ${stage.title}`}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Column Cards */}
                <div className="pipeline-cards">
                  {stageApps.length === 0 ? (
                    <div
                      style={{
                        padding: '2.5rem 1rem',
                        textAlign: 'center',
                        color: 'var(--text-dim)',
                        fontSize: '0.8rem',
                        border: '1px dashed rgba(255, 255, 255, 0.05)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      No applications in {stage.title}
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <div
                        key={app._id}
                        className="pipeline-card"
                        onClick={() => handleOpenDetail(app)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {app.company}
                          </div>
                          {app.salary && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>
                              {app.salary}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: '0.825rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.75rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {app.role}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <span>{app.location || 'Remote'}</span>
                          <DeadlineBadge deadline={app.deadline} status={app.status} />
                        </div>

                        {app.interviewDate && stage.id === 'Interview' && (
                          <div
                            style={{
                              backgroundColor: 'rgba(139, 92, 246, 0.15)',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              fontSize: '0.75rem',
                              color: '#c084fc',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <Clock size={12} />
                            <span>
                              {new Date(app.interviewDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Quick Move Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            paddingTop: '0.5rem',
                            marginTop: '0.5rem',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            disabled={stageIndex === 0}
                            onClick={() => handleMoveStage(app, -1)}
                            className="btn-icon"
                            style={{
                              width: '26px',
                              height: '26px',
                              opacity: stageIndex === 0 ? 0.3 : 1,
                              cursor: stageIndex === 0 ? 'not-allowed' : 'pointer',
                            }}
                            title="Move to previous stage"
                          >
                            <ChevronLeft size={14} />
                          </button>

                          <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                            Move stage
                          </span>

                          <button
                            disabled={stageIndex === STAGES.length - 1}
                            onClick={() => handleMoveStage(app, 1)}
                            className="btn-icon"
                            style={{
                              width: '26px',
                              height: '26px',
                              opacity: stageIndex === STAGES.length - 1 ? 0.3 : 1,
                              cursor: stageIndex === STAGES.length - 1 ? 'not-allowed' : 'pointer',
                            }}
                            title="Move to next stage"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
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

export default Pipeline;
