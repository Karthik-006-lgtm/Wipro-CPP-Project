import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { apiClient, setAuthToken, getAuthToken } from '../api/client';

export type AuthModalMode = 'login' | 'signup' | 'forgot' | 'reset';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; full_name: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserInState: (updated: User) => void;

  // Modal controls
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  prefilledEmail: string;
  prefilledResetToken: string;
  openAuthModal: (mode?: AuthModalMode, email?: string, resetToken?: string) => void;
  closeAuthModal: () => void;

  isDetailsModalOpen: boolean;
  openDetailsModal: () => void;
  closeDetailsModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal visibility states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [prefilledEmail, setPrefilledEmail] = useState<string>('');
  const [prefilledResetToken, setPrefilledResetToken] = useState<string>('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Verify and hydrate session on initial load
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      const existingToken = getAuthToken();
      if (!existingToken) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const currentUser = await apiClient.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setTokenState(existingToken);
        }
      } catch (err: any) {
        // If unauthorized or token invalid, clear
        if (err?.status === 401) {
          setAuthToken(null);
          if (isMounted) {
            setUser(null);
            setTokenState(null);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const res: AuthResponse = await apiClient.loginUser(data);
    setAuthToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const register = async (data: { email: string; full_name: string; password: string }): Promise<User> => {
    const res: AuthResponse = await apiClient.registerUser(data);
    // Note: User registration creates an initial session on backend,
    // but per requirements we also show the "Save details" confirmation popup
    // and can prefill the login form when they confirm.
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient.logoutUser();
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      setIsDetailsModalOpen(false);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const updated = await apiClient.getCurrentUser();
      setUser(updated);
    } catch {
      // Ignore
    }
  }, []);

  const updateUserInState = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  const openAuthModal = (
    mode: AuthModalMode = 'login',
    email: string = '',
    resetToken: string = ''
  ) => {
    setAuthModalMode(mode);
    setPrefilledEmail(email);
    setPrefilledResetToken(resetToken);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openDetailsModal = () => {
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUserInState,

        isAuthModalOpen,
        authModalMode,
        prefilledEmail,
        prefilledResetToken,
        openAuthModal,
        closeAuthModal,

        isDetailsModalOpen,
        openDetailsModal,
        closeDetailsModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
