import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Link2, MapPin, DollarSign, Building, Briefcase } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

const safeIsoDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const ApplicationModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
  const { addToast } = useToast();
  // An edit operation requires an existing application with an _id
  const isEdit = Boolean(initialData && initialData._id);

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    applicationUrl: '',
    location: 'Remote',
    salary: '',
    dateApplied: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'Applied',
    notes: '',
    interviewDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData && initialData._id) {
      // Editing existing record
      setFormData({
        company: initialData.company || '',
        role: initialData.role || '',
        applicationUrl: initialData.applicationUrl || '',
        location: initialData.location || 'Remote',
        salary: initialData.salary || '',
        dateApplied: initialData.dateApplied
          ? new Date(initialData.dateApplied).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().split('T')[0]
          : '',
        status: initialData.status || 'Applied',
        notes: initialData.notes || '',
        interviewDate: initialData.interviewDate
          ? new Date(initialData.interviewDate).toISOString().slice(0, 16)
          : '',
      });
    } else {
      // Creating new record (supports preset status like 'Interview' from pipeline)
      setFormData({
        company: '',
        role: '',
        applicationUrl: '',
        location: 'Remote',
        salary: '',
        dateApplied: new Date().toISOString().split('T')[0],
        deadline: '',
        status: initialData?.status || 'Applied',
        notes: '',
        interviewDate: '',
      });
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.company.trim()) {
      setErrorMessage('Company name is required');
      return;
    }
    if (!formData.role.trim()) {
      setErrorMessage('Role title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        company: formData.company.trim(),
        role: formData.role.trim(),
        applicationUrl: formData.applicationUrl.trim(),
        location: formData.location.trim() || 'Remote',
        salary: formData.salary.trim(),
        status: formData.status || 'Applied',
        notes: formData.notes.trim(),
        deadline: safeIsoDate(formData.deadline),
        interviewDate: safeIsoDate(formData.interviewDate),
        dateApplied: safeIsoDate(formData.dateApplied) || new Date().toISOString(),
      };

      if (isEdit) {
        await api.applications.update(initialData._id, payload);
        addToast(`Updated application for ${formData.company}`, 'success');
      } else {
        await api.applications.create(payload);
        addToast(`Application for ${formData.company} added!`, 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save application');
      addToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Briefcase size={17} />
            </div>
            <h2 className="modal-title">
              {isEdit ? 'Edit Internship Application' : 'Track New Internship'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '30px', height: '30px' }}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f87171',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                }}
              >
                {errorMessage}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span>Company Name *</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="company"
                    placeholder="e.g. Stripe, Google, Spotify"
                    value={formData.company}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Internship Role / Title *</span>
                </label>
                <input
                  type="text"
                  name="role"
                  placeholder="e.g. Software Engineering Intern"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span>Status Stage</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Applied">Applied</option>
                  <option value="Assessment">Assessment (OA)</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer Received 🎉</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Location</span>
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Remote, San Francisco, CA"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span>Application URL</span>
                </label>
                <input
                  type="url"
                  name="applicationUrl"
                  placeholder="https://company.com/job/123"
                  value={formData.applicationUrl}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Pay / Stipend</span>
                </label>
                <input
                  type="text"
                  name="salary"
                  placeholder="e.g. $52/hr or $7,500/mo"
                  value={formData.salary}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span>Date Applied</span>
                </label>
                <input
                  type="date"
                  name="dateApplied"
                  value={formData.dateApplied}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Application / Action Deadline</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {formData.status === 'Interview' && (
              <div className="form-group">
                <label className="form-label" style={{ color: '#c084fc' }}>
                  <span>Interview Date & Time (Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  name="interviewDate"
                  value={formData.interviewDate}
                  onChange={handleChange}
                  className="form-input"
                  style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Notes & Details</span>
              </label>
              <textarea
                name="notes"
                placeholder="Key requirements, recruiter contacts, technical topics to review, referral info..."
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '120px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-animate" />
                  <span>Saving...</span>
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Add Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;
