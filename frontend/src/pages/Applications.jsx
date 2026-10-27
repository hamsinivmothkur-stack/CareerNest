import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  Briefcase,
  MapPin,
  Calendar,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { api } from '../api/client';
import DeadlineBadge from '../components/DeadlineBadge';
import ApplicationModal from '../components/ApplicationModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS = ['All', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];

const SORT_OPTIONS = [
  { label: 'Date Applied (Newest)', value: 'applied_desc' },
  { label: 'Date Applied (Oldest)', value: 'applied_asc' },
  { label: 'Deadline (Earliest First)', value: 'deadline_asc' },
  { label: 'Deadline (Latest First)', value: 'deadline_desc' },
  { label: 'Company Name (A-Z)', value: 'company_asc' },
];

const Applications = () => {
  const { addToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('applied_desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

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
      const res = await api.applications.getAll({
        search,
        status: statusFilter,
        sort: sortBy,
      });
      if (res.success) {
        setApplications(res.applications);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, addToast]);

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchApplications();
    }, 200);
    return () => clearTimeout(timer);
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

  const handleQuickStatusChange = async (appId, newStatus) => {
    try {
      await api.applications.updateStatus(appId, newStatus);
      addToast(`Status updated to ${newStatus}`, 'success');
      fetchApplications();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="page-body">
      {/* Page Header */}
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
            Internship Applications
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage, filter, search, and update all your recruitment records
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

      {/* Filter and Search Controls Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              placeholder="Search by company or role (e.g. Stripe, Frontend)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.5rem' : '1rem' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
            <ArrowUpDown size={16} color="var(--text-dim)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.85rem', padding: '0.65rem 0.85rem' }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              className="btn-icon"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: viewMode === 'table' ? '#1e293b' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-main)' : 'var(--text-dim)',
                border: 'none',
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="btn-icon"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: viewMode === 'grid' ? '#1e293b' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-main)' : 'var(--text-dim)',
                border: 'none',
              }}
              title="Grid Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '4px' }}>
            Stage:
          </span>
          {STATUS_OPTIONS.map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent-blue)' : 'var(--border-subtle)',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#60a5fa' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List / Table Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          Loading internship applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Briefcase size={28} />
          </div>
          <h2 className="empty-title">No applications found</h2>
          <p className="empty-desc">
            {search || statusFilter !== 'All'
              ? 'No applications match your active search and filter criteria.'
              : 'You have not added any applications yet.'}
          </p>
          {search || statusFilter !== 'All' ? (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
              }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditApp(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Track First Application</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company & Role</th>
                <th>Location</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Pay</th>
                <th>Date Applied</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {app.company.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenDetail(app)}
                        >
                          {app.company}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {app.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {app.location || 'Remote'}
                    </span>
                  </td>

                  <td>
                    <select
                      value={app.status}
                      onChange={(e) => handleQuickStatusChange(app._id, e.target.value)}
                      className="form-select"
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        width: 'auto',
                        backgroundColor:
                          app.status === 'Offer'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : app.status === 'Interview'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : app.status === 'Assessment'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : app.status === 'Rejected'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(59, 130, 246, 0.12)',
                        color:
                          app.status === 'Offer'
                            ? '#34d399'
                            : app.status === 'Interview'
                            ? '#c084fc'
                            : app.status === 'Assessment'
                            ? '#fbbf24'
                            : app.status === 'Rejected'
                            ? '#f87171'
                            : '#60a5fa',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Assessment">Assessment</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>

                  <td>
                    <DeadlineBadge deadline={app.deadline} status={app.status} />
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: app.salary ? '#34d399' : 'var(--text-dim)',
                        fontWeight: app.salary ? 600 : 400,
                      }}
                    >
                      {app.salary || '—'}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-dim)' }}>
                      {app.dateApplied
                        ? new Date(app.dateApplied).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleOpenDetail(app)}
                        className="btn-icon"
                        title="View Full Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(app)}
                        className="btn-icon"
                        title="Edit Application"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(app)}
                        className="btn-icon"
                        title="Delete Application"
                        style={{ color: '#f87171' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid Card View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {applications.map((app) => (
            <div
              key={app._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        fontWeight: 700,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {app.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3
                        style={{ fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => handleOpenDetail(app)}
                      >
                        {app.company}
                      </h3>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {app.role}
                      </div>
                    </div>
                  </div>

                  <div className={`status-badge ${app.status.toLowerCase()}`}>
                    <span className="status-dot" />
                    <span>{app.status}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    margin: '1rem 0',
                    fontSize: '0.825rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--text-dim)" />
                    <span>{app.location || 'Remote'}</span>
                    {app.salary && (
                      <span style={{ marginLeft: 'auto', color: '#34d399', fontWeight: 600 }}>
                        {app.salary}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Deadline:</span>
                    <DeadlineBadge deadline={app.deadline} status={app.status} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  onClick={() => handleOpenDetail(app)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  <Eye size={14} />
                  <span>Details</span>
                </button>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => handleOpenEdit(app)}
                    className="btn-icon"
                    title="Edit Application"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(app)}
                    className="btn-icon"
                    title="Delete Application"
                    style={{ color: '#f87171' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

export default Applications;
