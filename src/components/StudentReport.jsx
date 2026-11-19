import React, { useEffect, useState } from 'react';
import API from '../api';

const formatDateTime = (val) => {
  if (!val || val === 'N/A' || val === '-') return '-';
  const d = new Date(val);
  return isNaN(d.getTime())
    ? val
    : d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
};

export default function StudentReport({ subjectId, studentId, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);

        const res = await API.get(
          `/teacher/subjects/${subjectId}/students/${studentId}/report`
        );

        setReport(res.data);

      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to load student report'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [subjectId, studentId]);


  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="student-report-message">
        Loading student report...
      </div>
    );
  }


  /* =========================================================
     ERROR
     ========================================================= */

  if (error) {
    return (
      <div className="student-report-error">
        {error}
      </div>
    );
  }


  if (!report) {
    return null;
  }


  const {
    student,
    subject,
    metrics,
    history
  } = report;

  const sortedHistory = [...(history || [])].sort((a, b) => {
    const timeA = new Date(a.start_time || a.date).getTime();
    const timeB = new Date(b.start_time || b.date).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) {
      return timeA - timeB;
    }
    return (a.session_id || 0) - (b.session_id || 0);
  });


  return (
    <div className="student-report-section">

      {/* =====================================================
          BACK BUTTON
          ===================================================== */}

      <button
        onClick={onBack}
        className="student-report-back-btn"
      >
        &larr; Back to Enrolled Students
      </button>


      {/* =====================================================
          TITLE
          ===================================================== */}

      <h3 className="student-report-title">
        Student Performance Dashboard
      </h3>


      {/* =====================================================
          STUDENT INFORMATION
          ===================================================== */}

      <div className="student-report-profile">

        <p>
          <strong>Roll Number:</strong>{' '}
          {student.roll_no || 'N/A'}
        </p>

        <p>
          <strong>Student Name:</strong>{' '}
          {student.name} (DB ID: {student.id})
        </p>

        <p>
          <strong>Subject:</strong>{' '}
          {subject.subject_name} (ID: {subject.sub_ID})
        </p>

      </div>


      {/* =====================================================
          ATTENDANCE METRICS
          ===================================================== */}

      <div className="student-metrics-grid">

        {/* Total Classes */}
        <div className="stat-card stat-cream">
          <div className="stat-card-header">
            <span className="stat-label">Total Classes</span>
            <span className="stat-icon-pill">📚</span>
          </div>
          <div className="stat-value">{metrics.totalSessions}</div>
        </div>

        {/* Attended */}
        <div className="stat-card stat-mint">
          <div className="stat-card-header">
            <span className="stat-label">Attended</span>
            <span className="stat-icon-pill">✅</span>
          </div>
          <div className="stat-value">{metrics.attendedSessions}</div>
        </div>

        {/* Absent */}
        <div className="stat-card stat-coral">
          <div className="stat-card-header">
            <span className="stat-label">Absent</span>
            <span className="stat-icon-pill">❌</span>
          </div>
          <div className="stat-value">{metrics.absentSessions}</div>
        </div>

        {/* Attendance Rate */}
        <div className={`stat-card ${metrics.percentage >= 75 ? 'stat-peach' : 'stat-coral'}`}>
          <div className="stat-card-header">
            <span className="stat-label">Attendance Rate</span>
            <span className="stat-icon-pill">{metrics.percentage >= 75 ? '📈' : '⚠️'}</span>
          </div>
          <div className="stat-value">
            {metrics.percentage}%
          </div>
        </div>

      </div>


      {/* =====================================================
          SESSION BREAKDOWN
          ===================================================== */}

      <h4 className="student-session-title">
        Session Breakdown
      </h4>


      {sortedHistory.length > 0 ? (

        <div className="student-session-table-wrapper">

          <table className="student-session-table">

            <thead>

              <tr>
                <th>Session #</th>
                <th>Date / Start Time</th>
                <th>Status</th>
                <th>Marked Time</th>
              </tr>

            </thead>


            <tbody>

              {sortedHistory.map((h, index) => (

                <tr key={h.session_id || index}>

                  <td>
                    {index + 1}
                  </td>

                  <td>
                    {formatDateTime(h.start_time || h.date)}
                  </td>

                  <td>
                    <span
                      className={
                        h.status.toLowerCase() === 'present'
                          ? 'student-status-present'
                          : 'student-status-absent'
                      }
                    >
                      {h.status}
                    </span>
                  </td>

                  <td>
                    {formatDateTime(h.marked_at || h.marked_time)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      ) : (

        <p className="student-no-sessions">
          No classroom sessions recorded yet for this subject.
        </p>

      )}

    </div>
  );
}