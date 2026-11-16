import React, { useState } from 'react';
import API from '../api';
import ThemeToggle from './ThemeToggle';

export default function AdminLogin({ onLoginSuccess, onBack, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await API.post('/admin/login', { email, password });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'admin');
      if (res.data.admin) {
        localStorage.setItem('adminInfo', JSON.stringify(res.data.admin));
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid admin credentials');
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
            <h2>Administrator Login</h2>
            <p>Enter your admin credentials to continue</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
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