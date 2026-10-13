import React from 'react';
import { Sparkles, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="portal-footer" id="portal-global-footer">
      <div className="footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Sparkles size={14} style={{ color: '#818cf8' }} aria-hidden="true" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>CareerNova AI</span>
          <span style={{ color: 'var(--text-dim)' }}>•</span>
          <span style={{ color: 'var(--text-dim)' }}>Intelligent Technical Career Preparation & Resume Platform</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
          <Shield size={13} style={{ color: '#34d399' }} aria-hidden="true" />
          <span>Privacy Guaranteed • In-Memory Document Processing</span>
        </div>
      </div>
    </footer>
  );
};
