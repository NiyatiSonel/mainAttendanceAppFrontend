import React, { useEffect, useState } from 'react';
import API from '../api';
import ThemeToggle from './ThemeToggle';

export default function AdminDashboard({ onLogout, theme, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState(1);
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalSubjects: 0, totalDevices: 0 });
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState('');

  // Superadmin identity and password management modal
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('adminInfo');
      if (saved) {
        return Boolean(JSON.parse(saved).isSuper);
      }
    } catch (e) {}
    return false;
  });

  const [passwordModal, setPasswordModal] = useState({
    open: false,
    type: 'teacher', // 'teacher' | 'admin'
    id: null,
    name: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    error: ''
  });

  // Form states
  // Form states (removed biometric_template from newStudent)
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [newSubject, setNewSubject] = useState({ subject_name: '', teacher_id: '', semester_id: '' });
  const [newSemester, setNewSemester] = useState({ semester_name: '', start_date: '', end_date: '' });
  const [newStudent, setNewStudent] = useState({ roll_no: '', name: '' });
  const [enrollTarget, setEnrollTarget] = useState({ studentId: '', template: '' });
  const [newEnrollment, setNewEnrollment] = useState({ stu_id: '', subject_id: '' });
  const [newDevice, setNewDevice] = useState({ mac_address: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // 1. loadData definition MUST be inside the component
  const loadData = async () => {
    try {
      API.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
      API.get('/admin/teachers').then(res => setTeachers(res.data)).catch(console.error);
      API.get('/admin/subjects').then(res => setSubjects(res.data)).catch(console.error);
      API.get('/admin/semesters').then(res => setSemesters(res.data)).catch(console.error);
      API.get('/admin/students').then(res => setStudents(res.data)).catch(console.error);
      API.get('/admin/devices').then(res => setDevices(res.data)).catch(console.error);
      API.get('/admin/enrollments').then(res => setEnrollments(res.data)).catch(console.error);
      API.get('/admin/me').then(res => {
        if (res.data && res.data.isSuper !== undefined) {
          setIsSuperAdmin(Boolean(res.data.isSuper));
        }
      }).catch(() => {});
      const admRes = await API.get('/admin/admins');
      setAdmins(admRes.data);
    } catch (err) {
      console.error('Failed to load admins:', err);
      setMessage(err.response?.data?.error || 'Failed to fetch admin list');
    }
  };

  // 2. useEffect MUST be inside the component
  useEffect(() => {
    loadData();
  }, []);   

  const handleOpenPasswordModal = (type, id, name) => {
    setPasswordModal({
      open: true,
      type,
      id,
      name,
      newPassword: '',
      confirmPassword: '',
      loading: false,
      error: ''
    });
  };

  const handleClosePasswordModal = () => {
    setPasswordModal({
      open: false,
      type: 'teacher',
      id: null,
      name: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
      error: ''
    });
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordModal.newPassword || passwordModal.newPassword.length < 6) {
      setPasswordModal(prev => ({ ...prev, error: 'Password must be at least 6 characters long.' }));
      return;
    }
    if (passwordModal.newPassword !== passwordModal.confirmPassword) {
      setPasswordModal(prev => ({ ...prev, error: 'Passwords do not match.' }));
      return;
    }

    try {
      setPasswordModal(prev => ({ ...prev, loading: true, error: '' }));
      const endpoint = passwordModal.type === 'teacher'
        ? `/admin/teachers/${passwordModal.id}/password`
        : `/admin/admins/${passwordModal.id}/password`;

      const res = await API.put(endpoint, { new_password: passwordModal.newPassword });
      alert(res.data.message || 'Password updated successfully!');
      handleClosePasswordModal();
    } catch (err) {
      setPasswordModal(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.error || 'Failed to update password'
      }));
    }
  };

  // 3. Trigger enrollment function
  const handleTriggerEnrollment = async (studentId, rollNo) => {
    try {
      setMessage(`Waiting for fingerprint scan for Roll No: ${rollNo}... Please place finger on sensor.`);
      const res = await API.post(`/admin/students/${studentId}/trigger-enroll`, { roll_no: rollNo });
      alert(res.data.message);
      
      // Refresh student data after a brief pause to check enrollment status
      setTimeout(() => {
        loadData(); 
      }, 6000); 
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger fingerprint sensor.');
    }
  };

  // 1. Add Teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (newTeacher.password !== newTeacher.confirmPassword) {
      alert('Error: Passwords do not match!');
      return;
    }
    try {
      await API.post('/admin/teachers', {
        name: newTeacher.name,
        email: newTeacher.email,
        password: newTeacher.password
      });
      setNewTeacher({ name: '', email: '', password: '', confirmPassword: '' });
      setMessage('Teacher added successfully');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add teacher');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try {
      await API.delete(`/admin/teachers/${id}`);
      setMessage('Teacher deleted');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete teacher');
    }
  };

  // 2. Add Subject & Reassign
  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/subjects', newSubject);
      setNewSubject({ subject_name: '', teacher_id: '', semester_id: '' });
      setMessage('Subject created successfully');
      loadData();
    } catch (err) { 
      alert(err.response?.data?.error || 'Failed to add subject');
    }
  };

  const handleReassignSubject = async (subjectId, teacherId) => {
    try {
      await API.put(`/admin/subjects/${subjectId}`, { teacher_id: teacherId || null });
      setMessage('Subject teacher updated');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update subject');
    }
  };

  // 3. Add Student & Biometric Enrollment
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/students', newStudent);
      setMessage('Student registered successfully');
      setNewStudent({ roll_no: '', name: '' }); // Reset fields
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to add student');
    }
  };

  const handleEnrollFingerprint = async (e) => {
    e.preventDefault();
    if (!enrollTarget.studentId || !enrollTarget.template) {
      alert('Select a student and provide fingerprint template data');
      return;
    }
    try {
      await API.put(`/admin/students/${enrollTarget.studentId}/biometrics`, {
        biometric_template: enrollTarget.template
      });
      setEnrollTarget({ studentId: '', template: '' });
      setMessage('Fingerprint template saved');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll fingerprint');
    }
  };

  // 4. Enroll Student to Subject
  const handleAddEnrollment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/enrollments', { student_id: newEnrollment.stu_id, subject_id: newEnrollment.subject_id });
      setNewEnrollment({ stu_id: '', subject_id: '' });
      setMessage('Student enrolled in subject');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll');
    }
  };

  const handleDeleteEnrollment = async (id) => {
    if (!window.confirm('Drop this enrollment?')) return;
    try {
      await API.delete(`/admin/enrollments/${id}`);
      setMessage('Enrollment dropped');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete enrollment');
    }
  };

  // 5. Add Device
  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/devices', { mac_address: newDevice.mac_address });
      setNewDevice({ mac_address: '' });
      setMessage('Device registered');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register device');
    }
  };

  // 6. Add Admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert('Error: Passwords do not match!');
      return;
    }
    try {
      await API.post('/admin/admins', {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password
      });
      setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
      setMessage('New Admin registered successfully');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add admin');
    }
  };

  // 7. Delete Admin
  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    try {
      await API.delete(`/admin/admins/${id}`);
      setMessage('Admin removed');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete admin');
    }
  };

  // 8. Add Semester
  const handleAddSemester = async (e) => {
    e.preventDefault();

    try {
      await API.post('/admin/semesters', newSemester);

      setNewSemester({
        semester_name: '',
        start_date: '',
        end_date: ''
      });

      setMessage('Semester created successfully');
      loadData();

    } catch (err) {
      alert(
        err.response?.data?.error ||
        'Failed to create semester'
      );
    }
  }; 

  const sidebarOptions = [
    '1. Teachers',
    '2. Subjects & Teacher Assignments',
    '3. Student Registration & Fingerprint',
    '4. Student-Subject Enrollments',
    '5. ESP32 Attendance Devices',
    '6. Admin Accounts Management'
  ];

  return (
    <div className="admin-container">
      {/* 1) Top Navbar */}
      <header className="navbar">
        <div className="brand">
          <svg className="grad-icon" viewBox="0 0 24 24">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z"/>
          </svg>
          <span className="brand-name">SmartAttend</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button onClick={onLogout} className="admin-logout-btn">Logout</button>
        </div>
      </header>

      {/* 2) Header & SaaS Metric Cards Grid */}
      <div className="admin-header-area">
        <div className="admin-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Admin Operations Dashboard</h2>
              {isSuperAdmin && (
                <span style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  Super Admin
                </span>
              )}
            </div>
            <p className="admin-subtitle">Manage campus directory, biometric enrollment, subjects, and hardware nodes.</p>
          </div>
        </div>

        <div className="admin-stats-grid">
          <div className="stat-card stat-mint">
            <div className="stat-card-header">
              <span className="stat-label">Total Teachers</span>
              <span className="stat-icon-pill">👨‍🏫</span>
            </div>
            <span className="stat-value">{stats.totalTeachers}</span>
          </div>

          <div className="stat-card stat-peach">
            <div className="stat-card-header">
              <span className="stat-label">Total Students</span>
              <span className="stat-icon-pill">🎓</span>
            </div>
            <span className="stat-value">{stats.totalStudents}</span>
          </div>

          <div className="stat-card stat-cream">
            <div className="stat-card-header">
              <span className="stat-label">Total Subjects</span>
              <span className="stat-icon-pill">📚</span>
            </div>
            <span className="stat-value">{stats.totalSubjects}</span>
          </div>

          <div className="stat-card stat-coral">
            <div className="stat-card-header">
              <span className="stat-label">ESP32 Devices</span>
              <span className="stat-icon-pill">📟</span>
            </div>
            <span className="stat-value">{stats.totalDevices}</span>
          </div>
        </div>
      </div>

      {message && <p className="admin-status-msg">{message}</p>}

      {/* 3 & 4) Sidebar + Active Right Tab View */}
      <div className="admin-split-layout">
        {/* Left Sidebar */}
        <aside className="admin-sidebar">
          {sidebarOptions.map((label, idx) => (
            <button
              key={idx}
              className={`admin-nav-item ${activeTab === idx + 1 ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(idx + 1);
                setMessage('');
              }}
            >
              {label}
            </button>
          ))}
        </aside>

        {/* Right Active Panel */}
        <main className="admin-tab-content">
          {/* TAB 1: TEACHERS */}
          {activeTab === 1 && (
            <section className="admin-section">
              <h3>1. Teachers</h3>
              <form onSubmit={handleAddTeacher} className="admin-form">
                <input
                  placeholder="Teacher Name"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  required
                />
                <input
                  placeholder="Teacher Email"
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  required
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  required
                />
                <input
                  placeholder="Confirm Password"
                  type="password"
                  value={newTeacher.confirmPassword}
                  onChange={(e) => setNewTeacher({ ...newTeacher, confirmPassword: e.target.value })}
                  required
                />
                <button type="submit" className="portal-btn">Add Teacher</button>
              </form>

              <h4>Teacher List</h4>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>teacher_ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.name}</td>
                        <td>{t.email}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                style={{
                                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={() => handleOpenPasswordModal('teacher', t.id, t.name)}
                              >
                                Change Password
                              </button>
                            )}
                            <button className="delete-btn" onClick={() => handleDeleteTeacher(t.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          

          {/* TAB 2: SUBJECTS */}
          {activeTab === 2 && (
            <section className="admin-section">
              <h3>2. Subjects & Teacher Assignments</h3>
              {/* Subject Creation */}
              <form onSubmit={handleAddSubject} className="admin-form">
                <input
                  placeholder="Subject Name"
                  value={newSubject.subject_name}
                  onChange={(e) => setNewSubject({ ...newSubject, subject_name: e.target.value })}
                  required
                />
                <select
                  value={newSubject.teacher_id}
                  onChange={(e) => setNewSubject({ ...newSubject, teacher_id: e.target.value })}
                > 
                  <option value="">Assign Teacher (Optional)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={newSubject.semester_id}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      semester_id: e.target.value
                    })
                  }
                  required
                >
                  <option value="">Select Semester</option>

                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.semester_name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="portal-btn">Create Subject</button>
              </form>
              {/* Semester Management */}
              <section className="admin-section">

                <h3>Semester Management</h3>

                <form
                  onSubmit={handleAddSemester}
                  className="admin-form"
                >

                  <input
                    type="text"
                    placeholder="Semester Name"
                    value={newSemester.semester_name}
                    onChange={(e) =>
                      setNewSemester({
                        ...newSemester,
                        semester_name: e.target.value
                      })
                    }
                    required
                  />

                  <label>
                    Start Date
                    <input
                      type="date"
                      value={newSemester.start_date}
                      onChange={(e) =>
                        setNewSemester({
                          ...newSemester,
                          start_date: e.target.value
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    End Date
                    <input
                      type="date"
                      value={newSemester.end_date}
                      onChange={(e) =>
                        setNewSemester({
                          ...newSemester,
                          end_date: e.target.value
                        })
                      }
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="portal-btn"
                  >
                    Create Semester
                  </button>

                </form>

              </section>

              <h4>Subjects List</h4>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>sub_ID</th>
                      <th>Subject Name</th>
                      <th>Assigned Teacher</th>
                      <th>Change Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.subject_name}</td>
                        <td>{s.teacher_name}</td>
                        <td>
                          <select
                            value={s.teacher_id || ''}
                            onChange={(e) => handleReassignSubject(s.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 3: STUDENTS */}
          {activeTab === 3 && (
            <section className="admin-section">
              <h3>3. Student Registration & Fingerprint Enrollment</h3>
              
              {/* Student Registration Form */}
              <form onSubmit={handleAddStudent} className="admin-form">
                <input
                  placeholder="Roll Number (e.g. CS-101)"
                  value={newStudent.roll_no}
                  onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })}
                  required
                />
                <input
                  placeholder="Full Name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  required
                />
                <button type="submit" className="portal-btn">
                  Register Student
                </button>
              </form>

              <h4>Registered Students</h4>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Roll No</th>
                      <th>Name</th>
                      <th>Biometric Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td><strong>{s.roll_no || '-'}</strong></td>
                        <td>{s.name}</td>
                        <td>
                          <span style={{ color: s.has_fingerprint ? 'green' : 'orange', fontWeight: 'bold' }}>
                            {s.has_fingerprint ? 'Enrolled' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {s.has_fingerprint ? (
                            <span style={{ color: '#666', fontSize: '12px' }}>Done</span>
                          ) : (
                            <button 
                              onClick={() => handleTriggerEnrollment(s.id, s.roll_no)}
                              className="portal-btn"
                              style={{ padding: '4px 8px', fontSize: '12px', background: '#ffc107', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                            >
                              Scan Fingerprint
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: ENROLLMENTS */}
          {activeTab === 4 && (
            <section className="admin-section">
              <h3>4. Student-Subject Enrollments</h3>
              <form onSubmit={handleAddEnrollment} className="admin-form">
                <select 
                  value={newEnrollment.stu_id} 
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, stu_id: e.target.value })} 
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.roll_no ? `[${s.roll_no}] ` : ''}{s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={newEnrollment.subject_id}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, subject_id: e.target.value })}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                  ))}
                </select>
                <button type="submit" className="portal-btn">Enroll Student</button>
              </form>

              <h4>Active Enrollments</h4>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>enroll_ID</th>
                      <th>Student Name</th>
                      <th>Subject Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...enrollments].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)).map((enr) => (
                      <tr key={enr.id}>
                        <td>{enr.id}</td>
                        <td>{enr.student_name}</td>
                        <td>{enr.subject_name}</td>
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteEnrollment(enr.id)}>Drop</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 5: DEVICES */}
          {activeTab === 5 && (
            <section className="admin-section">
              <h3>5. ESP32 Attendance Devices</h3>
              <form onSubmit={handleAddDevice} className="admin-form">
                <input
                  placeholder="MAC Address (e.g., 24:6F:28:XX:XX:XX)"
                  value={newDevice.mac_address}
                  onChange={(e) => setNewDevice({ ...newDevice, mac_address: e.target.value })}
                  required
                />
                <button type="submit" className="portal-btn">Register Device</button>
              </form>

              <h4>Registered Machines</h4>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>device_ID</th>
                      <th>MAC Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d) => (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td>{d.mac_address}</td>
                        <td>{d.status === 1 ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 6: ADMIN ACCOUNTS */}
          {activeTab === 6 && (
            <section className="admin-accounts-section">

              <h3>System Administrators</h3>

              {/* ADD ADMIN FORM */}
              <form onSubmit={handleAddAdmin} className="admin-form">

                <input
                  type="text"
                  placeholder="Admin Name"
                  value={newAdmin.name}
                  onChange={(e) =>
                    setNewAdmin({
                      ...newAdmin,
                      name: e.target.value
                    })
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Admin Email"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({
                      ...newAdmin,
                      email: e.target.value
                    })
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({
                      ...newAdmin,
                      password: e.target.value
                    })
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) =>
                    setNewAdmin({
                      ...newAdmin,
                      confirmPassword: e.target.value
                    })
                  }
                  required
                />

                <button type="submit" className="portal-btn">
                  Add Admin
                </button>

              </form>

              <h4>Administrator List</h4>

              <div className="table-responsive">
                <table className="admin-accounts-table">

                <thead>
                  <tr>
                    <th>admin_ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role / Action</th>
                  </tr>
                </thead>

                <tbody>

                  {admins.length > 0 ? (
                    admins.map((adm) => (
                      <tr key={adm.id}>

                        <td>{adm.id}</td>

                        <td>{adm.name}</td>

                        <td>{adm.email}</td>

                        <td>
                          {adm.isSuper ? (
                            <span className="protected-badge">
                              Super Admin (Protected)
                            </span>

                          ) : (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  style={{
                                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap'
                                  }}
                                  onClick={() => handleOpenPasswordModal('admin', adm.id, adm.name)}
                                >
                                  Change Password
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAdmin(adm.id)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    ))
                  ) : (

                    <tr>
                      <td colSpan="4">
                        No administrators found.
                      </td>
                    </tr>

                  )}

                </tbody>

              </table>
              </div>

            </section>
          )}
        </main>
      </div>

      {/* Password Reset Modal for Superadmin */}
      {passwordModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            color: 'var(--text-color, #1e293b)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                Direct Password Reset
              </h3>
              <button
                type="button"
                onClick={handleClosePasswordModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'inherit',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', opacity: 0.85, marginBottom: '1.25rem' }}>
              Directly set a new password for <strong>{passwordModal.name}</strong> ({passwordModal.type === 'teacher' ? 'Teacher' : 'Administrator'}).
            </p>

            {passwordModal.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {passwordModal.error}
              </div>
            )}

            <form onSubmit={handleSavePassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={passwordModal.newPassword}
                  onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value, error: '' })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    color: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwordModal.confirmPassword}
                  onChange={(e) => setPasswordModal({ ...passwordModal, confirmPassword: e.target.value, error: '' })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    color: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color, #94a3b8)',
                    color: 'inherit',
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="portal-btn"
                  disabled={passwordModal.loading}
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  {passwordModal.loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}