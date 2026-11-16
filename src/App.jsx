import React, { useState, useEffect } from 'react';
import RoleSelect from './components/RoleSelect';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('select');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && role === 'admin') {
      setCurrentView('admin_dashboard');
    } else if (token && role === 'teacher') {
      setCurrentView('teacher_dashboard');
    } else {
      setCurrentView('select');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('adminInfo');
    setCurrentView('select');
  };

  const handleSelectRole = (role) => {
    // Clear any previous token when moving to login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('adminInfo');
    setCurrentView(role === 'admin' ? 'admin_login' : 'teacher_login');
  };

  return (
    <div>
      {currentView === 'select' && (
        <RoleSelect
          onSelectRole={handleSelectRole}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {currentView === 'admin_login' && (
        <AdminLogin 
          onLoginSuccess={() => setCurrentView('admin_dashboard')} 
          onBack={() => setCurrentView('select')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {currentView === 'admin_dashboard' && (
        <AdminDashboard
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {currentView === 'teacher_login' && (
        <TeacherLogin 
          onLoginSuccess={() => setCurrentView('teacher_dashboard')} 
          onBack={() => setCurrentView('select')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {currentView === 'teacher_dashboard' && (
        <TeacherDashboard
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}