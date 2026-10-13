import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  LogIn,
  ChevronDown,
  LogOut,
  BarChart2,
} from 'lucide-react';
import { BackendHealthResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

interface HeaderProps {
  health?: BackendHealthResponse | null;
  loadingHealth?: boolean;
  onRefreshHealth?: () => void;
  onToggleAssistant?: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
}) => {
  const {
    user,
    logout,
    openAuthModal,
    openDetailsModal,
  } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const avatarSrc = user ? apiClient.getAvatarUrl(user.avatar_url) : null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <header className="portal-header" id="portal-global-header" role="banner">
      <div className="header-inner">
        {/* Brand identity button */}
        <button
          type="button"
          className="brand-section"
          id="portal-brand-banner"
          onClick={onNavigateHome}
          title="Return to Home"
          aria-label="Return to Home"
        >
          <div className="brand-icon-wrapper" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className="brand-title">CareerNova AI</h1>
            </div>
          </div>
        </button>

        {/* Header actions: Auth / User Profile */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* User profile dropdown if authenticated, or login/signup triggers if unauthenticated */}
          {user ? (
            <div className="user-profile-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                id="user-profile-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn btn-secondary btn-sm"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.3rem 0.65rem 0.3rem 0.4rem',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
                }}
              >
                {/* Profile Avatar / Photo */}
                <div
                  style={{
                    position: 'relative',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}

                  {/* Online dot indicator */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      border: '1.5px solid #0f172a',
                    }}
                  />
                </div>

                <span
                  style={{
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  {user.full_name.split(' ')[0]}
                </span>

                <ChevronDown
                  size={14}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    color: 'var(--color-text-muted)',
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="user-profile-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    background: 'var(--color-bg-card, #131a2a)',
                    border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
                    borderRadius: '12px',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.1)',
                    padding: '0.5rem',
                    zIndex: 100,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  {/* User identity preview */}
                  <div
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                      {user.full_name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </div>
                  </div>

                  {/* View Details Section (Complete activity dashboard & live stats) */}
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      openDetailsModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-primary, #f8fafc)',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <BarChart2 size={16} color="#818cf8" />
                    <span>Activity</span>
                  </button>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.35rem 0' }} />

                  {/* 3. Log Out Option */}
                  <button
                    type="button"
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut size={16} color="#f87171" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                id="header-sign-in-btn"
                className="btn btn-secondary btn-sm"
                onClick={() => openAuthModal('login')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                id="header-sign-up-btn"
                className="btn btn-primary btn-sm"
                onClick={() => openAuthModal('signup')}
                style={{ fontWeight: 600 }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
