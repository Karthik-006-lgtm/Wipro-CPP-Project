import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Search,
  X,
  Compass,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Briefcase,
  MapPin,
  Award,
  RotateCcw,
  Sparkles,
  Globe,
  ExternalLink,
  Info,
} from 'lucide-react';
import { CompanyProfile, PortalSectionId } from '../types';
import { apiClient } from '../api/client';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';

interface CompanyDetailsProps {
  onNavigate?: (section: PortalSectionId) => void;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({ onNavigate }) => {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [isMatchMode, setIsMatchMode] = useState<boolean>(false);
  const [selectedCompanyForModal, setSelectedCompanyForModal] = useState<CompanyProfile | null>(null);

  // Load explicitly stored candidate skills from Resume Parser
  const loadStoredSkills = useCallback((): string[] => {
    try {
      const explicitSkills = sessionStorage.getItem('matchCandidateSkills');
      if (explicitSkills) {
        const parsed = JSON.parse(explicitSkills);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  }, []);

  // Fetch verified catalogue or matched catalogue
  const fetchCompanies = useCallback(async (query: string = '', skillsToMatch: string[] = []) => {
    setLoading(true);
    setError(null);
    try {
      if (skillsToMatch.length > 0 && !query.trim()) {
        const matchRes = await apiClient.matchCompanies(skillsToMatch);
        const rawMatches = matchRes.matches || matchRes.items || [];
        const mapped: CompanyProfile[] = rawMatches.map((m) => ({
          ...m.company,
          match_score: m.match_score ?? m.match_percentage,
          matched_skills: m.matched_skills || [],
          missing_skills: m.missing_skills || [],
        }));
        setCompanies(mapped);
        setIsMatchMode(true);
      } else {
        const listRes = await apiClient.getCompanies(query.trim() || undefined);
        const rawList = listRes.companies || listRes.items || [];
        if (skillsToMatch.length > 0) {
          const lowerCandidate = new Set(skillsToMatch.map((s) => s.toLowerCase()));
          const scored = rawList.map((c) => {
            const techList = c.tech_stack || [];
            const matched = techList.filter((t) => lowerCandidate.has(t.toLowerCase()));
            const missing = techList.filter((t) => !lowerCandidate.has(t.toLowerCase()));
            const score = techList.length > 0 ? Math.round((matched.length / techList.length) * 100) : 0;
            return {
              ...c,
              match_score: score,
              matched_skills: matched,
              missing_skills: missing,
            };
          });
          // If in match mode, sort by score descending
          scored.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
          setCompanies(scored);
          setIsMatchMode(true);
        } else {
          setCompanies(rawList);
          setIsMatchMode(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve company directory from backend.');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: checks if explicit match skills exist
  useEffect(() => {
    const skills = loadStoredSkills();
    setCandidateSkills(skills);
    fetchCompanies('', skills);
  }, [fetchCompanies, loadStoredSkills]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCompanyForModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(searchQuery, candidateSkills);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchCompanies('', candidateSkills);
  };

  const handleClearSkillFilter = () => {
    sessionStorage.removeItem('matchCandidateSkills');
    setCandidateSkills([]);
    setIsMatchMode(false);
    fetchCompanies(searchQuery, []);
  };

  const handleViewAllCompaniesDirectly = () => {
    sessionStorage.removeItem('matchCandidateSkills');
    setCandidateSkills([]);
    setIsMatchMode(false);
    setSearchQuery('');
    fetchCompanies('', []);
  };

  const handlePrepareForCompany = (company: CompanyProfile) => {
    try {
      const roles = company.roles || company.open_roles || [];
      sessionStorage.setItem('selectedInterviewCompany', company.name);
      sessionStorage.setItem('selectedInterviewRole', roles[0] || 'Software Engineer');
      sessionStorage.setItem('selectedCompanyStack', JSON.stringify(company.tech_stack || []));
    } catch {
      // Ignore storage errors
    }
    setSelectedCompanyForModal(null);
    if (onNavigate) {
      onNavigate('interview-prep');
    } else {
      window.location.hash = '#interview-prep';
    }
  };

  return (
    <div id="section-company-details" role="tabpanel" aria-labelledby="nav-item-company-details">
      {/* Header */}
      <div className="section-header">
        <div className="section-eyebrow">
          <Building2 size={14} aria-hidden="true" />
          <span>Verified Employer Directory & Skill Matching</span>
        </div>
        <h2 className="section-title">Company Profiles & Interview Preparation</h2>
        <p className="section-desc">
          Browse verified technical employers, match your competencies directly from your parsed resume, and launch company-specific interview drills tailored to verified hiring loops.
        </p>
      </div>

      {/* Candidate Skill Match Banner */}
      {isMatchMode && candidateSkills.length > 0 ? (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a5b4fc',
              }}
            >
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#e0e7ff' }}>
                Active Resume Skill Alignment ({candidateSkills.length} skills detected)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc', marginTop: '0.15rem' }}>
                Showing matching employers sorted by technical stack compatibility: {candidateSkills.slice(0, 6).join(', ')}
                {candidateSkills.length > 6 ? ` +${candidateSkills.length - 6} more` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleViewAllCompaniesDirectly}
              style={{ fontSize: '0.75rem' }}
            >
              <Building2 size={12} aria-hidden="true" />
              <span>View All 50+ Companies</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearSkillFilter}
              style={{ fontSize: '0.75rem' }}
            >
              <RotateCcw size={12} aria-hidden="true" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            💡 <strong>Verified Catalogue:</strong> Viewing full directory of top tech & IT employers. Click any company card to inspect verified hiring stages, tech stacks, and start interview practice.
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => (onNavigate ? onNavigate('resume-parser') : (window.location.hash = '#resume-parser'))}
            style={{ fontSize: '0.75rem' }}
          >
            <span>Match With Resume Skills</span>
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Interactive Search Bar & Results Counter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              aria-hidden="true"
            />
            <input
              type="text"
              id="company-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all 50+ companies by name, tech stack (e.g. Python, Java), or industry..."
              style={{
                width: '100%',
                padding: '0.6875rem 2.5rem 0.6875rem 2.5rem',
                background: 'rgba(30, 41, 59, 0.75)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
              aria-label="Search verified target companies"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
                title="Clear search query"
                aria-label="Clear search query"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            id="search-company-btn"
          >
            <span>Search</span>
          </button>
        </form>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
          Showing <strong>{companies.length}</strong> verified employers
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            marginBottom: '1.5rem',
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
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ margin: '3rem 0' }}>
          <LoadingSpinner message="Querying verified employer catalogue and computing skill alignment..." />
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          id="company-search-empty-results"
          icon={<Compass size={28} aria-hidden="true" />}
          title={`No verified records found for "${searchQuery}"`}
          description="Try searching for another technology (e.g. Python, Java, TypeScript), industry, or clear the search to view all verified employers."
          actionText="View All 50+ Companies"
          onAction={handleClearSearch}
        />
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {companies.map((company) => {
            const hasScore = company.match_score !== undefined;
            const score = company.match_score || 0;
            const scoreColor = score >= 60 ? '#34d399' : score >= 30 ? '#fbbf24' : '#94a3b8';
            const roles = company.roles || company.open_roles || [];
            const companySlug = company.slug || company.id;

            return (
              <div
                key={company.id}
                className="card"
                onClick={() => setSelectedCompanyForModal(company)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.35rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                  position: 'relative',
                }}
                title={`Click to view detailed profile for ${company.name}`}
              >
                <div>
                  {/* Card Header: Name, Location, Match Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} style={{ color: '#818cf8' }} aria-hidden="true" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                          {company.name}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Briefcase size={12} aria-hidden="true" />
                          {company.industry}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} aria-hidden="true" />
                          {company.location}
                        </span>
                      </div>
                    </div>

                    {hasScore && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: `1px solid ${scoreColor}40`,
                        }}
                        title={`Resume match score: ${score}%`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Award size={13} style={{ color: scoreColor }} aria-hidden="true" />
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: scoreColor }}>
                            {score}%
                          </span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                          Match Fit
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0.625rem 0' }}>
                    {company.description}
                  </p>

                  {/* Tech Stack Preview */}
                  <div style={{ margin: '0.75rem 0' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Technology Stack:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {(company.tech_stack || []).slice(0, 6).map((tech) => {
                        const isMatched = company.matched_skills?.some((s) => s.toLowerCase() === tech.toLowerCase());
                        return (
                          <span
                            key={tech}
                            className={`badge ${isMatched ? 'badge-success' : 'badge-neutral'}`}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            {isMatched && <CheckCircle2 size={10} aria-hidden="true" />}
                            {tech}
                          </span>
                        );
                      })}
                      {(company.tech_stack || []).length > 6 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                          +{(company.tech_stack || []).length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Target Roles */}
                  {roles.length > 0 && (
                    <div style={{ margin: '0.75rem 0' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Typical Roles:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {roles.slice(0, 3).map((role) => (
                          <span
                            key={role}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(99, 102, 241, 0.12)',
                              color: '#c7d2fe',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                            }}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedCompanyForModal(company)}
                    style={{ flex: 1, fontSize: '0.775rem', justifyContent: 'center' }}
                  >
                    <Info size={13} aria-hidden="true" />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handlePrepareForCompany(company)}
                    id={`prepare-for-${companySlug}-btn`}
                    style={{
                      flex: 1.3,
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                    }}
                  >
                    <GraduationCap size={14} aria-hidden="true" />
                    <span>Interview Drills</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Employer Ecosystem Summary Footer */}
      <div
        style={{
          marginTop: '2.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '780px' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            52 Verified Enterprise & Big Tech Employers Active
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Profiles include verified engineering technology stacks, hiring evaluation stages, glassdoor-style salary indicators, and targeted behavioral rubrics. Click <strong>Interview Drills</strong> on any company to launch tailored practice.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-info" style={{ padding: '0.4rem 0.85rem' }}>
            Big Tech & FAANG
          </span>
          <span className="badge badge-success" style={{ padding: '0.4rem 0.85rem' }}>
            Tier-1 Global MNCs
          </span>
          <span className="badge badge-neutral" style={{ padding: '0.4rem 0.85rem' }}>
            Fast-Growth SaaS
          </span>
        </div>
      </div>

      {/* Detailed Company Inspection Modal */}
      {selectedCompanyForModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="company-modal-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedCompanyForModal(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              background: '#0d1322',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={24} style={{ color: '#818cf8' }} aria-hidden="true" />
                  <h3 id="company-modal-title" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {selectedCompanyForModal.name}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Briefcase size={13} aria-hidden="true" />
                    {selectedCompanyForModal.industry}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={13} aria-hidden="true" />
                    {selectedCompanyForModal.location}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCompanyForModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Official Website Link */}
            {selectedCompanyForModal.website && (
              <div style={{ marginBottom: '1.25rem' }}>
                <a
                  href={selectedCompanyForModal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.775rem',
                    color: '#93c5fd',
                    textDecoration: 'none',
                  }}
                >
                  <Globe size={13} aria-hidden="true" />
                  <span>Official Careers Website ({selectedCompanyForModal.website.replace(/^https?:\/\//, '')})</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
            )}

            {/* Detailed Description */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Company Overview & Engineering Focus
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                {selectedCompanyForModal.description}
              </p>
            </div>

            {/* Complete Tech Stack */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Verified Technology Stack
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(selectedCompanyForModal.tech_stack || []).map((tech) => {
                  const isMatched = selectedCompanyForModal.matched_skills?.some((s) => s.toLowerCase() === tech.toLowerCase());
                  return (
                    <span
                      key={tech}
                      className={`badge ${isMatched ? 'badge-success' : 'badge-neutral'}`}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.55rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      {isMatched && <CheckCircle2 size={11} aria-hidden="true" />}
                      {tech}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Typical Roles */}
            {(selectedCompanyForModal.roles || selectedCompanyForModal.open_roles || []).length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Engineering Roles Hired For
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(selectedCompanyForModal.roles || selectedCompanyForModal.open_roles || []).map((role) => (
                    <span
                      key={role}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#c7d2fe',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-Step Interview Loop */}
            {(selectedCompanyForModal.interview_stages || []).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Standard Interview Stages & Evaluation Loops
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(selectedCompanyForModal.interview_stages || []).map((stage, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'rgba(99, 102, 241, 0.25)',
                          color: '#c7d2fe',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedCompanyForModal(null)}
              >
                <span>Close</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handlePrepareForCompany(selectedCompanyForModal)}
                style={{ gap: '0.4rem' }}
              >
                <GraduationCap size={16} aria-hidden="true" />
                <span>Prepare for Interview with {selectedCompanyForModal.name}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
