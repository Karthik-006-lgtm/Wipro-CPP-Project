import React from 'react';
import { PortalSectionId, BackendHealthResponse } from '../../types';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { GlobalAiAssistant } from '../assistant/GlobalAiAssistant';

interface AppLayoutProps {
  activeSection: PortalSectionId;
  onSelectSection: (id: PortalSectionId) => void;
  health: BackendHealthResponse | null;
  loadingHealth: boolean;
  onRefreshHealth: () => void;
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeSection,
  onSelectSection,
  health,
  loadingHealth,
  onRefreshHealth,
  isAssistantOpen,
  onToggleAssistant,
  children,
}) => {
  return (
    <div className="app-shell" id="app-root-shell">
      <Header
        health={health}
        loadingHealth={loadingHealth}
        onRefreshHealth={onRefreshHealth}
        onToggleAssistant={onToggleAssistant}
        onNavigateHome={() => onSelectSection('home')}
      />
      <Navigation
        activeSection={activeSection}
        onSelectSection={onSelectSection}
      />
      <main className="portal-main" id="portal-main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />

      {/* Global AI Assistant Drawer & Persistent Trigger */}
      <GlobalAiAssistant
        isOpen={isAssistantOpen}
        onClose={onToggleAssistant}
        activeSection={activeSection}
        health={health}
      />
    </div>
  );
};
