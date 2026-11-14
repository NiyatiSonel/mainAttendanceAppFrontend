import React, { useEffect, useState } from 'react';
import API from '../api';
import StudentReport from './StudentReport';

export default function SubjectStudents({ subjectId, onBack }) {
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const res = await API.get(
          `/teacher/subjects/${subjectId}/students`
        );

        setSubjectInfo(res.data.subject);
        setStudents(res.data.students);

      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to load enrolled students'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [subjectId]);


  // If a student is selected, switch to Student Report Dashboard
  if (selectedStudentId) {
    return (
      <StudentReport
        subjectId={subjectId}
        studentId={selectedStudentId}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }


  return (
    <div className="teacher-students-section">

      {/* Back Button */}
      <button
        onClick={onBack}
        className="teacher-back-btn"
      >
        &larr; Back to Subjects
      </button>


      {/* Loading */}
      {loading && (
        <p className="teacher-loading">
          Loading enrolled students...
        </p>
      )}


      {/* Error */}
      {error && (
        <p className="teacher-error">
          {error}
        </p>
      )}


      {/* Subject Information */}
      {subjectInfo && (
        <div>

          <h3 className="teacher-students-title">
            Enrolled Students for: {subjectInfo.subject_name} (ID: {subjectInfo.sub_ID})
          </h3>

          <p className="teacher-students-total">
            Total Enrolled: {students.length}
          </p>


          {/* Students Table */}
          <div className="teacher-students-table-wrapper">

            <table className="teacher-students-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Biometric Status</th>
                  <th>Action</th>
                </tr>
              </thead>


              <tbody>

                {students.length > 0 ? (

                  students.map((stu) => (

                    <tr key={stu.id}>

                      <td>
                        {stu.id}
                      </td>

                      <td>
                        <strong>
                          {stu.roll_no || '-'}
                        </strong>
                      </td>

                      <td>
                        {stu.name}
                      </td>

                      <td>
                        <span
                          className={
                            stu.has_fingerprint
                              ? 'teacher-enrolled-status'
                              : 'teacher-pending-status'
                          }
                        >
                          {stu.has_fingerprint
                            ? 'Enrolled'
                            : 'Pending'}
                        </span>
                      </td>

                      <td>

                        <button
                          onClick={() =>
                            setSelectedStudentId(stu.id)
                          }
                          className="teacher-dashboard-btn"
                        >
                          View Dashboard
                        </button>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>
                    <td
                      colSpan="5"
                      className="teacher-no-students"
                    >
                      No students are enrolled in this subject yet.
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