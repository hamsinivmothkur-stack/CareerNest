import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Briefcase,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import DeadlineBadge from './DeadlineBadge';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

const ApplicationDetailModal = ({
  isOpen,
  application,
  onClose,
  onEdit,
  onDeleteRequest,
  onStatusChange,
}) => {
  const { addToast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !application) return null;

  const handleStatusSelect = async (newStatus) => {
    if (newStatus === application.status) return;
    setIsUpdatingStatus(true);
    try {
      await api.applications.updateStatus(application._id, newStatus);
      addToast(`Status changed to ${newStatus}`, 'success');
      if (onStatusChange) onStatusChange();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formattedDateApplied = application.dateApplied
    ? new Date(application.dateApplied).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not specified';

  const formattedInterviewDate = application.interviewDate
    ? new Date(application.interviewDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              {application.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
                {application.company}
              </h2>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {application.role}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.15rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                CURRENT PIPELINE STAGE
              </span>
              <div className={`status-badge ${application.status.toLowerCase()}`}>
                <span className="status-dot" />
                <span>{application.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Move to:</span>
              <select
                value={application.status}
                onChange={(e) => handleStatusSelect(e.target.value)}
                disabled={isUpdatingStatus}
                className="form-select"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto' }}
              >
                <option value="Applied">Applied</option>
                <option value="Assessment">Assessment</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Key metadata grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>
                <MapPin size={13} />
                <span>LOCATION</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {application.location || 'Remote'}
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>
                <DollarSign size={13} />
                <span>PAY / STIPEND</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: application.salary ? '#34d399' : 'var(--text-muted)' }}>
                {application.salary || 'Not disclosed'}
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>
                <Calendar size={13} />
                <span>DATE APPLIED</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {formattedDateApplied}
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>
                <Clock size={13} />
                <span>DEADLINE</span>
              </div>
              <div>
                <DeadlineBadge deadline={application.deadline} status={application.status} />
              </div>
            </div>
          </div>

          {/* Interview Alert if present */}
          {formattedInterviewDate && (
            <div
              style={{
                padding: '0.9rem 1.15rem',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Clock size={20} color="#c084fc" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e9d5ff' }}>
                  Interview Scheduled
                </div>
                <div style={{ fontSize: '0.825rem', color: '#c084fc' }}>
                  {formattedInterviewDate}
                </div>
              </div>
            </div>
          )}

          {/* Job URL if present */}
          {application.applicationUrl && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                JOB POSTING LINK
              </span>
              <a
                href={application.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', color: '#60a5fa' }}
              >
                <ExternalLink size={15} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {application.applicationUrl}
                </span>
              </a>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <FileText size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Application Notes & Log
              </span>
            </div>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                color: application.notes ? 'var(--text-main)' : 'var(--text-dim)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                minHeight: '80px',
              }}
            >
              {application.notes || 'No notes added yet. Use the edit button to record preparation notes or recruiter emails.'}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            onClick={() => onDeleteRequest(application)}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button onClick={() => onEdit(application)} className="btn btn-primary">
              <Edit size={16} />
              <span>Edit Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
