import React, { useState, useEffect } from 'react';
import API from '../api';
import ThemeToggle from './ThemeToggle';

export default function ForgotPassword({ role = 'admin', onBack, theme, onToggleTheme }) {
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify & Reset, 3 = Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const roleTitle = role === 'admin' ? 'Administrator' : 'Teacher';
  const apiEndpoint = role === 'admin' ? '/admin' : '/teacher';

  // Timer for resend OTP countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`${apiEndpoint}/forgot-password`, { email: email.trim() });
      setResetToken(res.data.resetToken);
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setInfoMessage(res.data.message || 'Verification code sent to your email.');
      setStep(2);
      setCountdown(60); // 60s cooldown for resend
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`${apiEndpoint}/reset-password`, {
        resetToken,
        otp: otp.trim(),
        newPassword
      });

      setInfoMessage(res.data.message || 'Password reset successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg-wrapper">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand">
          <svg className="grad-icon" viewBox="0 0 24 24">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" />
          </svg>
          <span className="brand-name">SmartAttend</span>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      {/* Main Container */}
      <main className="login-main">
        <div className="login-card forgot-password-card">
          {onBack && step !== 3 && (
            <button type="button" className="back-link-btn" onClick={onBack}>
              &larr; Back to Login
            </button>
          )}

          {/* Header */}
          <div className="login-header">
            <div className="forgot-lock-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>{step === 3 ? 'Password Updated!' : `Reset ${roleTitle} Password`}</h2>
            <p>
              {step === 1 && 'Enter your registered email address to receive a verification code'}
              {step === 2 && `Enter the 6-digit code sent to ${email}`}
              {step === 3 && 'Your password has been changed successfully'}
            </p>
          </div>

          {/* Step Progress Indicators */}
          {step !== 3 && (
            <div className="reset-step-indicator">
              <span className={`step-pill ${step >= 1 ? 'active' : ''}`}>1. Request Code</span>
              <span className="step-arrow">&rarr;</span>
              <span className={`step-pill ${step >= 2 ? 'active' : ''}`}>2. New Password</span>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {infoMessage && step !== 3 && <div className="info-message">{infoMessage}</div>}

          {/* Dev Mode OTP helper if available */}
          {devOtp && step === 2 && (
            <div className="dev-otp-banner">
              <span className="dev-otp-badge">Dev Mode</span>
              <span>Verification Code: <strong>{devOtp}</strong></span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Registered Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder={role === 'admin' ? 'admin@school.edu' : 'teacher@school.edu'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="portal-btn" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <div className="label-with-action">
                  <label htmlFor="reset-otp">6-Digit Verification Code</label>
                  <button
                    type="button"
                    className="text-action-link"
                    onClick={handleRequestOtp}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  id="reset-otp"
                  type="text"
                  maxLength="6"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="form-input otp-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <div className="label-with-action">
                  <label htmlFor="new-password">New Password</label>
                  <button
                    type="button"
                    className="text-action-link"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="portal-btn" disabled={loading}>
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                className="secondary-outline-btn"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
              >
                Change Email
              </button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="reset-success-box">
              <div className="success-check-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <p className="success-description">
                Your password for <strong>{email}</strong> has been updated. You can now log into the {roleTitle} portal.
              </p>
              <button type="button" className="portal-btn" onClick={onBack}>
                Proceed to Login
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
