import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Sparkles,
  Check,
  Terminal,
  Cpu,
  Layers,
  ArrowLeft,
  Copy,
} from 'lucide-react';
import { useAuth, AuthModalMode } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    prefilledEmail,
    prefilledResetToken,
    closeAuthModal,
    login,
    register,
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>('login');

  // Form inputs
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateEmailNotice, setDuplicateEmailNotice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Sign up confirmation popup state
  const [signUpSuccessPopup, setSignUpSuccessPopup] = useState<{
    open: boolean;
    registeredEmail: string;
    registeredName: string;
  }>({ open: false, registeredEmail: '', registeredName: '' });

  // Forgot password token generated feedback
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setErrorMsg(null);
      setDuplicateEmailNotice(null);
      setSuccessMsg(null);
      setSignUpSuccessPopup({ open: false, registeredEmail: '', registeredName: '' });
      setDevResetToken(null);
      setTokenCopied(false);

      if (prefilledEmail) {
        setEmail(prefilledEmail);
      }
      if (prefilledResetToken) {
        setResetToken(prefilledResetToken);
      }
      setPassword('');
      setConfirmPassword('');
    }
  }, [isAuthModalOpen, authModalMode, prefilledEmail, prefilledResetToken]);

  // Compute password strength (1 to 4)
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#ef4444' };
      case 2:
        return { score: 2, label: 'Fair', color: '#f59e0b' };
      case 3:
        return { score: 3, label: 'Strong', color: '#38bdf8' };
      case 4:
        return { score: 4, label: 'Excellent', color: '#10b981' };
      default:
        return { score: 0, label: '', color: '' };
    }
  };

  const strength = getPasswordStrength(password);

  if (!isAuthModalOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDuplicateEmailNotice(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDuplicateEmailNotice(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    try {
      setLoading(true);
      const user = await register({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
      });

      // Show confirmation popup
      setSignUpSuccessPopup({
        open: true,
        registeredEmail: user.email,
        registeredName: user.full_name,
      });
    } catch (err: any) {
      if (err.code === 'EMAIL_ALREADY_EXISTS' || err?.data?.code === 'EMAIL_ALREADY_EXISTS') {
        const dupEmail = err.email || email;
        setDuplicateEmailNotice(
          `An account with "${dupEmail}" already exists. Would you like to sign in instead?`
        );
      } else {
        setErrorMsg(err.message || 'Registration failed. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirm Save Details from Popup and navigate to Login
  const confirmSaveDetailsAndLogin = () => {
    const savedEmail = signUpSuccessPopup.registeredEmail;
    setSignUpSuccessPopup({ open: false, registeredEmail: '', registeredName: '' });
    setMode('login');
    setEmail(savedEmail);
    setPassword('');
    setSuccessMsg('Account details saved! Enter your password to sign in.');
  };

  // Switch to Login with already registered email
  const handleSwitchToLoginWithEmail = () => {
    setDuplicateEmailNotice(null);
    setErrorMsg(null);
    setMode('login');
    setPassword('');
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDevResetToken(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.forgotPassword({ email: email.trim() });
      if (res.email_sent) {
        setSuccessMsg(res.message);
      } else if (res.reset_token) {
        setDevResetToken(res.reset_token);
        setSuccessMsg('A single-use password reset token has been generated:');
      } else {
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resetToken.trim()) {
      setErrorMsg('Please enter a valid reset token.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.resetPassword({
        token: resetToken.trim(),
        new_password: password,
      });
      // Automatically login
      await login({ email: res.user.email, password });
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. The token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="auth-modal-container">
        {/* Close Button Top-Right */}
        <button
          type="button"
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: 20,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        {/* =========================================================
            LEFT COLUMN: BRAND & PLATFORM SHOWCASE
           ========================================================= */}
        <div className="auth-showcase-column">
          {/* Brand & Mission */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#a5b4fc',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
              }}
            >
              <Sparkles size={13} color="#818cf8" />
              <span>CareerNova AI Platform</span>
            </div>

            <h1
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                marginBottom: '0.75rem',
              }}
            >
              Accelerate your engineering journey.
            </h1>

            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                marginBottom: '2rem',
              }}
            >
              One unified AI-powered platform for real-time code execution, mock interview evaluations, and ATS resume intelligence.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="auth-feature-pill">
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    display: 'flex',
                  }}
                >
                  <Terminal size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    Multi-Language Coding Sandbox
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Practice C++, Python, Java, JS, TS with real I/O evaluation.
                  </div>
                </div>
              </div>

              <div className="auth-feature-pill">
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    display: 'flex',
                  }}
                >
                  <Cpu size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    Mock Interviews & STAR Scoring
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Behavioral rubrics and distributed systems architecture feedback.
                  </div>
                </div>
              </div>

              <div className="auth-feature-pill">
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    display: 'flex',
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    ATS Resume Parser & PDF Generator
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Extract skills and compile recruiter-ready PDF & DOCX resumes.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security / Trust Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '1.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-dim)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
              }}
            />
            <span>End-to-End Encrypted Session • PostgreSQL Persistent Storage</span>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: INTERACTIVE AUTH FORM
           ========================================================= */}
        <div className="auth-form-column">
          {/* Header Title & Subtitle */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h2
              id="auth-modal-title"
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '-0.01em',
                marginBottom: '0.35rem',
              }}
            >
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Set a new password'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              {mode === 'login' && 'Enter your credentials to access your candidate workspace.'}
              {mode === 'signup' && 'Join in seconds and save your progress across all practice drills.'}
              {mode === 'forgot' && 'We’ll generate password recovery instructions for your email.'}
              {mode === 'reset' && 'Specify your new password to regain access immediately.'}
            </p>
          </div>

          {/* Segmented Pill Navigation for Sign In / Create Account */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="auth-segmented-nav">
              <button
                type="button"
                className={`auth-segmented-item ${mode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setDuplicateEmailNotice(null);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-segmented-item ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setDuplicateEmailNotice(null);
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Duplicate email alert card */}
          {duplicateEmailNotice && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.86rem', color: '#fef3c7', lineHeight: 1.4 }}>
                  {duplicateEmailNotice}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSwitchToLoginWithEmail}
                style={{
                  alignSelf: 'flex-start',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                }}
              >
                <span>Sign in with this email</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '0.8rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#fca5a5',
                fontSize: '0.86rem',
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                padding: '0.8rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#6ee7b7',
                fontSize: '0.86rem',
              }}
            >
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Dev Token Showcase Card */}
          {devResetToken && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '1.1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Single-Use Recovery Token
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(devResetToken);
                    setTokenCopied(true);
                    setTimeout(() => setTokenCopied(false), 2000);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: tokenCopied ? '#10b981' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  {tokenCopied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{tokenCopied ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  color: '#e0f2fe',
                  wordBreak: 'break-all',
                }}
              >
                {devResetToken}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setResetToken(devResetToken);
                  setMode('reset');
                  setDevResetToken(null);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                style={{ alignSelf: 'flex-start', gap: '0.4rem', fontWeight: 600 }}
              >
                <span>Continue to Set New Password</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ---------------------------------------------------------
              1. SIGN IN FORM
             --------------------------------------------------------- */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="auth-field">
                <label className="auth-field-label">Email Address</label>
                <div className="auth-input-box">
                  <Mail size={17} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field-label">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#818cf8',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-input-action"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '1.25rem' }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setDuplicateEmailNotice(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------------
              2. SIGN UP FORM
             --------------------------------------------------------- */}
          {mode === 'signup' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="auth-field">
                <label className="auth-field-label">Full Name</label>
                <div className="auth-input-box">
                  <UserIcon size={17} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Alex Henderson"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field-label">Email Address</label>
                <div className="auth-input-box">
                  <Mail size={17} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field-label">
                  <span>Create Password</span>
                  {strength.label && (
                    <span style={{ color: strength.color, fontSize: '0.75rem', fontWeight: 700 }}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-input-action"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Visual strength bar */}
                {password.length > 0 && (
                  <div className="auth-password-strength">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className="auth-strength-bar"
                        style={{
                          background: step <= strength.score ? strength.color : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-field-label">Confirm Password</label>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-input-action"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                <span>{loading ? 'Registering...' : 'Create Account & Continue'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '1.25rem' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setDuplicateEmailNotice(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------------
              3. FORGOT PASSWORD VIEW
             --------------------------------------------------------- */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="auth-field">
                <label className="auth-field-label">Email Address</label>
                <div className="auth-input-box">
                  <Mail size={17} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                <span>{loading ? 'Requesting...' : 'Generate Reset Instructions'}</span>
                {!loading && <KeyRound size={16} />}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Enter reset token
                </button>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------------
              4. RESET PASSWORD VIEW
             --------------------------------------------------------- */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="auth-field">
                <label className="auth-field-label">Reset Token</label>
                <div className="auth-input-box">
                  <KeyRound size={17} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Paste your reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field-label">New Password (min 6 chars)</label>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-input-action"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field-label">Confirm New Password</label>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-input-action"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                <span>{loading ? 'Saving...' : 'Set New Password & Sign In'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  alignSelf: 'center',
                  marginTop: '1.25rem',
                }}
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
            </form>
          )}
        </div>

        {/* =========================================================
            5. SUCCESS POPUP DIALOG: "SAVE DETAILS & PROCEED"
           ========================================================= */}
        {signUpSuccessPopup.open && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(7, 11, 22, 0.96)',
              backdropFilter: 'blur(20px)',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              zIndex: 30,
              animation: 'authFadeIn 0.25s ease-out',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                marginBottom: '1.5rem',
                boxShadow: '0 0 35px rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <h3
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#f8fafc',
                marginBottom: '0.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              Account Registered Successfully!
            </h3>

            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                maxWidth: '440px',
                marginBottom: '2rem',
              }}
            >
              Welcome, <strong style={{ color: '#fff' }}>{signUpSuccessPopup.registeredName}</strong>!
              Your profile credentials have been established. Would you like to save these details and proceed to Login?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', maxWidth: '360px' }}>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={confirmSaveDetailsAndLogin}
                style={{ height: '48px', fontSize: '1rem' }}
              >
                <span>Save Details & Continue to Login</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSignUpSuccessPopup({ open: false, registeredEmail: '', registeredName: '' });
                  closeAuthModal();
                }}
                className="btn btn-secondary"
                style={{ height: '42px', justifyContent: 'center' }}
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
