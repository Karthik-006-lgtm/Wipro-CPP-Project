import React, { useState, useEffect } from 'react';
import {
  History,
  Filter,
  Database,
  Calendar,
  RotateCcw,
  Trash2,
  ExternalLink,
  X,
  AlertTriangle,
  Code,
  Cpu,
  Building,
  MessageSquare,
  Video,
  Award,
} from 'lucide-react';
import { EmptyState } from '../components/shared/EmptyState';
import { apiClient, ApiClientError } from '../api/client';
import { PreparationRecord, PortalSectionId } from '../types';

interface PreparationRecordsProps {
  onNavigate?: (section: PortalSectionId) => void;
}

export const PreparationRecords: React.FC<PreparationRecordsProps> = ({ onNavigate }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [records, setRecords] = useState<PreparationRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [activeRecordModal, setActiveRecordModal] = useState<PreparationRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<PreparationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const filterOptions = [
    { label: 'All Activities', value: 'all' },
    { label: 'Coding Sandbox', value: 'coding' },
    { label: 'Video Interview Practice', value: 'video' },
    { label: 'Company-Specific Drills', value: 'company' },
    { label: 'System Architecture (Legacy)', value: 'architecture' },
    { label: 'Behavioral STAR (Legacy)', value: 'behavioral' },
  ];

  const fetchRecords = async (filterValue: string = selectedFilter) => {
    setIsLoading(true);
    setDbError(null);
    try {
      const response = await apiClient.getPreparationRecords(filterValue, 50, 0);
      setRecords(response.items);
      setTotalCount(response.total);
    } catch (err: any) {
      if (err instanceof ApiClientError && err.status === 503) {
        setDbError(
          'PostgreSQL database connection is unconfigured or unreachable. To enable permanent storage across restarts, configure DATABASE_URL in backend/.env.'
        );
      } else {
        setDbError(err?.message || 'Failed to load preparation records.');
      }
      setRecords([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedFilter);
  }, [selectedFilter]);

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.deletePreparationRecord(recordToDelete.id);
      setRecordToDelete(null);
      await fetchRecords(selectedFilter);
    } catch (err: any) {
      alert(`Failed to delete record: ${err?.message || 'Database error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDomainIcon = (type: string) => {
    switch (type) {
      case 'coding':
        return <Code size={16} style={{ color: '#818cf8' }} aria-hidden="true" />;
      case 'architecture':
        return <Cpu size={16} style={{ color: '#38bdf8' }} aria-hidden="true" />;
      case 'company':
        return <Building size={16} style={{ color: '#a78bfa' }} aria-hidden="true" />;
      case 'behavioral':
        return <MessageSquare size={16} style={{ color: '#34d399' }} aria-hidden="true" />;
      case 'video':
        return <Video size={16} style={{ color: '#ec4899' }} aria-hidden="true" />;
      default:
        return <Database size={16} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="section-preparation-records" role="tabpanel" aria-labelledby="nav-item-preparation-records">
      <div className="section-header">
        <div className="section-eyebrow">
          <History size={14} aria-hidden="true" />
          <span>Session History & Performance Tracking</span>
        </div>
        <h2 className="section-title">Preparation Records & Performance Analytics</h2>
        <p className="section-desc">
          Audited historical records of completed coding submissions, system design evaluations, behavioral STAR drills, and video practice sessions persisted in the PostgreSQL database.
        </p>
      </div>

      {/* Database Status Warning if Unconfigured / 503 */}
      {dbError && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fde68a', margin: '0 0 0.25rem 0' }}>
              Database Connectivity Status
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {dbError}
            </p>
          </div>
        </div>
      )}

      {/* 4-Card Analytics Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Total Saved Logs</span>
            <Database size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            PostgreSQL Permanent Records
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Coding Sandbox</span>
            <Code size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>
            {records.filter((r) => r.practice_type === 'coding').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Algorithmic Executions
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Video & Audio</span>
            <Video size={16} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ec4899' }}>
            {records.filter((r) => r.practice_type === 'video').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Webcam & Vocal Drills
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Company Target</span>
            <Building size={16} color="#a78bfa" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa' }}>
            {records.filter((r) => r.practice_type === 'company').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Employer-Specific Drills
          </div>
        </div>
      </div>

      {/* Filter and Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <Filter size={15} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Domain Filter:</span>
          <select
            id="records-category-filter"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.75rem',
              color: 'var(--text-main)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
            aria-label="Filter preparation records by domain"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: '#0f172a' }}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchRecords(selectedFilter)}
            title="Refresh preparation records"
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
            {totalCount} Active Sessions Stored
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 1rem auto' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', margin: 0 }}>
            Querying preparation records from database...
          </p>
        </div>
      ) : records.length === 0 ? (
        /* Empty State */
        <EmptyState
          id="empty-preparation-records"
          icon={<Database size={28} aria-hidden="true" />}
          title="No Preparation Sessions Recorded Yet"
          description={
            dbError
              ? 'Database persistence is currently unavailable. Practice sessions in Section 4 can be performed locally.'
              : 'Complete a coding challenge, architecture review, STAR answer, or video practice in Section 4 and click "Save Practice Record" to build your persistent audit trail.'
          }
          actionText={selectedFilter !== 'all' ? 'Reset Filter to All' : 'Start Interview Preparation'}
          onAction={
            selectedFilter !== 'all'
              ? () => setSelectedFilter('all')
              : () => (onNavigate ? onNavigate('interview-prep') : (window.location.hash = '#interview-prep'))
          }
        />
      ) : (
        /* Records List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map((rec) => (
            <div
              key={rec.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    marginTop: '2px',
                  }}
                >
                  {getDomainIcon(rec.practice_type)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {rec.title}
                    </h3>
                    <span className="badge badge-neutral" style={{ fontSize: '0.675rem', textTransform: 'uppercase' }}>
                      {rec.practice_type}
                    </span>
                    {rec.category && (
                      <span style={{ fontSize: '0.725rem', color: '#818cf8', fontWeight: 500 }}>
                        • {rec.category}
                      </span>
                    )}
                  </div>

                  {rec.summary && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                      {rec.summary}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} aria-hidden="true" />
                      {formatDate(rec.created_at)}
                    </span>
                    <span>Status: <strong style={{ color: 'var(--text-main)' }}>{rec.status}</strong></span>
                    {rec.score !== null && rec.score !== undefined && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 600 }}>
                        <Award size={12} aria-hidden="true" />
                        Score: {rec.score}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveRecordModal(rec)}
                  id={`btn-view-record-${rec.id}`}
                >
                  <span>Inspect Details</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setRecordToDelete(rec)}
                  title="Delete record"
                  aria-label={`Delete record ${rec.id}`}
                  id={`btn-delete-record-${rec.id}`}
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Details Modal Dialog */}
      {activeRecordModal && (
        <div
          className="ai-drawer-overlay"
          onClick={() => setActiveRecordModal(null)}
          role="presentation"
        >
          <div
            className="card"
            style={{
              maxWidth: '640px',
              width: '90%',
              margin: 'auto',
              background: '#0d1322',
              border: '1px solid var(--border-hover)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              zIndex: 70,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                  {activeRecordModal.practice_type}
                </span>
                <h3 id="record-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  {activeRecordModal.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Recorded on {formatDate(activeRecordModal.created_at)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem', border: 'none' }}
                onClick={() => setActiveRecordModal(null)}
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Score & Summary */}
            {activeRecordModal.score !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                  Evaluated Score: {activeRecordModal.score} / 100
                </span>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                  Status: {activeRecordModal.status}
                </span>
              </div>
            )}

            {activeRecordModal.summary && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                {activeRecordModal.summary}
              </p>
            )}

            {/* Structured Domain Metadata Display */}
            <div style={{ background: '#070b13', padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8', marginBottom: '0.5rem' }}>
                Audited Session Data & Telemetry:
              </div>

              {/* Coding Sandbox Detail */}
              {activeRecordModal.practice_type === 'coding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.775rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div><strong>Language:</strong> {activeRecordModal.session_metadata?.language_name || activeRecordModal.session_metadata?.language || 'N/A'}</div>
                    {activeRecordModal.session_metadata?.difficulty && (
                      <div><strong>Difficulty:</strong> <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{activeRecordModal.session_metadata.difficulty}</span></div>
                    )}
                    {activeRecordModal.session_metadata?.execution_result?.exit_code !== undefined && (
                      <div><strong>Exit Code:</strong> {activeRecordModal.session_metadata.execution_result.exit_code}</div>
                    )}
                    {activeRecordModal.session_metadata?.execution_result?.time_ms !== undefined && (
                      <div><strong>Runtime:</strong> {activeRecordModal.session_metadata.execution_result.time_ms} ms</div>
                    )}
                  </div>

                  {activeRecordModal.session_metadata?.source_code && (
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: '0.25rem', fontWeight: 600 }}>Submitted Source Code:</div>
                      <pre style={{ margin: 0, padding: '0.625rem', background: '#04070d', borderRadius: 'var(--radius-sm)', color: '#38bdf8', overflowX: 'auto', fontFamily: 'monospace', maxHeight: '180px' }}>
                        {activeRecordModal.session_metadata.source_code}
                      </pre>
                    </div>
                  )}

                  {activeRecordModal.session_metadata?.stdin && (
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: '0.25rem', fontWeight: 600 }}>Standard Input (stdin):</div>
                      <pre style={{ margin: 0, padding: '0.4rem', background: '#04070d', borderRadius: 'var(--radius-sm)', color: '#e2e8f0', overflowX: 'auto', fontFamily: 'monospace' }}>
                        {activeRecordModal.session_metadata.stdin}
                      </pre>
                    </div>
                  )}

                  {(activeRecordModal.session_metadata?.execution_result?.stdout || activeRecordModal.session_metadata?.stdout) && (
                    <div>
                      <div style={{ color: '#34d399', marginBottom: '0.25rem', fontWeight: 600 }}>Standard Output (stdout):</div>
                      <pre style={{ margin: 0, padding: '0.5rem', background: '#04070d', borderRadius: 'var(--radius-sm)', color: '#34d399', overflowX: 'auto', fontFamily: 'monospace' }}>
                        {activeRecordModal.session_metadata.execution_result?.stdout || activeRecordModal.session_metadata.stdout}
                      </pre>
                    </div>
                  )}

                  {(activeRecordModal.session_metadata?.execution_result?.stderr || activeRecordModal.session_metadata?.stderr) && (
                    <div>
                      <div style={{ color: '#f87171', marginBottom: '0.25rem', fontWeight: 600 }}>Error Output (stderr):</div>
                      <pre style={{ margin: 0, padding: '0.5rem', background: '#180a0a', borderRadius: 'var(--radius-sm)', color: '#fca5a5', overflowX: 'auto', fontFamily: 'monospace' }}>
                        {activeRecordModal.session_metadata.execution_result?.stderr || activeRecordModal.session_metadata.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Video Practice Detail */}
              {activeRecordModal.practice_type === 'video' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.775rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {activeRecordModal.session_metadata?.mode && (
                      <div><strong>Practice Mode:</strong> <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{activeRecordModal.session_metadata.mode === 'technical' ? 'Technical' : 'Non-Technical'}</span></div>
                    )}
                    <div><strong>Duration:</strong> {activeRecordModal.session_metadata?.duration_formatted || `${activeRecordModal.session_metadata?.duration_seconds || 0}s`}</div>
                    {activeRecordModal.session_metadata?.format && (
                      <div><strong>Format:</strong> {activeRecordModal.session_metadata.format}</div>
                    )}
                  </div>

                  {activeRecordModal.session_metadata?.question_prompt && (
                    <div>
                      <div style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Question Prompt:
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-main)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        {activeRecordModal.session_metadata.question_prompt}
                      </p>
                    </div>
                  )}

                  {(activeRecordModal.session_metadata?.transcript_notes || activeRecordModal.session_metadata?.user_transcript) && (
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: '0.25rem', fontWeight: 600 }}>Candidate Notes / Speech Transcript:</div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', background: '#04070d', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        {activeRecordModal.session_metadata.transcript_notes || activeRecordModal.session_metadata.user_transcript}
                      </p>
                    </div>
                  )}

                  {activeRecordModal.session_metadata?.audit_result?.stream_quality_notes && (
                    <div>
                      <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '0.25rem' }}>Audit Indicators:</div>
                      <ul style={{ margin: '0.2rem 0 0 1.25rem', padding: 0 }}>
                        {activeRecordModal.session_metadata.audit_result.stream_quality_notes.map((note: string, idx: number) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Company Drill Detail */}
              {activeRecordModal.practice_type === 'company' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.775rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {activeRecordModal.session_metadata?.company && (
                      <div><strong>Company:</strong> <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{activeRecordModal.session_metadata.company}</span></div>
                    )}
                    {activeRecordModal.session_metadata?.drill_mode && (
                      <div><strong>Drill Mode:</strong> <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{activeRecordModal.session_metadata.drill_mode}</span></div>
                    )}
                    {activeRecordModal.session_metadata?.input_method && (
                      <div><strong>Input:</strong> {activeRecordModal.session_metadata.input_method === 'speech' ? '🎙️ Speech-to-Text' : '⌨️ Typed'}</div>
                    )}
                  </div>

                  {(activeRecordModal.session_metadata?.question_prompt || activeRecordModal.session_metadata?.challenge_question) && (
                    <div>
                      <div style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Drill Question:
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-main)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        {activeRecordModal.session_metadata.question_prompt || activeRecordModal.session_metadata.challenge_question}
                      </p>
                    </div>
                  )}

                  {(activeRecordModal.session_metadata?.answer || activeRecordModal.session_metadata?.response) && (
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: '0.25rem', fontWeight: 600 }}>Candidate Answer:</div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', background: '#04070d', padding: '0.5rem', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>
                        {activeRecordModal.session_metadata.answer || activeRecordModal.session_metadata.response}
                      </p>
                    </div>
                  )}

                  {activeRecordModal.session_metadata?.feedback && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '0.25rem' }}>
                        Feedback Verdict: {activeRecordModal.session_metadata.feedback.verdict} ({activeRecordModal.session_metadata.feedback.score}/100)
                      </div>
                      {activeRecordModal.session_metadata.feedback.strengths?.length > 0 && (
                        <div style={{ color: '#6ee7b7', marginTop: '0.25rem' }}>
                          <strong>Strengths:</strong> {activeRecordModal.session_metadata.feedback.strengths.join('; ')}
                        </div>
                      )}
                      {activeRecordModal.session_metadata.feedback.improvements?.length > 0 && (
                        <div style={{ color: '#fde68a', marginTop: '0.25rem' }}>
                          <strong>To Improve:</strong> {activeRecordModal.session_metadata.feedback.improvements.join('; ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Legacy Architecture Detail */}
              {activeRecordModal.practice_type === 'architecture' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.775rem' }}>
                  <div><strong>Readiness:</strong> {activeRecordModal.session_metadata?.readiness_level || 'N/A'}</div>
                  {activeRecordModal.session_metadata?.high_level_design && (
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: '0.25rem' }}>High-Level Design:</div>
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>{activeRecordModal.session_metadata.high_level_design}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Legacy STAR Behavioral Detail */}
              {activeRecordModal.practice_type === 'behavioral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.775rem' }}>
                  <div><strong>Question:</strong> {activeRecordModal.session_metadata?.question}</div>
                  {activeRecordModal.session_metadata?.situation && (
                    <div><strong style={{ color: '#38bdf8' }}>Situation:</strong> {activeRecordModal.session_metadata.situation}</div>
                  )}
                  {activeRecordModal.session_metadata?.action && (
                    <div><strong style={{ color: '#a78bfa' }}>Action:</strong> {activeRecordModal.session_metadata.action}</div>
                  )}
                  {activeRecordModal.session_metadata?.result && (
                    <div><strong style={{ color: '#34d399' }}>Result:</strong> {activeRecordModal.session_metadata.result}</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveRecordModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {recordToDelete && (
        <div
          className="ai-drawer-overlay"
          onClick={() => setRecordToDelete(null)}
          role="presentation"
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '90%',
              margin: 'auto',
              background: '#0d1322',
              border: '1px solid var(--danger-border)',
              zIndex: 80,
            }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={20} style={{ color: '#ef4444' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Confirm Record Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>"{recordToDelete.title}"</strong> (ID: {recordToDelete.id}) from the database? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteRecord}
                disabled={isDeleting}
                id="btn-confirm-delete"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
