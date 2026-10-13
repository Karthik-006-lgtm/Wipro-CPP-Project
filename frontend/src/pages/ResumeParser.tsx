import React, { useState, useRef } from 'react';
import {
  FileSearch,
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  FileCheck,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Mail,
  Phone,
  Globe,
  Award,
  GraduationCap,
  Briefcase,
  Play,
  RotateCcw,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { SelectedFileMetadata, ResumeParseResponse, DetectedSkill, PortalSectionId } from '../types';
import { apiClient } from '../api/client';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

interface ResumeParserProps {
  onNavigate?: (section: PortalSectionId) => void;
}

export const ResumeParser: React.FC<ResumeParserProps> = ({ onNavigate }) => {
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<SelectedFileMetadata | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ResumeParseResponse | null>(null);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('All');
  const [showFullPreview, setShowFullPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    setParseResult(null);

    const validExtensions = ['.pdf', '.docx', '.txt'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setErrorMessage(`Unsupported format (${fileExt}). Please select a PDF (.pdf), Microsoft Word (.docx), or plain text (.txt) document.`);
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file is empty (0 bytes). Please choose a valid document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`);
      return;
    }

    setSelectedFileObj(file);
    setSelectedFileMeta({
      name: file.name,
      sizeBytes: file.size,
      type: file.type || 'Document',
      lastModifiedDate: new Date(file.lastModified).toLocaleDateString(),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleClearFile = () => {
    setSelectedFileObj(null);
    setSelectedFileMeta(null);
    setErrorMessage(null);
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFileObj) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.parseResume(selectedFileObj);
      setParseResult(response);
      try {
        sessionStorage.setItem('lastParsedResume', JSON.stringify(response));
      } catch {
        // Ignore storage error
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process resume on the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatchingCompanies = () => {
    if (!parseResult) return;
    const skills = parseResult.skills.map((s) => s.normalized_name);
    try {
      sessionStorage.setItem('matchCandidateSkills', JSON.stringify(skills));
    } catch {
      // Ignore storage errors
    }
    if (onNavigate) {
      onNavigate('company-details');
    } else {
      window.location.hash = '#company-details';
    }
  };

  // Group detected skills by category
  const skillCategories = ['All', ...Array.from(new Set(parseResult?.skills.map((s) => s.category) || []))];
  const filteredSkills = parseResult?.skills.filter(
    (s) => selectedSkillFilter === 'All' || s.category === selectedSkillFilter
  ) || [];

  return (
    <div id="section-resume-parser" role="tabpanel" aria-labelledby="nav-item-resume-parser">
      <div className="section-header">
        <div className="section-eyebrow">
          <FileSearch size={14} aria-hidden="true" />
          <span>Document Ingestion & Skill Extraction</span>
        </div>
        <h2 className="section-title">Resume Parser & Skill Extraction</h2>
        <p className="section-desc">
          Upload and extract structured competencies, verified skills, and transparent ATS compliance indicators from PDF, DOCX, and TXT resumes via the FastAPI backend.
        </p>
      </div>

      {/* Upload Zone / Document Ingest */}
      {!parseResult && (
        <>
          <div className="grid-cards" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <div className="card-title">
              <UploadCloud size={18} style={{ color: '#818cf8' }} aria-hidden="true" />
              <span>Resume Document Upload</span>
            </div>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Upload resume file"
            />

            {!selectedFileMeta ? (
              <div
                id="resume-dropzone"
                tabIndex={0}
                role="button"
                aria-label="Upload resume file. Click or drag and drop a PDF, Word, or TXT file."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: `2px dashed ${isDragOver ? '#818cf8' : 'var(--border-hover)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.45)',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="empty-icon-wrap" style={{ margin: '0 auto 1rem auto' }}>
                  <FileText size={26} aria-hidden="true" />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem', fontSize: '1rem' }}>
                  Drag and drop your resume here, or click to browse
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', maxWidth: '440px', margin: '0 auto' }}>
                  Accepts PDF (.pdf), Microsoft Word (.docx), or Plain Text (.txt) up to 10 MB.
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-hover)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '8px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#34d399',
                      }}
                    >
                      <FileCheck size={22} aria-hidden="true" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {selectedFileMeta.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Size: {formatFileSize(selectedFileMeta.sizeBytes)} • Modified: {selectedFileMeta.lastModifiedDate}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleClearFile}
                      disabled={loading}
                    >
                      <X size={14} aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      id="parse-resume-submit-btn"
                      onClick={handleUploadAndParse}
                      disabled={loading}
                    >
                      <Play size={13} aria-hidden="true" />
                      <span>{loading ? 'Processing Document...' : 'Extract & Parse Resume'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: '#fca5a5',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={15} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* ATS Ingestion & Compliance Guide Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="card-title">
                <Shield size={19} style={{ color: '#34d399' }} aria-hidden="true" />
                <span>ATS Ingestion & Compliance Guide</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', marginTop: '6px' }} />
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <strong>Transparent ATS Scoring:</strong> Automatically audits structural headings, contact verification, single-column readability, and typography risks.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', marginTop: '6px' }} />
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <strong>Categorized Skill Extraction:</strong> Identifies 50+ programming languages, frameworks, cloud platforms, and developer tooling.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', marginTop: '6px' }} />
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <strong>Direct Company Matching:</strong> Seamlessly carries extracted skills to Section 3 to compare against hiring stacks across 52 tech companies.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', marginTop: '6px' }} />
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <strong>Secure In-Memory Parsing:</strong> Files are processed in memory via pypdf and python-docx with zero public disk storage leaks.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Accepts standard PDF, DOCX, & TXT
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                ATS Engine Ready
              </span>
            </div>
          </div>
        </div>

        {/* Three Ingestion Capabilities Highlights Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              1. Formatting Health Audit
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Evaluates single-column clarity, fonts, and missing headings to prevent ATS screening rejection.
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              2. Skill Categorization
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Classifies technical proficiencies into Languages, Frameworks, Cloud, Databases, and Tools.
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              3. Company Gap Analysis
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Matches your verified qualifications against hiring criteria from 52 engineering employers.
            </div>
          </div>
        </div>
      </>
    )}

      {/* Loading State during Processing */}
      {loading && (
        <div style={{ margin: '2rem 0' }}>
          <LoadingSpinner message="Extracting text, identifying competencies, and computing transparent ATS evaluations..." />
        </div>
      )}

      {/* Backend Parsing Results Display */}
      {parseResult && (
        <div id="resume-parsed-results">
          {/* Top Actions Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="badge badge-success">
                <CheckCircle2 size={12} aria-hidden="true" />
                <span>Successfully Parsed</span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{parseResult.metadata.filename}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                ({parseResult.metadata.file_format.toUpperCase()} • {parseResult.metadata.word_count} words • {formatFileSize(parseResult.metadata.file_size_bytes)})
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFile}
              id="upload-another-resume-btn"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Upload Another Resume</span>
            </button>
          </div>

          {/* Warnings Banner if any */}
          {parseResult.warnings.length > 0 && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.8125rem',
                color: '#fde68a',
              }}
            >
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                <AlertTriangle size={15} style={{ color: '#fbbf24' }} aria-hidden="true" />
                <span>Parser Notifications:</span>
              </div>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                {parseResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Prominent Next Action: Search Relevant Companies */}
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1.125rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e0e7ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} style={{ color: '#818cf8' }} aria-hidden="true" />
                <span>Find Employers Matching Your Technical Profile</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#c7d2fe', marginTop: '0.25rem' }}>
                We identified {parseResult.skills.length} verified technical competencies in your resume. Click below to view companies hiring for your exact tech stack.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFindMatchingCompanies}
              id="search-relevant-companies-banner-btn"
              style={{ gap: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}
            >
              <Building2 size={16} aria-hidden="true" />
              <span>Search Relevant Companies</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Section 1: Candidate Overview & ATS Score Header */}
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            {/* Candidate Contact Info */}
            <div className="card">
              <div className="card-title">
                <User size={18} style={{ color: '#818cf8' }} aria-hidden="true" />
                <span>Candidate Profile Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.875rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Detected Name:</span>
                  <div style={{ fontWeight: 700, color: parseResult.contact_info.name ? 'var(--text-main)' : 'var(--text-dim)' }}>
                    {parseResult.contact_info.name || 'Not confidently identified'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
                  <span style={{ color: parseResult.contact_info.email ? 'var(--text-main)' : 'var(--text-dim)' }}>
                    {parseResult.contact_info.email || 'No email detected'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
                  <span style={{ color: parseResult.contact_info.phone ? 'var(--text-main)' : 'var(--text-dim)' }}>
                    {parseResult.contact_info.phone || 'No phone number detected'}
                  </span>
                </div>

                {parseResult.contact_info.links.length > 0 && (
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Links & Profiles:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
                      {parseResult.contact_info.links.map((link, idx) => (
                        <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                          <Globe size={11} style={{ marginRight: 3 }} aria-hidden="true" />
                          {link}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ATS Compliance Summary */}
            <div className="card">
              <div className="card-title">
                <Award size={18} style={{ color: '#34d399' }} aria-hidden="true" />
                <span>ATS Readability Index</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '0.5rem 0' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399' }}>
                  {parseResult.ats_evaluation.heuristic_score}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>/ 100 Heuristic Index</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                {parseResult.ats_evaluation.score_disclaimer}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>Standard Headings Detected:</strong> {parseResult.sections_detected.length > 0 ? parseResult.sections_detected.join(', ') : 'None explicitly matched'}
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  id="find-companies-matching-skills-btn"
                  className="btn btn-primary"
                  onClick={handleFindMatchingCompanies}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                    fontWeight: 600,
                    gap: '0.5rem',
                  }}
                >
                  <Building2 size={16} aria-hidden="true" />
                  <span>Search Relevant Companies</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Detected Skills with Categorization & Evidence */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="card-title" style={{ margin: 0 }}>
                <Layers size={18} style={{ color: '#38bdf8' }} aria-hidden="true" />
                <span>Detected Technical Competencies ({parseResult.skills.length})</span>
              </div>

              {/* Action & Category filter tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="match-companies-from-competencies-btn"
                  className="btn btn-secondary btn-sm"
                  onClick={handleFindMatchingCompanies}
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', borderColor: '#4f46e5', color: '#c7d2fe' }}
                  title="Search relevant employer matches"
                >
                  <Building2 size={13} aria-hidden="true" />
                  <span>Search Relevant Companies</span>
                </button>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {skillCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedSkillFilter(cat)}
                    className={`btn btn-sm ${selectedSkillFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                  >
                    {cat}
                  </button>
                ))}
                </div>
              </div>
            </div>

            {filteredSkills.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No skills detected in this category.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {filteredSkills.map((skill: DetectedSkill, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {skill.normalized_name}
                      </span>
                      <span className="badge badge-info" style={{ fontSize: '0.675rem' }}>
                        {skill.category}
                      </span>
                    </div>
                    {skill.raw_term.toLowerCase() !== skill.normalized_name.toLowerCase() && (
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        Matched alias: <code style={{ color: '#818cf8' }}>{skill.raw_term}</code>
                      </div>
                    )}
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                      Evidence: "{skill.evidence}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Transparent Rule-Based ATS Checks */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>
              <CheckCircle2 size={18} style={{ color: '#34d399' }} aria-hidden="true" />
              <span>Transparent Rule-Based ATS Audit</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {parseResult.ats_evaluation.checks.map((check, idx) => {
                let badgeClass = 'badge-neutral';
                let icon = <CheckCircle2 size={14} style={{ color: '#34d399' }} aria-hidden="true" />;
                if (check.status === 'pass') {
                  badgeClass = 'badge-success';
                } else if (check.status === 'warning') {
                  badgeClass = 'badge-warning';
                  icon = <AlertTriangle size={14} style={{ color: '#fbbf24' }} aria-hidden="true" />;
                } else {
                  badgeClass = 'badge-danger';
                  icon = <XCircle size={14} style={{ color: '#f87171' }} aria-hidden="true" />;
                }

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        {icon}
                        <span>{check.name}</span>
                      </div>
                      <span className={`badge ${badgeClass}`} style={{ textTransform: 'capitalize' }}>
                        {check.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {check.explanation}
                    </p>

                    {check.evidence && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <strong>Evidence:</strong> {check.evidence}
                      </div>
                    )}

                    {check.suggested_improvement && (
                      <div style={{ fontSize: '0.75rem', color: '#fde68a', background: 'rgba(245, 158, 11, 0.08)', padding: '0.375rem 0.625rem', borderRadius: '4px' }}>
                        💡 <strong>Suggestion:</strong> {check.suggested_improvement}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Education, Experience & Certifications */}
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-title">
                <GraduationCap size={18} style={{ color: '#818cf8' }} aria-hidden="true" />
                <span>Education Entries ({parseResult.education.length})</span>
              </div>
              {parseResult.education.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No explicit degree qualifications detected.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {parseResult.education.map((edu, idx) => (
                    <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--text-main)', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                      {edu}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">
                <Briefcase size={18} style={{ color: '#38bdf8' }} aria-hidden="true" />
                <span>Work Chronology Markers ({parseResult.experience.length})</span>
              </div>
              {parseResult.experience.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No date-formatted employment lines detected.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {parseResult.experience.map((exp, idx) => (
                    <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--text-main)', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                      {exp}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {parseResult.certifications.length > 0 && (
              <div className="card">
                <div className="card-title">
                  <Award size={18} style={{ color: '#f59e0b' }} aria-hidden="true" />
                  <span>Certifications ({parseResult.certifications.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {parseResult.certifications.map((cert, idx) => (
                    <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--text-main)', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Extracted Text Preview */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div className="card-title" style={{ margin: 0 }}>
                <FileText size={18} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
                <span>Extracted Document Text Preview</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowFullPreview(!showFullPreview)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                {showFullPreview ? 'Collapse Preview' : 'Expand Preview'}
              </button>
            </div>

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.775rem',
                color: 'var(--text-dim)',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'pre-wrap',
                maxHeight: showFullPreview ? '600px' : '180px',
                overflowY: 'auto',
                lineHeight: 1.5,
              }}
            >
              {parseResult.extracted_text_preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
