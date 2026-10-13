import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="empty-state-box" id="loading-spinner-container">
      <div className="spinner" style={{ width: '2rem', height: '2rem', marginBottom: '0.75rem' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
};
