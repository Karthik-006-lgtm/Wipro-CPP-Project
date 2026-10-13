import React from 'react';

interface StatusBadgeProps {
  status: 'connected' | 'unreachable' | 'unconfigured' | 'online' | 'offline' | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  let badgeClass = 'badge-neutral';
  let displayLabel = label || status;

  switch (status.toLowerCase()) {
    case 'connected':
    case 'online':
    case 'ok':
      badgeClass = 'badge-connected';
      break;
    case 'unreachable':
    case 'offline':
    case 'error':
      badgeClass = 'badge-danger';
      break;
    case 'unconfigured':
    case 'warning':
      badgeClass = 'badge-warning';
      break;
    default:
      badgeClass = 'badge-neutral';
  }

  return (
    <span className={`badge ${badgeClass}`} id={`status-badge-${status}`}>
      <span className="status-dot" />
      {displayLabel}
    </span>
  );
};
