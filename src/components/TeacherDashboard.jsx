import React, { useEffect, useState } from 'react';
import API from '../api';
import SubjectStudents from './SubjectStudents';
import ScheduleSession from './ScheduleSession';
import SubjectReport from './SubjectReport';
import ThemeToggle from './ThemeToggle';

export default function TeacherDashboard({ onLogout, theme, onToggleTheme }) {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const res = await API.get('/teacher/profile');
        setProfile(res.data.profile);
        setSubjects(res.data.subjects);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to load teacher profile'
        );
      }
    };

    fetchTeacherData();
  }, []);

  return (
    <div className="teacher-container">

      {/* =====================================================
          TOP NAVBAR
          ===================================================== */}
      <header className="navbar">

        <div className="brand">
          <svg className="grad-icon" viewBox="0 0 24 24">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" />
          </svg>

          <span className="brand-name">
            SmartAttend
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={onLogout}
            className="teacher-logout-btn"
          >
            Logout
          </button>
        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}
      <main className="teacher-main">

        <div className="teacher-card">

          {/* =================================================
              PAGE TITLE
              ================================================= */}
          <h1 className="teacher-title">
            Teacher Portal
          </h1>


          {/* =================================================
              PROFILE + SCHEDULE BUTTON
              ================================================= */}
          <section className="teacher-profile-section">

            <div className="teacher-profile">

              <h2>My Profile</h2>

              {profile ? (
                <div className="teacher-profile-details">

                  <p>
                    <strong>Teacher ID:</strong>{' '}
                    {profile.id}
                  </p>

                  <p>
                    <strong>Full Name:</strong>{' '}
                    {profile.name}
                  </p>

                  <p>
                    <strong>Email:</strong>{' '}
                    {profile.email}
                  </p>

                </div>
              ) : (
                <p>Loading profile...</p>
              )}

            </div>


            {/* Schedule Session */}
            <button
              className="teacher-schedule-btn"
              onClick={() => {
                setSelectedSubjectId(null);
                setIsScheduling(true);
              }}
              title="Schedule Instant Session"
            >
              <span className="schedule-plus">+</span>
              Schedule Session
            </button>

            {/* Subject Attendance Report */}
            <button
              className="teacher-schedule-btn"
              onClick={() => {
                setIsScheduling(false);
                setSelectedSubjectId(null);
                setIsReporting(true);
              }}
              title="View Subject Attendance Report"
            >
              📊 Subject Attendance Report
            </button>

          </section>


          {/* Error message */}
          {error && (
            <p className="teacher-error">
              {error}
            </p>
          )}


          {/* Divider */}
          <hr className="teacher-divider" />


          {/* =================================================
              CONTENT SWITCHER
              ================================================= */}
          {isScheduling ? (

            <ScheduleSession
              subjects={subjects}
              onBack={() => setIsScheduling(false)}
            />

          ) : isReporting ? (

            <SubjectReport
              subjects={subjects}
              onBack={() => setIsReporting(false)}
            />

          ) : selectedSubjectId ? (

            <SubjectStudents
              subjectId={selectedSubjectId}
              onBack={() => setSelectedSubjectId(null)}
            />

          ) : (

            /* ===============================================
               ASSIGNED SUBJECTS
               =============================================== */
            <section className="teacher-subject-section">

              <h2 className="teacher-section-title">
                Assigned Subjects
              </h2>

              {subjects.length > 0 ? (

                <div className="teacher-table-wrapper">

                  <table className="teacher-table">

                    <thead>
                      <tr>
                        <th>Subject ID</th>
                        <th>Subject Name</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>

                      {subjects.map((sub) => (

                        <tr key={sub.id}>

                          <td>
                            {sub.id}
                          </td>

                          <td>
                            {sub.subject_name}
                          </td>

                          <td>

                            <button
                              className="teacher-view-btn"
                              onClick={() =>
                                setSelectedSubjectId(sub.id)
                              }
                            >
                              View Students
                            </button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ) : (

                <p className="teacher-empty">
                  No subjects have been assigned to your
                  account by the administrator yet.
                </p>

              )}

            </section>

          )}

        </div>

      </main>

    </div>
  );
}