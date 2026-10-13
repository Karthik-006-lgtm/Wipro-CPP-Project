import React, { useState, useEffect } from 'react';
import {
  FileText,
  Layout,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileDown,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code2,
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  UploadCloud,
} from 'lucide-react';
import { apiClient, ApiClientError } from '../api/client';
import {
  ResumeGeneratorRequest,
  PersonalInfo,
  SkillGroup,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
  CertificationEntry,
  CustomSection,
} from '../types';

export const ResumeGenerator: React.FC = () => {
  // =================================================================
  // STATE MANAGEMENT
  // =================================================================
  const [templateId, setTemplateId] = useState<'classic_professional' | 'modern_technical'>('classic_professional');
  const [activeEditorTab, setActiveEditorTab] = useState<'personal' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'custom'>('personal');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Form Data with sensible production-ready defaults
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    full_name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 432-8921',
    location: 'San Francisco, CA',
    title: 'Senior Full-Stack & Systems Engineer',
    linkedin: 'linkedin.com/in/alex-rivera-dev',
    github: 'github.com/alexrivera-tech',
    portfolio: 'https://alexrivera.dev',
  });

  const [summary, setSummary] = useState<string>(
    'Pragmatic software engineer with 6+ years of full-stack engineering experience building distributed architectures with React, TypeScript, and FastAPI. Focused on sub-second API latency, resilient caching layers, and high-quality automated testing suites.'
  );

  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([
    {
      category: 'Languages',
      skills: ['TypeScript', 'Python', 'Go', 'SQL', 'C++'],
    },
    {
      category: 'Frameworks & Frontend',
      skills: ['React 19', 'Vite', 'FastAPI', 'Node.js', 'Tailwind CSS'],
    },
    {
      category: 'Infrastructure & Data',
      skills: ['PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    },
  ]);

  const [experience, setExperience] = useState<ExperienceEntry[]>([
    {
      organization: 'Vanguard Systems Cloud',
      role: 'Senior Full-Stack Software Engineer',
      location: 'San Francisco, CA',
      start_date: 'Feb 2022',
      end_date: 'Present',
      current: true,
      responsibilities: [
        'Architected real-time metrics streaming dashboard serving 45,000 daily active enterprise users.',
        'Refactored legacy monolith into modular FastAPI services, decreasing p95 latency by 42%.',
        'Implemented rigorous automated unit and integration suites achieving 94% test coverage.',
      ],
    },
    {
      organization: 'Starlight Media SaaS',
      role: 'Full-Stack Developer',
      location: 'Austin, TX',
      start_date: 'Jun 2019',
      end_date: 'Jan 2022',
      current: false,
      responsibilities: [
        'Engineered responsive React component library and state management architecture.',
        'Designed secure OAuth2 and session token rotation mechanisms across internal APIs.',
      ],
    },
  ]);

  const [projects, setProjects] = useState<ProjectEntry[]>([
    {
      title: 'Distributed Stream Orchestrator',
      description: 'Fault-tolerant job scheduler distributing asynchronous payload queues across container clusters.',
      technologies: ['Python', 'FastAPI', 'Redis', 'Docker'],
      contributions: [
        'Implemented consensus heartbeats with automatic master election upon worker failure.',
        'Benchmarked throughput at 14,000 events/sec with zero packet drop.',
      ],
      link: 'https://github.com/alexrivera-tech/stream-orchestrator',
    },
  ]);

  const [education, setEducation] = useState<EducationEntry[]>([
    {
      institution: 'University of Washington',
      degree: 'B.S. in Computer Science & Engineering',
      start_date: 'Sep 2015',
      end_date: 'Jun 2019',
      gpa_or_honors: '3.82 / 4.00 (Dean’s Honor List)',
      details: 'Relevant Coursework: Distributed Systems, Database Internals, Algorithms.',
    },
  ]);

  const [certifications, setCertifications] = useState<CertificationEntry[]>([
    {
      name: 'AWS Certified Solutions Architect — Associate',
      issuer: 'Amazon Web Services',
      date: '2023',
      credential_url_or_id: 'AWS-SAA-109284',
    },
  ]);

  const [customSections, setCustomSections] = useState<CustomSection[]>([]);

  // Feedback, Loading & Import States
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [hasParsedDataAvailable, setHasParsedDataAvailable] = useState<boolean>(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState<boolean>(false);

  // Check for cached resume from Phase 3 Resume Parser
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('lastParsedResume');
      if (cached) {
        setHasParsedDataAvailable(true);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  // Construct complete request payload
  const currentResumePayload: ResumeGeneratorRequest = {
    template_id: templateId,
    personal_info: personalInfo,
    summary,
    skill_groups: skillGroups,
    education,
    experience,
    projects,
    certifications,
    custom_sections: customSections,
  };

  // Validation
  const validationErrors: string[] = [];
  if (!personalInfo.full_name.trim()) validationErrors.push('Full candidate name is required.');
  if (!personalInfo.email.trim()) validationErrors.push('Contact email address is required.');

  // =================================================================
  // EXPORT HANDLERS
  // =================================================================
  const handleExportPdf = async () => {
    if (validationErrors.length > 0) {
      setNotification({ type: 'error', message: validationErrors.join(' ') });
      return;
    }
    setIsExportingPdf(true);
    setNotification(null);

    try {
      const { blob, filename } = await apiClient.exportResumePdf(currentResumePayload);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `${personalInfo.full_name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setNotification({
        type: 'success',
        message: `Successfully generated and downloaded PDF: "${link.download}"`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err instanceof ApiClientError ? err.message : 'Failed to export PDF resume document.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (validationErrors.length > 0) {
      setNotification({ type: 'error', message: validationErrors.join(' ') });
      return;
    }
    setIsExportingDocx(true);
    setNotification(null);

    try {
      const { blob, filename } = await apiClient.exportResumeDocx(currentResumePayload);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `${personalInfo.full_name.replace(/\s+/g, '_')}_Resume.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setNotification({
        type: 'success',
        message: `Successfully generated and downloaded Word document: "${link.download}"`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err instanceof ApiClientError ? err.message : 'Failed to export DOCX resume document.',
      });
    } finally {
      setIsExportingDocx(false);
    }
  };

  // =================================================================
  // IMPORT FROM RESUME PARSER HANDLER
  // =================================================================
  const handleConfirmImport = () => {
    try {
      const cached = sessionStorage.getItem('lastParsedResume');
      if (!cached) return;
      const parsed = JSON.parse(cached);

      // Extract contact info
      if (parsed.contact_info) {
        setPersonalInfo((prev) => ({
          ...prev,
          full_name: parsed.contact_info.name || prev.full_name,
          email: parsed.contact_info.email || prev.email,
          phone: parsed.contact_info.phone || prev.phone,
          linkedin: parsed.contact_info.links?.find((l: string) => l.includes('linkedin')) || prev.linkedin,
          github: parsed.contact_info.links?.find((l: string) => l.includes('github')) || prev.github,
          portfolio: parsed.contact_info.links?.find((l: string) => !l.includes('linkedin') && !l.includes('github')) || prev.portfolio,
        }));
      }

      // Extract skills grouped by category
      if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        const catMap: Record<string, string[]> = {};
        parsed.skills.forEach((s: any) => {
          const cat = s.category || 'Technical Skills';
          if (!catMap[cat]) catMap[cat] = [];
          if (!catMap[cat].includes(s.normalized_name)) {
            catMap[cat].push(s.normalized_name);
          }
        });
        const newGroups: SkillGroup[] = Object.entries(catMap).map(([category, skills]) => ({
          category,
          skills,
        }));
        setSkillGroups(newGroups);
      }

      // Extract education degrees if detected
      if (Array.isArray(parsed.education) && parsed.education.length > 0) {
        setEducation(
          parsed.education.map((deg: string) => ({
            institution: 'Accredited University',
            degree: deg,
            start_date: '2016',
            end_date: '2020',
          }))
        );
      }

      // Extract certifications
      if (Array.isArray(parsed.certifications) && parsed.certifications.length > 0) {
        setCertifications(
          parsed.certifications.map((c: string) => ({
            name: c,
            issuer: 'Certified Authority',
          }))
        );
      }

      setNotification({
        type: 'success',
        message: 'Imported structured fields from your parsed resume. You can now customize and export!',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Failed to read parsed resume cache from browser memory.',
      });
    } finally {
      setShowImportConfirmModal(false);
    }
  };

  // Helper: Reset to sample starter
  const handleResetStarter = () => {
    setPersonalInfo({
      full_name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 (555) 432-8921',
      location: 'San Francisco, CA',
      title: 'Senior Full-Stack & Systems Engineer',
      linkedin: 'linkedin.com/in/alex-rivera-dev',
      github: 'github.com/alexrivera-tech',
      portfolio: 'https://alexrivera.dev',
    });
    setSummary('Pragmatic software engineer with 6+ years of full-stack engineering experience building distributed architectures with React, TypeScript, and FastAPI.');
    setNotification({ type: 'info', message: 'Reset form to standard sample starter profile.' });
  };

  return (
    <div id="section-resume-generator" role="tabpanel" aria-labelledby="nav-item-resume-generator">
      {/* Header */}
      <div className="section-header">
        <div className="section-eyebrow">
          <FileText size={14} aria-hidden="true" />
          <span>ATS Resume Generation & Document Export</span>
        </div>
        <h2 className="section-title">Functional Resume Generator & Exporter</h2>
        <p className="section-desc">
          Build ATS-optimized resumes with real-time preview. Customize experience, projects, skills, and layout, then download genuine Microsoft Word (.docx) and Adobe PDF (.pdf) documents.
        </p>
      </div>

      {/* Import from Parser Callout Banner */}
      {hasParsedDataAvailable && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <UploadCloud size={18} style={{ color: '#818cf8', flexShrink: 0 }} aria-hidden="true" />
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#c7d2fe' }}>
                Parsed Resume Data Available:
              </strong>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                Transfer detected contact info, technical skills, and credentials from your recently parsed resume.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowImportConfirmModal(true)}
            id="btn-import-from-parser"
          >
            <Sparkles size={13} aria-hidden="true" />
            <span>Import Extracted Profile</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal for Parser Import */}
      {showImportConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-import-title"
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 id="modal-import-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Confirm Profile Import
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              This will update your current editor form with your parsed resume's contact info, technical skills, education, and credentials. Existing fields will be replaced with the imported data.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowImportConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmImport}
              >
                Confirm & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar: Template Picker + Export Controls */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
        }}
      >
        {/* Template Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Layout Template:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${templateId === 'classic_professional' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTemplateId('classic_professional')}
              id="template-classic-btn"
            >
              <Layout size={13} aria-hidden="true" />
              <span>Classic Professional (ATS)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${templateId === 'modern_technical' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTemplateId('modern_technical')}
              id="template-modern-btn"
            >
              <Layout size={13} aria-hidden="true" />
              <span>Modern Technical</span>
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetStarter}
            title="Reset form to default sample values"
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Reset Sample</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportPdf}
            disabled={isExportingPdf || validationErrors.length > 0}
            id="btn-export-pdf"
          >
            {isExportingPdf ? (
              <>
                <div className="spinner" style={{ width: 12, height: 12 }} />
                <span>Building PDF...</span>
              </>
            ) : (
              <>
                <FileDown size={13} aria-hidden="true" />
                <span>Export PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportDocx}
            disabled={isExportingDocx || validationErrors.length > 0}
            id="btn-export-docx"
          >
            {isExportingDocx ? (
              <>
                <div className="spinner" style={{ width: 12, height: 12 }} />
                <span>Building DOCX...</span>
              </>
            ) : (
              <>
                <FileDown size={13} aria-hidden="true" />
                <span>Export DOCX</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {notification && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background:
              notification.type === 'success'
                ? 'rgba(16, 185, 129, 0.1)'
                : notification.type === 'error'
                ? 'var(--danger-bg)'
                : 'rgba(56, 189, 248, 0.1)',
            border: `1px solid ${
              notification.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : notification.type === 'error'
                ? 'var(--danger-border)'
                : 'rgba(56, 189, 248, 0.3)'
            }`,
            color:
              notification.type === 'success'
                ? '#34d399'
                : notification.type === 'error'
                ? '#f87171'
                : '#38bdf8',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {notification.type === 'success' ? (
              <CheckCircle size={16} aria-hidden="true" />
            ) : (
              <AlertCircle size={16} aria-hidden="true" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => setNotification(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Toggle Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
        className="hide-desktop"
      >
        <button
          type="button"
          className={`btn btn-sm ${mobileView === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMobileView('editor')}
          style={{ flex: 1 }}
        >
          <span>Form Editor</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mobileView === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMobileView('preview')}
          style={{ flex: 1 }}
        >
          <Eye size={13} aria-hidden="true" />
          <span>Live Document Preview</span>
        </button>
      </div>

      {/* Main Workspace: 2-Column Split (Form Editor vs Live Preview) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 1.15fr) minmax(380px, 1.2fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* ======================================================== */}
        {/* LEFT COLUMN: MULTI-SECTION RESUME FORM EDITOR            */}
        {/* ======================================================== */}
        <div
          style={{
            display: mobileView === 'preview' ? 'none' : 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Section Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.375rem',
              overflowX: 'auto',
              paddingBottom: '0.375rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
            role="tablist"
            aria-label="Resume Form Sections"
          >
            {[
              { id: 'personal', label: '1. Personal' },
              { id: 'skills', label: '2. Skills' },
              { id: 'experience', label: '3. Experience' },
              { id: 'projects', label: '4. Projects' },
              { id: 'education', label: '5. Education' },
              { id: 'certifications', label: '6. Certs' },
              { id: 'custom', label: '7. Optional' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeEditorTab === tab.id}
                className={`btn btn-sm ${activeEditorTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', whiteSpace: 'nowrap' }}
                onClick={() => setActiveEditorTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: PERSONAL INFORMATION & SUMMARY */}
          {activeEditorTab === 'personal' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <User size={16} style={{ color: '#818cf8' }} aria-hidden="true" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Personal Information & Summary
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="input-full-name" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    Full Name *
                  </label>
                  <input
                    id="input-full-name"
                    type="text"
                    value={personalInfo.full_name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
                    placeholder="e.g. Jordan Hayes"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="input-email" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    Contact Email *
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="e.g. jordan@example.com"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="input-title" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    Target Role / Title
                  </label>
                  <input
                    id="input-title"
                    type="text"
                    value={personalInfo.title || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, title: e.target.value })}
                    placeholder="e.g. Lead Systems Architect"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="input-phone" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    Phone Number
                  </label>
                  <input
                    id="input-phone"
                    type="text"
                    value={personalInfo.phone || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 019-2831"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="input-location" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    Location
                  </label>
                  <input
                    id="input-location"
                    type="text"
                    value={personalInfo.location || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="input-linkedin" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    LinkedIn URL
                  </label>
                  <input
                    id="input-linkedin"
                    type="text"
                    value={personalInfo.linkedin || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                    placeholder="e.g. linkedin.com/in/username"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="input-github" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    GitHub Handle / Link
                  </label>
                  <input
                    id="input-github"
                    type="text"
                    value={personalInfo.github || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                    placeholder="e.g. github.com/username"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="input-portfolio" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                    Portfolio / Website
                  </label>
                  <input
                    id="input-portfolio"
                    type="text"
                    value={personalInfo.portfolio || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                    placeholder="e.g. https://myportfolio.dev"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label htmlFor="input-summary" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                    Professional Summary / Objective
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {summary.length} / 2500 chars
                  </span>
                </div>
                <textarea
                  id="input-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Outline your engineering background, core technical specialties, and business achievements..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.825rem',
                    lineHeight: 1.45,
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL SKILLS */}
          {activeEditorTab === 'skills' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code2 size={16} style={{ color: '#38bdf8' }} aria-hidden="true" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Categorized Technical Skills
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSkillGroups([...skillGroups, { category: 'Tools & Cloud', skills: ['Docker', 'Git'] }])}
                >
                  <Plus size={12} aria-hidden="true" />
                  <span>Add Group</span>
                </button>
              </div>

              {skillGroups.map((group, gIdx) => (
                <div
                  key={gIdx}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => {
                        const updated = [...skillGroups];
                        updated[gIdx].category = e.target.value;
                        setSkillGroups(updated);
                      }}
                      placeholder="Category Title"
                      style={{
                        padding: '0.35rem 0.5rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        width: '60%',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSkillGroups(skillGroups.filter((_, i) => i !== gIdx))}
                      title="Delete this skill group"
                    >
                      <Trash2 size={12} style={{ color: '#f87171' }} aria-hidden="true" />
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                      Skills (comma separated):
                    </label>
                    <input
                      type="text"
                      value={group.skills.join(', ')}
                      onChange={(e) => {
                        const updated = [...skillGroups];
                        updated[gIdx].skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setSkillGroups(updated);
                      }}
                      placeholder="e.g. Python, TypeScript, Docker, SQL"
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: WORK EXPERIENCE */}
          {activeEditorTab === 'experience' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={16} style={{ color: '#34d399' }} aria-hidden="true" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Work Experience & Chronology
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setExperience([
                      ...experience,
                      {
                        organization: 'New Organization Inc.',
                        role: 'Software Engineer',
                        location: 'Remote',
                        start_date: '2022',
                        end_date: 'Present',
                        current: true,
                        responsibilities: ['Delivered core backend services with high test coverage.'],
                      },
                    ])
                  }
                >
                  <Plus size={12} aria-hidden="true" />
                  <span>Add Role</span>
                </button>
              </div>

              {experience.map((exp, eIdx) => (
                <div
                  key={eIdx}
                  style={{
                    padding: '0.875rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>
                      Role #{eIdx + 1}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExperience(experience.filter((_, i) => i !== eIdx))}
                      title="Remove experience entry"
                    >
                      <Trash2 size={12} style={{ color: '#f87171' }} aria-hidden="true" />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[eIdx].role = e.target.value;
                        setExperience(updated);
                      }}
                      placeholder="Role / Title"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    />
                    <input
                      type="text"
                      value={exp.organization}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[eIdx].organization = e.target.value;
                        setExperience(updated);
                      }}
                      placeholder="Company / Org"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={exp.start_date || ''}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[eIdx].start_date = e.target.value;
                        setExperience(updated);
                      }}
                      placeholder="Start Date (e.g. 2021)"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                    <input
                      type="text"
                      value={exp.end_date || ''}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[eIdx].end_date = e.target.value;
                        setExperience(updated);
                      }}
                      placeholder="End Date (e.g. Present)"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                    <input
                      type="text"
                      value={exp.location || ''}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[eIdx].location = e.target.value;
                        setExperience(updated);
                      }}
                      placeholder="Location"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                  </div>

                  {/* Bullet points */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                        Accomplishments & Bullet Points:
                      </span>
                      <button
                        type="button"
                        style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => {
                          const updated = [...experience];
                          updated[eIdx].responsibilities.push('Contributed to core product milestones.');
                          setExperience(updated);
                        }}
                      >
                        + Add Bullet
                      </button>
                    </div>

                    {exp.responsibilities.map((bullet, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem' }}>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[eIdx].responsibilities[bIdx] = e.target.value;
                            setExperience(updated);
                          }}
                          placeholder="e.g. Optimized database query performance by 35%..."
                          style={{
                            flex: 1,
                            padding: '0.35rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.775rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...experience];
                            updated[eIdx].responsibilities = updated[eIdx].responsibilities.filter((_, i) => i !== bIdx);
                            setExperience(updated);
                          }}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 0.25rem' }}
                          title="Remove bullet point"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: PROJECTS */}
          {activeEditorTab === 'projects' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} style={{ color: '#a78bfa' }} aria-hidden="true" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Technical Projects
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setProjects([
                      ...projects,
                      {
                        title: 'New Technical Project',
                        description: 'Summary of problem domain and technical implementation.',
                        technologies: ['React', 'FastAPI'],
                        contributions: ['Developed end-to-end user workflows and secure APIs.'],
                        link: 'https://github.com/your-username/project',
                      },
                    ])
                  }
                >
                  <Plus size={12} aria-hidden="true" />
                  <span>Add Project</span>
                </button>
              </div>

              {projects.map((proj, pIdx) => (
                <div
                  key={pIdx}
                  style={{
                    padding: '0.875rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => {
                        const updated = [...projects];
                        updated[pIdx].title = e.target.value;
                        setProjects(updated);
                      }}
                      placeholder="Project Title"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        width: '70%',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setProjects(projects.filter((_, i) => i !== pIdx))}
                    >
                      <Trash2 size={12} style={{ color: '#f87171' }} aria-hidden="true" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={proj.technologies.join(', ')}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[pIdx].technologies = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                      setProjects(updated);
                    }}
                    placeholder="Technologies (e.g. React, FastAPI, PostgreSQL)"
                    style={{
                      padding: '0.35rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.775rem',
                    }}
                  />

                  <input
                    type="text"
                    value={proj.link || ''}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[pIdx].link = e.target.value;
                      setProjects(updated);
                    }}
                    placeholder="Repository or Demo Link (Optional)"
                    style={{
                      padding: '0.35rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.775rem',
                    }}
                  />

                  <textarea
                    value={proj.description || ''}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[pIdx].description = e.target.value;
                      setProjects(updated);
                    }}
                    placeholder="Brief description of the project purpose..."
                    rows={2}
                    style={{
                      padding: '0.35rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.775rem',
                    }}
                  />

                  {/* Contributions */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                        Key Technical Contributions:
                      </span>
                      <button
                        type="button"
                        style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => {
                          const updated = [...projects];
                          updated[pIdx].contributions.push('Implemented automated test coverage and deployments.');
                          setProjects(updated);
                        }}
                      >
                        + Add Bullet
                      </button>
                    </div>

                    {proj.contributions.map((contrib, cIdx) => (
                      <div key={cIdx} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem' }}>
                        <input
                          type="text"
                          value={contrib}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[pIdx].contributions[cIdx] = e.target.value;
                            setProjects(updated);
                          }}
                          placeholder="e.g. Built automated streaming pipeline with Redis..."
                          style={{
                            flex: 1,
                            padding: '0.35rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.775rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...projects];
                            updated[pIdx].contributions = updated[pIdx].contributions.filter((_, i) => i !== cIdx);
                            setProjects(updated);
                          }}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 0.25rem' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: EDUCATION */}
          {activeEditorTab === 'education' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={16} style={{ color: '#ec4899' }} aria-hidden="true" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Education & Academics
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setEducation([
                      ...education,
                      {
                        institution: 'State University',
                        degree: 'M.S. in Software Engineering',
                        start_date: '2020',
                        end_date: '2022',
                      },
                    ])
                  }
                >
                  <Plus size={12} aria-hidden="true" />
                  <span>Add Degree</span>
                </button>
              </div>

              {education.map((edu, edIdx) => (
                <div
                  key={edIdx}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ec4899' }}>
                      Degree #{edIdx + 1}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEducation(education.filter((_, i) => i !== edIdx))}
                    >
                      <Trash2 size={12} style={{ color: '#f87171' }} aria-hidden="true" />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[edIdx].degree = e.target.value;
                        setEducation(updated);
                      }}
                      placeholder="Degree / Qualification"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[edIdx].institution = e.target.value;
                        setEducation(updated);
                      }}
                      placeholder="Institution / University"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={edu.start_date || ''}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[edIdx].start_date = e.target.value;
                        setEducation(updated);
                      }}
                      placeholder="Start (e.g. 2015)"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                    <input
                      type="text"
                      value={edu.end_date || ''}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[edIdx].end_date = e.target.value;
                        setEducation(updated);
                      }}
                      placeholder="End (e.g. 2019)"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                    <input
                      type="text"
                      value={edu.gpa_or_honors || ''}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[edIdx].gpa_or_honors = e.target.value;
                        setEducation(updated);
                      }}
                      placeholder="GPA / Honors (Optional)"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: CERTIFICATIONS & ACHIEVEMENTS */}
          {activeEditorTab === 'certifications' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} style={{ color: '#fbbf24' }} aria-hidden="true" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Certifications & Achievements
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setCertifications([
                      ...certifications,
                      {
                        name: 'Kubernetes Certified Administrator (CKA)',
                        issuer: 'CNCF / Linux Foundation',
                        date: '2024',
                      },
                    ])
                  }
                >
                  <Plus size={12} aria-hidden="true" />
                  <span>Add Cert</span>
                </button>
              </div>

              {certifications.map((cert, cIdx) => (
                <div
                  key={cIdx}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => {
                        const updated = [...certifications];
                        updated[cIdx].name = e.target.value;
                        setCertifications(updated);
                      }}
                      placeholder="Certificate / Award Name"
                      style={{
                        padding: '0.4rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        width: '75%',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setCertifications(certifications.filter((_, i) => i !== cIdx))}
                    >
                      <Trash2 size={12} style={{ color: '#f87171' }} aria-hidden="true" />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={cert.issuer || ''}
                      onChange={(e) => {
                        const updated = [...certifications];
                        updated[cIdx].issuer = e.target.value;
                        setCertifications(updated);
                      }}
                      placeholder="Issuing Authority"
                      style={{
                        padding: '0.35rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                    <input
                      type="text"
                      value={cert.date || ''}
                      onChange={(e) => {
                        const updated = [...certifications];
                        updated[cIdx].date = e.target.value;
                        setCertifications(updated);
                      }}
                      placeholder="Issue Date"
                      style={{
                        padding: '0.35rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: OPTIONAL & CUSTOM SECTIONS */}
          {activeEditorTab === 'custom' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} style={{ color: '#10b981' }} aria-hidden="true" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Optional Additional Sections ({customSections.length})
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setCustomSections([
                      ...customSections,
                      {
                        title: 'Languages & Activities',
                        items: ['English (Native)', 'Spanish (Professional working proficiency)'],
                      },
                    ]);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  <Plus size={12} aria-hidden="true" />
                  <span>Add Section</span>
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Add arbitrary optional sections such as spoken languages, publications, volunteer experience, leadership, or hobbies.
              </p>

              {customSections.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  No optional sections added yet. Click &quot;Add Section&quot; above to include custom categories like Languages or Extracurriculars.
                </div>
              )}

              {customSections.map((sec, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const updated = [...customSections];
                        updated[sIdx].title = e.target.value;
                        setCustomSections(updated);
                      }}
                      placeholder="Section Title (e.g. Languages or Volunteer Work)"
                      style={{
                        flex: 1,
                        padding: '0.4rem',
                        fontWeight: 600,
                        background: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setCustomSections(customSections.filter((_, idx) => idx !== sIdx));
                      }}
                      title="Remove Section"
                      style={{ padding: '0.3rem 0.5rem' }}
                    >
                      <Trash2 size={12} style={{ color: '#f87171' }} aria-hidden="true" />
                    </button>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Bullet Points ({sec.items?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...customSections];
                          updated[sIdx].items = [...(updated[sIdx].items || []), ''];
                          setCustomSections(updated);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#818cf8',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <Plus size={10} /> Add Bullet
                      </button>
                    </div>

                    {(sec.items || []).map((item, itmIdx) => (
                      <div key={itmIdx} style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.3rem' }}>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...customSections];
                            const newItems = [...(updated[sIdx].items || [])];
                            newItems[itmIdx] = e.target.value;
                            updated[sIdx].items = newItems;
                            setCustomSections(updated);
                          }}
                          placeholder={`Bullet item #${itmIdx + 1}`}
                          style={{
                            flex: 1,
                            padding: '0.3rem 0.5rem',
                            background: 'var(--bg-main)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...customSections];
                            const newItems = (updated[sIdx].items || []).filter((_, i) => i !== itmIdx);
                            updated[sIdx].items = newItems;
                            setCustomSections(updated);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: '0 0.25rem',
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: LIVE WYSIWYG RESUME PREVIEW                */}
        {/* ======================================================== */}
        <div
          style={{
            display: mobileView === 'editor' ? undefined : 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
          className={mobileView === 'editor' ? 'hide-mobile' : ''}
        >
          {/* Preview Panel Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={15} style={{ color: '#38bdf8' }} aria-hidden="true" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Live Document Preview ({templateId === 'classic_professional' ? 'Classic ATS' : 'Modern Technical'})
              </span>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.675rem' }}>
              Real-time Render
            </span>
          </div>

          {/* Document Sheet Container (Stylized Paper Replica) */}
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 'var(--radius-md)',
              padding: '2.25rem 2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              fontFamily: templateId === 'classic_professional' ? "Times New Roman, Georgia, 'Nimbus Roman', serif" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              minHeight: '680px',
              fontSize: '0.85rem',
              lineHeight: 1.45,
            }}
            id="resume-live-preview-sheet"
          >
            {/* TEMPLATE 1: CLASSIC PROFESSIONAL LAYOUT */}
            {templateId === 'classic_professional' ? (
              <div>
                {/* Centered Formal Header */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#111827', letterSpacing: '0.5px' }}>
                    {personalInfo.full_name || 'Your Name'}
                  </h1>
                  {personalInfo.title && (
                    <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#4b5563', marginBottom: '0.35rem' }}>
                      {personalInfo.title}
                    </div>
                  )}
                  <div style={{ fontSize: '0.775rem', color: '#4b5563', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {personalInfo.email && <span>{personalInfo.email}</span>}
                    {personalInfo.phone && <span>| {personalInfo.phone}</span>}
                    {personalInfo.location && <span>| {personalInfo.location}</span>}
                    {personalInfo.linkedin && <span>| {personalInfo.linkedin}</span>}
                    {personalInfo.github && <span>| {personalInfo.github}</span>}
                    {personalInfo.portfolio && <span>| {personalInfo.portfolio}</span>}
                  </div>
                  <div style={{ borderBottom: '1.5px solid #1f2937', marginTop: '0.625rem' }} />
                </div>

                {/* Summary */}
                {summary && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#111827', borderBottom: '0.5px solid #9ca3af', paddingBottom: '0.15rem', marginBottom: '0.35rem' }}>
                      Professional Summary
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#1f2937' }}>{summary}</p>
                  </div>
                )}

                {/* Technical Skills */}
                {skillGroups.length > 0 && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#111827', borderBottom: '0.5px solid #9ca3af', paddingBottom: '0.15rem', marginBottom: '0.35rem' }}>
                      Technical Skills
                    </div>
                    {skillGroups.map((sg, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        <strong>{sg.category}: </strong>
                        <span>{sg.skills.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experience */}
                {experience.length > 0 && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#111827', borderBottom: '0.5px solid #9ca3af', paddingBottom: '0.15rem', marginBottom: '0.35rem' }}>
                      Work Experience
                    </div>
                    {experience.map((exp, i) => (
                      <div key={i} style={{ marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                          <span>
                            <strong>{exp.role}</strong> — <em>{exp.organization}</em> {exp.location ? `(${exp.location})` : ''}
                          </span>
                          <span style={{ color: '#4b5563', fontSize: '0.775rem' }}>
                            {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                          </span>
                        </div>
                        <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.775rem', color: '#1f2937' }}>
                          {exp.responsibilities.map((resp, rI) => (
                            <li key={rI}>{resp}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#111827', borderBottom: '0.5px solid #9ca3af', paddingBottom: '0.15rem', marginBottom: '0.35rem' }}>
                      Key Projects
                    </div>
                    {projects.map((proj, i) => (
                      <div key={i} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.825rem' }}>
                          <strong>{proj.title}</strong>
                          {proj.technologies.length > 0 && (
                            <span style={{ color: '#4b5563' }}> [{proj.technologies.join(', ')}]</span>
                          )}
                          {proj.link && (
                            <span style={{ color: '#2563eb', fontSize: '0.75rem' }}> — {proj.link}</span>
                          )}
                        </div>
                        {proj.description && <p style={{ margin: '0.15rem 0', fontSize: '0.775rem' }}>{proj.description}</p>}
                        <ul style={{ margin: '0.2rem 0 0 1.25rem', padding: 0, fontSize: '0.775rem' }}>
                          {proj.contributions.map((c, cI) => (
                            <li key={cI}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {education.length > 0 && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#111827', borderBottom: '0.5px solid #9ca3af', paddingBottom: '0.15rem', marginBottom: '0.35rem' }}>
                      Education & Academics
                    </div>
                    {education.map((edu, i) => (
                      <div key={i} style={{ marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                          <span>
                            <strong>{edu.degree}</strong> — {edu.institution}
                          </span>
                          <span style={{ color: '#4b5563', fontSize: '0.775rem' }}>
                            {edu.start_date} - {edu.end_date}
                          </span>
                        </div>
                        {edu.gpa_or_honors && <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>Honors/GPA: {edu.gpa_or_honors}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#111827', borderBottom: '0.5px solid #9ca3af', paddingBottom: '0.15rem', marginBottom: '0.35rem' }}>
                      Certifications & Awards
                    </div>
                    <ul style={{ margin: '0 0 0 1.25rem', padding: 0, fontSize: '0.775rem' }}>
                      {certifications.map((c, i) => (
                        <li key={i}>
                          <strong>{c.name}</strong> {c.issuer ? `— ${c.issuer}` : ''} {c.date ? `(${c.date})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Custom Sections */}
                {customSections.length > 0 &&
                  customSections.map((sec, i) => (
                    <div key={i} style={{ marginBottom: '0.875rem' }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#111827',
                          borderBottom: '0.5px solid #9ca3af',
                          paddingBottom: '0.15rem',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {sec.title}
                      </div>
                      {sec.items && sec.items.length > 0 && (
                        <ul style={{ margin: '0.2rem 0 0 1.25rem', padding: 0, fontSize: '0.775rem' }}>
                          {sec.items.map((itm, itmIdx) => (
                            <li key={itmIdx}>{itm}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              /* TEMPLATE 2: MODERN TECHNICAL LAYOUT */
              <div>
                {/* Modern Left-Aligned Technical Header */}
                <div style={{ borderLeft: '4px solid #2563eb', paddingLeft: '1rem', marginBottom: '1.25rem' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#1e3a8a', letterSpacing: '-0.25px' }}>
                    {personalInfo.full_name || 'Your Name'}
                  </h1>
                  {personalInfo.title && (
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2563eb', marginTop: '0.2rem' }}>
                      {personalInfo.title}
                    </div>
                  )}
                  <div style={{ fontSize: '0.775rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.35rem' }}>
                    {personalInfo.email && <span>✉ {personalInfo.email}</span>}
                    {personalInfo.phone && <span>☎ {personalInfo.phone}</span>}
                    {personalInfo.location && <span>📍 {personalInfo.location}</span>}
                    {personalInfo.linkedin && <span>🔗 {personalInfo.linkedin}</span>}
                    {personalInfo.github && <span>💻 {personalInfo.github}</span>}
                  </div>
                </div>

                {/* Summary */}
                {summary && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '2px solid #2563eb', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                      Professional Profile
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.45 }}>{summary}</p>
                  </div>
                )}

                {/* Technical Competencies */}
                {skillGroups.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '2px solid #2563eb', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                      Technical Competencies
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                      {skillGroups.map((sg, i) => (
                        <div key={i} style={{ background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.775rem' }}>
                          <strong style={{ color: '#1e40af' }}>{sg.category}: </strong>
                          <span style={{ color: '#334155' }}>{sg.skills.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engineering Experience */}
                {experience.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '2px solid #2563eb', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                      Engineering Experience
                    </div>
                    {experience.map((exp, i) => (
                      <div key={i} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.825rem' }}>
                          <span>
                            <strong style={{ color: '#0f172a' }}>{exp.role}</strong> <span style={{ color: '#2563eb' }}>@ {exp.organization}</span> {exp.location ? `· ${exp.location}` : ''}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                            {exp.start_date} – {exp.current ? 'Present' : exp.end_date}
                          </span>
                        </div>
                        <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.775rem', color: '#334155' }}>
                          {exp.responsibilities.map((resp, rI) => (
                            <li key={rI}>{resp}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Projects */}
                {projects.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '2px solid #2563eb', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                      Engineering Projects
                    </div>
                    {projects.map((proj, i) => (
                      <div key={i} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.825rem' }}>
                          <strong style={{ color: '#0f172a' }}>{proj.title}</strong>
                          {proj.technologies.length > 0 && (
                            <span style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 600 }}> [{proj.technologies.join(' · ')}]</span>
                          )}
                          {proj.link && (
                            <span style={{ color: '#64748b', fontSize: '0.725rem' }}> — {proj.link}</span>
                          )}
                        </div>
                        {proj.description && <p style={{ margin: '0.15rem 0', fontSize: '0.775rem', color: '#334155' }}>{proj.description}</p>}
                        <ul style={{ margin: '0.2rem 0 0 1.25rem', padding: 0, fontSize: '0.775rem', color: '#334155' }}>
                          {proj.contributions.map((c, cI) => (
                            <li key={cI}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {education.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '2px solid #2563eb', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                      Education
                    </div>
                    {education.map((edu, i) => (
                      <div key={i} style={{ marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                          <span>
                            <strong>{edu.degree}</strong> · <span style={{ color: '#475569' }}>{edu.institution}</span>
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            {edu.start_date} – {edu.end_date}
                          </span>
                        </div>
                        {edu.gpa_or_honors && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{edu.gpa_or_honors}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '2px solid #2563eb', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                      Certifications
                    </div>
                    <ul style={{ margin: '0 0 0 1.25rem', padding: 0, fontSize: '0.775rem', color: '#334155' }}>
                      {certifications.map((c, i) => (
                        <li key={i}>
                          <strong>{c.name}</strong> {c.issuer ? `(${c.issuer})` : ''} {c.date ? `· ${c.date}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Custom Sections */}
                {customSections.length > 0 &&
                  customSections.map((sec, i) => (
                    <div key={i} style={{ marginBottom: '1rem' }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: '#1e3a8a',
                          borderBottom: '2px solid #2563eb',
                          paddingBottom: '0.2rem',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {sec.title}
                      </div>
                      {sec.items && sec.items.length > 0 && (
                        <ul style={{ margin: '0.2rem 0 0 1.25rem', padding: 0, fontSize: '0.775rem', color: '#334155' }}>
                          {sec.items.map((itm, itmIdx) => (
                            <li key={itmIdx}>{itm}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
