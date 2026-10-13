import React from 'react';
import {
  FileSearch,
  Building2,
  Code2,
  History,
  FileText,
  Home,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { PortalSectionId } from '../types';

interface HomePortfolioProps {
  onNavigate: (section: PortalSectionId) => void;
}

interface SectionCard {
  id: PortalSectionId;
  title: string;
  badge: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
}

export const HomePortfolio: React.FC<HomePortfolioProps> = ({ onNavigate }) => {
  const sections: SectionCard[] = [
    {
      id: 'home',
      title: 'Home',
      badge: 'Section 1',
      description: 'Central overview of your career preparation workspace, portal navigation, and available tools.',
      highlights: ['Portal Dashboard', 'Workspace Index', 'Quick Launch'],
      icon: <Home size={20} style={{ color: '#818cf8' }} aria-hidden="true" />,
    },
    {
      id: 'resume-parser',
      title: 'Resume Parser',
      badge: 'Section 2',
      description: 'Upload PDF or Word resumes to extract your verified skills, experience history, and audit ATS compliance.',
      highlights: ['ATS Health Score', 'Key Skills Extracted', 'Formatting Audit'],
      icon: <FileSearch size={20} style={{ color: '#38bdf8' }} aria-hidden="true" />,
    },
    {
      id: 'company-details',
      title: 'Company Details',
      badge: 'Section 3',
      description: 'Explore 52 top engineering companies, inspect their hiring stages, and match your candidate profile.',
      highlights: ['52 Employer Profiles', 'Hiring Requirements', 'Job Role Fit'],
      icon: <Building2 size={20} style={{ color: '#a78bfa' }} aria-hidden="true" />,
    },
    {
      id: 'interview-prep',
      title: 'Interview Preparation',
      badge: 'Section 4',
      description: 'Practice coding interview challenges, rehearse webcam video responses, and drill company questions.',
      highlights: ['Coding Challenges', 'Behavioral STAR Drills', 'Company Questions'],
      icon: <Code2 size={20} style={{ color: '#f59e0b' }} aria-hidden="true" />,
    },
    {
      id: 'preparation-records',
      title: 'Preparation Records',
      badge: 'Section 5',
      description: 'Review saved practice logs, test submissions, video recording notes, and performance evaluations.',
      highlights: ['Saved Practice Logs', 'Activity History', 'Progress Analytics'],
      icon: <History size={20} style={{ color: '#10b981' }} aria-hidden="true" />,
    },
    {
      id: 'resume-generator',
      title: 'Resume Generator',
      badge: 'Section 6',
      description: 'Create customized ATS-friendly resumes with live preview and instant download in PDF and Word DOCX formats.',
      highlights: ['ATS-Ready Templates', 'Live Document Preview', 'PDF & DOCX Export'],
      icon: <FileText size={20} style={{ color: '#ec4899' }} aria-hidden="true" />,
    },
  ];

  return (
    <div id="section-home-portfolio" role="tabpanel" aria-labelledby="nav-item-home">
      {/* Modern Split Hero Banner */}
      <div className="section-header">
        <div className="section-header-split">
          <div className="section-header-left">
            <div className="section-eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              <span>Career Preparation & Intelligence Portal</span>
            </div>
            <h1 className="section-title">CareerNova AI</h1>
            <p className="section-desc">
              All-in-one career acceleration website designed to help candidates land their dream jobs. Analyze and perfect your resume with instant ATS feedback, explore hiring trends across top tech companies, prepare with interactive technical and behavioral interview practice, and build job-winning resumes tailored to your career goals.
            </p>
            <div className="highlight-chips-row">
              <span className="highlight-chip">
                <CheckCircle2 size={12} color="#34d399" />
                <span>Instant ATS Resume Audit</span>
              </span>
              <span className="highlight-chip">
                <CheckCircle2 size={12} color="#34d399" />
                <span>Top Company Career Profiles</span>
              </span>
              <span className="highlight-chip">
                <CheckCircle2 size={12} color="#34d399" />
                <span>Mock Technical & Behavioral Drills</span>
              </span>
              <span className="highlight-chip">
                <CheckCircle2 size={12} color="#34d399" />
                <span>Job-Ready Resume Builder</span>
              </span>
            </div>
          </div>

          {/* Right Hero Stats Matrix Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              minWidth: '280px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Career Portal Hub
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>6 Modules</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Career Workspaces</div>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>Instant</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ATS Resume Audit</div>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>52 Companies</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Employer Directory</div>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>Interactive</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Interview Practice</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Six Section Navigation Cards */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Integrated Workspaces
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Select any module to open full workspace
          </span>
        </div>

        <div
          className="grid-cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
            width: '100%',
          }}
        >
          {sections.map((sec) => {
            const isCurrent = sec.id === 'home';
            return (
              <div
                key={sec.id}
                className="card"
                id={`home-card-${sec.id}`}
                style={{
                  cursor: isCurrent ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                  background: isCurrent ? 'rgba(30, 41, 59, 0.55)' : 'var(--bg-card)',
                  borderColor: isCurrent ? 'rgba(99, 102, 241, 0.45)' : 'var(--border-subtle)',
                }}
                onClick={() => {
                  if (!isCurrent) onNavigate(sec.id);
                }}
                role={isCurrent ? undefined : 'button'}
                tabIndex={isCurrent ? undefined : 0}
                onKeyDown={(e) => {
                  if (!isCurrent && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onNavigate(sec.id);
                  }
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }}
                      >
                        {sec.icon}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                          {sec.title}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {sec.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="card-p" style={{ fontSize: '0.85rem', lineHeight: 1.55, margin: '0 0 1rem 0' }}>
                    {sec.description}
                  </p>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {sec.highlights.map((h, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {isCurrent ? (
                    <span style={{ fontSize: '0.775rem', color: '#818cf8', fontWeight: 600 }}>
                      Current Overview
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>Launch Workspace</span>
                      <ArrowRight size={14} color="#818cf8" aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
