import React, { useEffect, useState } from 'react';
import {
  X,
  Activity,
  Code2,
  Clock,
  FileText,
  BarChart2,
  RefreshCw,
  ExternalLink,
  Target,
  Award,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { ProfileDashboardResponse, PortalSectionId } from '../../types';

interface UserProfileDashboardProps {
  onNavigateSection?: (sectionId: PortalSectionId) => void;
}

export const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({ onNavigateSection }) => {
  const { user, isDetailsModalOpen, closeDetailsModal } = useAuth();
  const [data, setData] = useState<ProfileDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getProfileActivity();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load user activity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDetailsModalOpen) {
      fetchDashboardData();
    }
  }, [isDetailsModalOpen]);

  if (!isDetailsModalOpen || !user) return null;

  const stats = data?.stats;
  const avatarSrc = apiClient.getAvatarUrl(user.avatar_url);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'U';
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'accepted' || s === 'passed' || s === 'completed') {
      return (
        <span
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {status}
        </span>
      );
    }
    return (
      <span
        style={{
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '0.2rem 0.55rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'capitalize',
        }}
      >
        {status}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty?: string) => {
    const d = (difficulty || 'Medium').toLowerCase();
    let bg = 'rgba(234, 179, 8, 0.15)';
    let color = '#facc15';
    let border = 'rgba(234, 179, 8, 0.3)';

    if (d === 'easy') {
      bg = 'rgba(34, 197, 94, 0.15)';
      color = '#4ade80';
      border = 'rgba(34, 197, 94, 0.3)';
    } else if (d === 'hard') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#f87171';
      border = 'rgba(239, 68, 68, 0.3)';
    }

    return (
      <span
        style={{
          background: bg,
          color: color,
          border: `1px solid ${border}`,
          padding: '0.15rem 0.5rem',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: 600,
        }}
      >
        {difficulty || 'Medium'}
      </span>
    );
  };

  return (
    <div
      className="dashboard-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 15, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1.25rem',
      }}
    >
      <div
        className="dashboard-modal-card card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          background: 'var(--color-bg-card, #131a2a)',
          border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
          borderRadius: '16px',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
            background: 'rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <BarChart2 size={20} />
            </div>
            <div>
              <h2
                id="dashboard-modal-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #f8fafc)',
                  margin: 0,
                }}
              >
                Candidate Activity & Practice Insights
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Real-time tracking across all CareerNova AI interview, coding, and resume modules
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              title="Refresh Analytics"
              style={{ padding: '0.45rem', borderRadius: '8px' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={closeDetailsModal}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.45rem', borderRadius: '8px' }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#fca5a5',
                fontSize: '0.88rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Identity card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--color-primary, #38bdf8)',
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.4rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  flexShrink: 0,
                }}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(user.full_name)
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                    {user.full_name}
                  </h3>
                  <span
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    Active Account
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  {user.email}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', display: 'flex', gap: '1rem' }}>
                  <span>Member since: {new Date(user.created_at).toLocaleDateString()}</span>
                  {user.last_login_at && (
                    <span>Last active: {new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {user.github_url && (
                <a
                  href={user.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.35rem' }}
                >
                  <span>GitHub</span>
                  <ExternalLink size={12} />
                </a>
              )}
              {user.linkedin_url && (
                <a
                  href={user.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.35rem' }}
                >
                  <span>LinkedIn</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Metric cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Today's Coding Activity */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                <span>Today's Solved</span>
                <Code2 size={16} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>
                {stats?.coding_accepted_today ?? 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {stats?.coding_runs_today ?? 0} total attempts today
              </div>
            </div>

            {/* Total System Activities */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                <span>Total Activities</span>
                <Activity size={16} color="#818cf8" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8' }}>
                {stats?.total_activities ?? 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Logged across all portal drills
              </div>
            </div>

            {/* Interview Drills Completed */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                <span>Interview Drills</span>
                <Target size={16} color="#34d399" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
                {stats?.interview_drills_count ?? 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                STAR behavioral & system design
              </div>
            </div>

            {/* Resume Operations */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                <span>Resume Operations</span>
                <FileText size={16} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24' }}>
                {(stats?.resumes_parsed_count ?? 0) + (stats?.resumes_generated_count ?? 0)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {stats?.resumes_parsed_count ?? 0} parsed, {stats?.resumes_generated_count ?? 0} generated
              </div>
            </div>
          </div>

          {/* Difficulty breakdown & Topics explored */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Difficulty Breakdown */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} color="#38bdf8" />
                <span>Coding Difficulty Breakdown</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 600 }}>Easy Problems:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {stats?.difficulty_breakdown?.Easy ?? 0} solved
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#facc15', fontWeight: 600 }}>Medium Problems:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {stats?.difficulty_breakdown?.Medium ?? 0} solved
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600 }}>Hard Problems:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {stats?.difficulty_breakdown?.Hard ?? 0} solved
                  </span>
                </div>
              </div>
            </div>

            {/* Topics Explored */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} color="#818cf8" />
                <span>Topics Explored</span>
              </h4>
              {stats?.topics_explored && stats.topics_explored.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {stats.topics_explored.map((topic, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#bae6fd',
                        borderRadius: '6px',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  No coding topics completed yet. Explore topics in the Interview Preparation Coding Sandbox!
                </div>
              )}
            </div>
          </div>

          {/* Recent Submissions Table */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={16} color="#38bdf8" />
                <span>Recent Coding Submissions</span>
              </h4>
            </div>

            {data?.recent_submissions && data.recent_submissions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Problem</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Topic</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Difficulty</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_submissions.map((sub) => {
                      const meta = sub.metadata_json || {};
                      return (
                        <tr
                          key={sub.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                            {sub.title}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                            {meta.topic || 'General'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {getDifficultyBadge(meta.difficulty)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {getStatusBadge(sub.status)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div>No problem submissions recorded yet. Head over to <strong>Interview Preparation &gt; Coding Sandbox</strong> to practice coding problems!</div>
                {onNavigateSection && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      closeDetailsModal();
                      onNavigateSection('interview-prep');
                    }}
                    style={{ gap: '0.4rem' }}
                  >
                    <Code2 size={15} />
                    <span>Go to Coding Sandbox</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent General Activity Stream */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#a855f7" />
              <span>Full Activity History</span>
            </h4>

            {data?.recent_activities && data.recent_activities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {data.recent_activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--color-text-muted)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {act.activity_type}
                      </span>
                      <span style={{ fontWeight: 500, color: '#f8fafc' }}>{act.title}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {getStatusBadge(act.status)}
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                        {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1rem', fontSize: '0.88rem' }}>
                No activities logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
