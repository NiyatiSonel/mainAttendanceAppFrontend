import React, { useState } from 'react';
import API from '../api';
import ThemeToggle from './ThemeToggle';
import ForgotPassword from './ForgotPassword';

export default function TeacherLogin({ onLoginSuccess, onBack, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (showForgotPassword) {
    return (
      <ForgotPassword
        role="teacher"
        onBack={() => setShowForgotPassword(false)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await API.post('/teacher/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'teacher');
      
      if (onLoginSuccess) {
        onLoginSuccess(res.data.teacher);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid teacher credentials');
    }
  };

  return (
    <div className="login-bg-wrapper">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand">
          <svg className="grad-icon" viewBox="0 0 24 24">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z"/>
          </svg>
          <span className="brand-name">SmartAttend</span>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      {/* Centered Login Box */}
      <main className="login-main">
        <div className="login-card">
          {onBack && (
            <button type="button" className="back-link-btn" onClick={onBack}>
              &larr; Back to Selection
            </button>
          )}

          <div className="login-header">
            <h2>Teacher Portal Login</h2>
            <p>Enter your teacher credentials to continue</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="teacher-email">Email Address</label>
              <input
                id="teacher-email"
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="teacher-password">Password</label>
                <button
                  type="button"
                  className="text-action-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="teacher-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="portal-btn">
              Login
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}