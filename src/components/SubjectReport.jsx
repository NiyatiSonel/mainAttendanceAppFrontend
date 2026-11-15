import React, { useState } from 'react';
import API from '../api';

export default function SubjectReport({ subjects, onBack }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterCriterion, setFilterCriterion] = useState('all'); // 'all', 'below_60', 'between_60_75', 'above_75'

  const handleGenerateReport = async () => {
    if (!selectedSubjectId) {
      setError('Please select a subject.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setReport(null);
      setFilterCriterion('all');

      const res = await API.get(
        `/teacher/subjects/${selectedSubjectId}/report`
      );

      setReport(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to load subject attendance report'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter calculations
  const students = report?.students || [];
  const countAll = students.length;
  const countBelow60 = students.filter((s) => Number(s.percentage) < 60).length;
  const count60To75 = students.filter(
    (s) => Number(s.percentage) >= 60 && Number(s.percentage) < 75
  ).length;
  const countAbove75 = students.filter(
    (s) => Number(s.percentage) >= 75
  ).length;

  const filteredStudents = students.filter((student) => {
    const pct = Number(student.percentage);
    if (filterCriterion === 'below_60') return pct < 60;
    if (filterCriterion === 'between_60_75') return pct >= 60 && pct < 75;
    if (filterCriterion === 'above_75') return pct >= 75;
    return true;
  });

  const getStatusBadge = (percentage) => {
    const pct = Number(percentage);
    if (pct < 60) {
      return <span className="attendance-status-badge status-danger">Shortage (&lt;60%)</span>;
    }
    if (pct < 75) {
      return <span className="attendance-status-badge status-warning">Warning (60-75%)</span>;
    }
    return <span className="attendance-status-badge status-success">Eligible (&ge;75%)</span>;
  };

  // =======================================================
  // STEP 2: DOWNLOAD ATTENDANCE PDF REPORT
  // =======================================================
  const handleDownloadPDF = () => {
    if (!report || filteredStudents.length === 0) return;

    let filterTitle = 'Consolidated Attendance Report (All Students)';
    let filterBadgeText = 'All Students';
    let filterColor = '#4a6fa5';

    if (filterCriterion === 'below_60') {
      filterTitle = 'Attendance Defaulters Report (Below 60%)';
      filterBadgeText = 'Critical Shortage (<60%)';
      filterColor = '#dc2626';
    } else if (filterCriterion === 'between_60_75') {
      filterTitle = 'Borderline Attendance Report (60% – 75%)';
      filterBadgeText = 'Warning / Borderline (60% - 75%)';
      filterColor = '#d97706';
    } else if (filterCriterion === 'above_75') {
      filterTitle = 'Eligible Students Attendance Report (75% & Above)';
      filterBadgeText = 'Eligible (≥75%)';
      filterColor = '#16a34a';
    }

    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (!printWindow) {
      alert('Please allow popups to generate and download the PDF report.');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const tableRowsHtml = filteredStudents.map((student, idx) => {
      const pct = Number(student.percentage);
      let statusLabel = 'Eligible';
      let statusClass = 'status-eligible';
      if (pct < 60) {
        statusLabel = 'Critical Shortage';
        statusClass = 'status-danger';
      } else if (pct < 75) {
        statusLabel = 'Borderline Warning';
        statusClass = 'status-warning';
      }

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-weight: 600;">${student.roll_no || '-'}</td>
          <td>${student.name}</td>
          <td style="text-align: center;">${student.present}</td>
          <td style="text-align: center;">${student.absent}</td>
          <td style="text-align: center; font-weight: 700;">${student.percentage}%</td>
          <td style="text-align: center;">
            <span class="badge ${statusClass}">${statusLabel}</span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance_Report_${report.subject.subject_name.replace(/[^a-zA-Z0-9]/g, '_')}_${filterCriterion}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 12mm 16mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            background: #ffffff;
            font-size: 12px;
          }
          .report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #3b5d96;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-box h1 {
            margin: 0;
            font-size: 20px;
            color: #1e293b;
            letter-spacing: -0.5px;
          }
          .brand-box p {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .report-badge {
            background-color: ${filterColor}15;
            border: 1px solid ${filterColor};
            color: ${filterColor};
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 11px;
          }
          .report-title-banner {
            text-align: center;
            margin-bottom: 16px;
          }
          .report-title-banner h2 {
            margin: 0 0 4px 0;
            font-size: 16px;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 16px;
          }
          .meta-item p {
            margin: 0;
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .meta-item strong {
            display: block;
            margin-top: 2px;
            font-size: 12px;
            color: #0f172a;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
            text-align: center;
            background: #ffffff;
          }
          .card .num {
            font-size: 18px;
            font-weight: 800;
            color: #3b5d96;
            margin: 0;
          }
          .card .label {
            font-size: 10px;
            color: #64748b;
            margin: 2px 0 0 0;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 24px;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            font-size: 10px;
            text-transform: uppercase;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 700;
          }
          .status-eligible {
            background-color: #dcfce7;
            color: #166534;
          }
          .status-warning {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-danger {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .footer-section {
            margin-top: 36px;
            display: flex;
            justify-content: space-between;
            padding-top: 20px;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #94a3b8;
            margin-bottom: 6px;
          }
          .signature-box p {
            margin: 0;
            font-size: 11px;
            color: #475569;
          }
          .action-bar {
            text-align: right;
            margin-bottom: 16px;
          }
          .action-btn {
            background-color: #4a6fa5;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            font-size: 12px;
          }
          .action-btn:hover {
            background-color: #385685;
          }
          @media print {
            .action-bar {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <button class="action-btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
        </div>

        <div class="report-header">
          <div class="brand-box">
            <h1>SmartAttend Portal</h1>
            <p>Automated Attendance & Academic Monitoring System</p>
          </div>
          <div class="report-badge">
            ${filterBadgeText}
          </div>
        </div>

        <div class="report-title-banner">
          <h2>${filterTitle}</h2>
          <span style="font-size: 11px; color: #64748b;">Generated on ${currentDate} at ${currentTime}</span>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <p>Subject</p>
            <strong>${report.subject.subject_name}</strong>
          </div>
          <div class="meta-item">
            <p>Teacher</p>
            <strong>${report.subject.teacher_name || 'N/A'}</strong>
          </div>
          <div class="meta-item">
            <p>Semester</p>
            <strong>${report.subject.semester_name || 'N/A'}</strong>
          </div>
          <div class="meta-item">
            <p>Classes Conducted</p>
            <strong>${report.totalSessions} Sessions</strong>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="num">${countAll}</div>
            <div class="label">Total Students</div>
          </div>
          <div class="card">
            <div class="num" style="color: ${filterColor}">${filteredStudents.length}</div>
            <div class="label">Filtered Students</div>
          </div>
          <div class="card">
            <div class="num" style="color: #dc2626">${countBelow60}</div>
            <div class="label">Defaulters (&lt;60%)</div>
          </div>
          <div class="card">
            <div class="num" style="color: #16a34a">${countAbove75}</div>
            <div class="label">Eligible (&ge;75%)</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">S.No</th>
              <th style="width: 110px;">Roll No</th>
              <th>Student Name</th>
              <th style="width: 80px; text-align: center;">Present</th>
              <th style="width: 80px; text-align: center;">Absent</th>
              <th style="width: 100px; text-align: center;">Attendance %</th>
              <th style="width: 130px; text-align: center;">Eligibility Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Subject Teacher Signature</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Head of Department / Dean</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="subject-report-section">
      {/* Back Button */}
      <button onClick={onBack} className="teacher-back-btn">
        &larr; Back to Teacher Portal
      </button>

      {/* Title */}
      <h2 className="teacher-section-title">
        Subject Attendance Report
      </h2>

      {/* Subject Selection */}
      <div className="subject-report-selector">
        <label htmlFor="subject-select-dropdown">
          Select Subject
        </label>

        <select
          id="subject-select-dropdown"
          value={selectedSubjectId}
          onChange={(e) => {
            setSelectedSubjectId(e.target.value);
            setReport(null);
            setError('');
          }}
        >
          <option value="">
            -- Select Subject --
          </option>

          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.subject_name}
            </option>
          ))}
        </select>

        <button
          className="teacher-schedule-btn"
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="teacher-error">
          {error}
        </p>
      )}

      {/* Report */}
      {report && (
        <div className="subject-report-container">
          {/* Header Summary */}
          <div className="subject-report-header">
            <h2>SmartAttend</h2>
            <h3>Subject Attendance Report</h3>

            <div className="report-meta-grid">
              <p>
                <strong>Subject:</strong> {report.subject.subject_name}
              </p>
              <p>
                <strong>Teacher:</strong> {report.subject.teacher_name || 'N/A'}
              </p>
              <p>
                <strong>Semester:</strong> {report.subject.semester_name || 'N/A'}
              </p>
              <p>
                <strong>Total Classes Held:</strong> {report.totalSessions}
              </p>
            </div>
          </div>

          {/* =======================================================
              ATTENDANCE FILTER BAR & DOWNLOAD PDF BUTTON
              ======================================================= */}
          <div className="report-filter-section">
            <div className="report-filter-header">
              <div className="filter-left-col">
                <span className="filter-label">Filter Attendance Criterion:</span>
                <div className="filter-pills-group">
                  <button
                    type="button"
                    className={`filter-pill-btn ${filterCriterion === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterCriterion('all')}
                  >
                    All Students <span className="pill-count">{countAll}</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-pill-btn pill-danger ${filterCriterion === 'below_60' ? 'active' : ''}`}
                    onClick={() => setFilterCriterion('below_60')}
                  >
                    Below 60% <span className="pill-count">{countBelow60}</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-pill-btn pill-warning ${filterCriterion === 'between_60_75' ? 'active' : ''}`}
                    onClick={() => setFilterCriterion('between_60_75')}
                  >
                    60% – 75% <span className="pill-count">{count60To75}</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-pill-btn pill-success ${filterCriterion === 'above_75' ? 'active' : ''}`}
                    onClick={() => setFilterCriterion('above_75')}
                  >
                    75% &amp; Above <span className="pill-count">{countAbove75}</span>
                  </button>
                </div>
              </div>

              {/* Download PDF Button */}
              <div className="filter-right-col">
                <button
                  type="button"
                  className="download-pdf-btn"
                  onClick={handleDownloadPDF}
                  disabled={filteredStudents.length === 0}
                  title="Download / Print Attendance Report in PDF Format"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>

            <div className="filter-info-row">
              <span className="filter-count-info">
                Showing <strong>{filteredStudents.length}</strong> of <strong>{countAll}</strong> students
                {filterCriterion === 'below_60' && ' (Critical Attendance Shortage)'}
                {filterCriterion === 'between_60_75' && ' (Warning / Borderline Attendance)'}
                {filterCriterion === 'above_75' && ' (Satisfactory / Eligible Attendance)'}
              </span>
              {filterCriterion !== 'all' && (
                <button
                  type="button"
                  className="reset-filter-link"
                  onClick={() => setFilterCriterion('all')}
                >
                  Show All Students
                </button>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>

                  {report.sessions.map((session) => {
                    const date = new Date(session.start_time);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <th key={session.session_ID}>
                        {formattedDate}
                      </th>
                    );
                  })}

                  <th>Present</th>
                  <th>Absent</th>
                  <th>Attendance %</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.roll_no || '-'}</td>
                      <td>{student.name}</td>

                      {student.attendance.map((record) => (
                        <td
                          key={record.session_id}
                          className={
                            record.status.toLowerCase() === 'present'
                              ? 'attendance-present'
                              : 'attendance-absent'
                          }
                        >
                          {record.status.toLowerCase() === 'present' ? 'P' : 'A'}
                        </td>
                      ))}

                      <td>{student.present}</td>
                      <td>{student.absent}</td>
                      <td>
                        <strong>{student.percentage}%</strong>
                      </td>
                      <td>
                        {getStatusBadge(student.percentage)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={report.sessions.length + 6}
                      style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-secondary)' }}
                    >
                      <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: '1rem' }}>
                        No students found matching this criteria
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        Try switching to "All Students" or another filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
