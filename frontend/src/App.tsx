import React, { useState, useEffect, useCallback } from 'react';
import { PortalSectionId, BackendHealthResponse } from './types';
import { apiClient } from './api/client';
import { AppLayout } from './components/layout/AppLayout';
import { HomePortfolio } from './pages/HomePortfolio';
import { ResumeParser } from './pages/ResumeParser';
import { CompanyDetails } from './pages/CompanyDetails';
import { InterviewPrep } from './pages/InterviewPrep';
import { PreparationRecords } from './pages/PreparationRecords';
import { ResumeGenerator } from './pages/ResumeGenerator';

import { AuthModal } from './components/auth/AuthModal';
import { UserProfileDashboard } from './components/profile/UserProfileDashboard';

const VALID_SECTIONS: PortalSectionId[] = [
  'home',
  'resume-parser',
  'company-details',
  'interview-prep',
  'preparation-records',
  'resume-generator',
];

const getSectionFromHash = (): PortalSectionId => {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (VALID_SECTIONS.includes(hash as PortalSectionId)) {
    return hash as PortalSectionId;
  }
  return 'home';
};

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<PortalSectionId>(getSectionFromHash());
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Sync section changes to browser URL hash for browser history & direct links
  const handleSelectSection = useCallback((section: PortalSectionId) => {
    setActiveSection(section);
    if (window.location.hash !== `#${section}`) {
      window.history.pushState(null, '', `#${section}`);
    }
    // Scroll smoothly to top of main content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back/Forward (hashchange / popstate)
  useEffect(() => {
    const handleHashChange = () => {
      const section = getSectionFromHash();
      setActiveSection(section);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Backend Health Integration
  const fetchBackendHealth = useCallback(async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const response = await apiClient.getHealth();
      setHealth(response);
    } catch (err: any) {
      setHealth(null);
      setHealthError(err?.message || 'Could not communicate with FastAPI backend.');
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendHealth();
  }, [fetchBackendHealth]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomePortfolio onNavigate={handleSelectSection} />;
      case 'resume-parser':
        return <ResumeParser onNavigate={handleSelectSection} />;
      case 'company-details':
        return <CompanyDetails onNavigate={handleSelectSection} />;
      case 'interview-prep':
        return <InterviewPrep onNavigate={handleSelectSection} />;
      case 'preparation-records':
        return <PreparationRecords onNavigate={handleSelectSection} />;
      case 'resume-generator':
        return <ResumeGenerator />;
      default:
        return <HomePortfolio onNavigate={handleSelectSection} />;
    }
  };

  return (
    <AppLayout
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      health={health}
      loadingHealth={loadingHealth}
      onRefreshHealth={fetchBackendHealth}
      isAssistantOpen={isAssistantOpen}
      onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
    >
      {healthError && (
        <div
          id="api-connection-alert"
          role="alert"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: '#fca5a5',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <strong>Backend API Connectivity Notice:</strong> {healthError}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchBackendHealth}
            disabled={loadingHealth}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            {loadingHealth ? 'Checking...' : 'Retry Connection'}
          </button>
        </div>
      )}

      {renderActiveSection()}

      {/* Global Modals for Authentication and Activity Insights */}
      <AuthModal />
      <UserProfileDashboard onNavigateSection={handleSelectSection} />
    </AppLayout>
  );
};

export default App;
