import React from 'react';
import {
  Home,
  FileSearch,
  Building2,
  BrainCircuit,
  History,
  FileText,
} from 'lucide-react';
import { PortalSectionId, SectionMeta } from '../../types';

export const PORTAL_SECTIONS: SectionMeta[] = [
  {
    id: 'home',
    title: '1. Home',
    shortTitle: 'Home',
    description: 'Candidate career overview, module index, and preparation workflow guide.',
    badge: 'Overview',
  },
  {
    id: 'resume-parser',
    title: '2. Resume Parser',
    shortTitle: 'Resume Parser',
    description: 'Document ingest workflow, ATS formatting audit, and skill extraction layout.',
    badge: 'Analysis',
  },
  {
    id: 'company-details',
    title: '3. Company Details',
    shortTitle: 'Company Details',
    description: 'Target company matching, engineering stack discovery, and hiring profiles.',
    badge: 'Research',
  },
  {
    id: 'interview-prep',
    title: '4. Interview Preparation',
    shortTitle: 'Interview Prep',
    description: 'Adaptive technical coding, architecture drills, behavioral STAR, and video prep.',
    badge: 'Practice',
  },
  {
    id: 'preparation-records',
    title: '5. Preparation Records',
    shortTitle: 'Preparation Records',
    description: 'Audited log of practice sessions, evaluation scores, and time tracking.',
    badge: 'History',
  },
  {
    id: 'resume-generator',
    title: '6. Resume Generator',
    shortTitle: 'Resume Generator',
    description: 'Target role tailoring, ATS template selection, and export configuration.',
    badge: 'Builder',
  },
];

interface NavigationProps {
  activeSection: PortalSectionId;
  onSelectSection: (id: PortalSectionId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const getIcon = (id: PortalSectionId) => {
    switch (id) {
      case 'home':
        return <Home size={16} className="nav-icon" aria-hidden="true" />;
      case 'resume-parser':
        return <FileSearch size={16} className="nav-icon" aria-hidden="true" />;
      case 'company-details':
        return <Building2 size={16} className="nav-icon" aria-hidden="true" />;
      case 'interview-prep':
        return <BrainCircuit size={16} className="nav-icon" aria-hidden="true" />;
      case 'preparation-records':
        return <History size={16} className="nav-icon" aria-hidden="true" />;
      case 'resume-generator':
        return <FileText size={16} className="nav-icon" aria-hidden="true" />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % PORTAL_SECTIONS.length;
      onSelectSection(PORTAL_SECTIONS[nextIndex].id);
      const nextBtn = document.getElementById(`nav-item-${PORTAL_SECTIONS[nextIndex].id}`);
      nextBtn?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + PORTAL_SECTIONS.length) % PORTAL_SECTIONS.length;
      onSelectSection(PORTAL_SECTIONS[prevIndex].id);
      const prevBtn = document.getElementById(`nav-item-${PORTAL_SECTIONS[prevIndex].id}`);
      prevBtn?.focus();
    }
  };

  return (
    <nav className="portal-nav-bar" id="portal-navigation" aria-label="Portal Navigation">
      <div className="nav-container">
        <div className="nav-tabs-wrapper" role="tablist" aria-orientation="horizontal" style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
          {PORTAL_SECTIONS.map((section, idx) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                id={`nav-item-${section.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`section-${section.id}`}
                tabIndex={isActive ? 0 : -1}
                type="button"
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectSection(section.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
              >
                {getIcon(section.id)}
                <span>{section.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
