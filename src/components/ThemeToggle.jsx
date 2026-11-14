import React from 'react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={onToggle}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>
        {isDark ? '🌙' : '☀️'}
      </span>
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
