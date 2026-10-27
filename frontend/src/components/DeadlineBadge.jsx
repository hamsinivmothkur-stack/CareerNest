import React from 'react';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';

const DeadlineBadge = ({ deadline, status }) => {
  if (!deadline) {
    return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No deadline</span>;
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isCompleted = status === 'Offer' || status === 'Rejected';

  const formattedDate = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (isCompleted) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.775rem',
          color: 'var(--text-dim)',
        }}
      >
        <Calendar size={13} />
        {formattedDate}
      </span>
    );
  }

  if (diffDays < 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#f87171',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '2px 8px',
          borderRadius: '9999px',
        }}
        title={`Deadline was on ${formattedDate}`}
      >
        <AlertTriangle size={12} />
        Overdue ({Math.abs(diffDays)}d ago)
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#fbbf24',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '2px 8px',
          borderRadius: '9999px',
        }}
      >
        <Clock size={12} />
        Due Today!
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#fbbf24',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '2px 8px',
          borderRadius: '9999px',
        }}
      >
        <Clock size={12} />
        {formattedDate} ({diffDays}d left)
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#93c5fd',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        padding: '2px 8px',
        borderRadius: '9999px',
      }}
    >
      <Calendar size={12} />
      {formattedDate} ({diffDays}d)
    </span>
  );
};

export default DeadlineBadge;
