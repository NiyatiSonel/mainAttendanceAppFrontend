import React from 'react';
import ThemeToggle from './ThemeToggle';
import './style.css';

export default function RoleSelect({ onSelectRole, theme, onToggleTheme }) {
  return (
    <>
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="brand">
          <svg
            className="grad-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" />
          </svg>

          <span className="brand-name">SmartAttend</span>
        </div>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      {/* Main Content */}
      <main className="page-container">
        <div className="portal-card">

          {/* Left Side */}
          <section className="auth-panel">
            <div className="panel-header">
              <h1>Smart Attendance System</h1>
              <p>Biometric campus attendance management, real-time analytics, and instant session tracking.</p>
            </div>

            <div className="button-group">

              <button
                className="portal-btn btn-admin-accent"
                type="button"
                onClick={() => onSelectRole('admin')}
              >
                <span className="btn-icon">🛡️</span> Continue as Administrator
              </button>

              <button
                className="portal-btn btn-teacher-accent"
                type="button"
                onClick={() => onSelectRole('teacher')}
              >
                <span className="btn-icon">👨‍🏫</span> Continue as Teacher
              </button>

            </div>
          </section>

          {/* Right Side */}
          <section className="illustration-panel">
            <div className="illustration-wrapper">
              <img
                src="/attendance-illustration.png"
                alt="Teacher and Students illustration"
                className="illustration-img"
              />
            </div>
          </section>

        </div>
      </main>
    </>
  );
}