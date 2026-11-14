import React, { useState } from 'react';
import API from '../api';

export default function SubjectReport({ subjects, onBack }) {

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {

    if (!selectedSubjectId) {
      setError('Please select a subject.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setReport(null);

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


  return (
    <div className="subject-report-section">

      {/* Back Button */}
      <button
        onClick={onBack}
        className="teacher-back-btn"
      >
        &larr; Back to Teacher Portal
      </button>


      {/* Title */}
      <h2 className="teacher-section-title">
        Subject Attendance Report
      </h2>


      {/* Subject Selection */}
      <div className="subject-report-selector">

        <label>
          Select Subject
        </label>

        <select
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
            <option
              key={subject.id}
              value={subject.id}
            >
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

          <div className="subject-report-header">

            <h2>SmartAttend</h2>

            <h3>Subject Attendance Report</h3>

            <p>
                <strong>Subject:</strong>{' '}
                {report.subject.subject_name}
            </p>

            <p>
                <strong>Teacher:</strong>{' '}
                {report.subject.teacher_name || 'N/A'}
            </p>

            <p>
                <strong>Semester:</strong>{' '}
                {report.subject.semester_name || 'N/A'}
            </p>

            <p>
                <strong>Report Period:</strong>{' '}
                August 2026 – September 2026
            </p>

            <p>
                <strong>Total Classes:</strong>{' '}
                {report.totalSessions}
            </p>

            </div>


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

                </tr>

              </thead>


              <tbody>

                {report.students.map((student) => (

                  <tr key={student.student_id}>

                    <td>
                      {student.roll_no || '-'}
                    </td>

                    <td>
                      {student.name}
                    </td>


                    {student.attendance.map((record) => (

                      <td
                        key={record.session_id}
                        className={
                            record.status.toLowerCase() === 'present'
                            ? 'attendance-present'
                            : 'attendance-absent'
                        }
                        >
                        {record.status.toLowerCase() === 'present'
                            ? 'P'
                            : 'A'}
                        </td>

                    ))}


                    <td>
                      {student.present}
                    </td>

                    <td>
                      {student.absent}
                    </td>

                    <td>
                      {student.percentage}%
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}