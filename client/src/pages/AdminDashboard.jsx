import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { adminAPI, authAPI, lecturerAPI } from '../services/api';

const AdminDashboard = () => {
  const [departmentName, setDepartmentName] = useState('');
  const [subjectData, setSubjectData] = useState({ name: '', department: '', semester: '', academicYear: '' });
  const [assignData, setAssignData] = useState({ subjectId: '', lecturerId: '', academicYear: '' });
  const [semesterData, setSemesterData] = useState({ department: '', semester: '', startDate: '', endDate: '', academicYear: '' });

  const normalizeAcademicYear = (value) => {
    if (!value) return '';
    const cleaned = value.trim().replace(/[\uFF0F]/g, '/').replace(/-/g, '/');
    const fourDigit = cleaned.match(/^(\d{4})\s*\/\s*(\d{4})$/);
    if (fourDigit) return `${fourDigit[1].slice(-2)}/${fourDigit[2].slice(-2)}`;
    const twoDigit = cleaned.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (twoDigit) return `${twoDigit[1]}/${twoDigit[2]}`;
    return cleaned;
  };

  const getAverageColor = (avg) => {
    if (avg >= 4.5) return 'text-emerald-600';
    if (avg >= 4.0) return 'text-green-600';
    if (avg >= 3.0) return 'text-yellow-600';
    if (avg >= 2.0) return 'text-orange-600';
    return 'text-red-600';
  };
  const [userId, setUserId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [studentFilters, setStudentFilters] = useState({ department: '', semester: '' });
  const [subjectFilters, setSubjectFilters] = useState({ department: '', semester: '' });
  const [plannerFilters, setPlannerFilters] = useState({ department: '', academicYear: '' });
  const [dashboardData, setDashboardData] = useState({
    students: [],
    lecturers: [],
    hods: [],
    departments: [],
    subjects: [],
    semesters: []
  });
  const [editingSemester, setEditingSemester] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('pending');
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [lecturerImportFile, setLecturerImportFile] = useState(null);
  const [lecturerImportResult, setLecturerImportResult] = useState(null);
  const [lecturerImporting, setLecturerImporting] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    academicYear: '',
    year: '',
    semester: '',
    department: '',
    subject: '',
  });
  const [reports, setReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const adminSections = [
    { id: 'pending', label: 'Pending approvals' },
    { id: 'departments', label: 'Departments' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'students', label: 'Students' },
    { id: 'lecturers', label: 'Lecturers' },
    { id: 'feedback', label: 'Feedback summary' },
  ];
  const hodSections = [
    { id: 'assignments', label: 'Lecturer assignments' },
    { id: 'semesters', label: 'Semesters' },
    { id: 'feedback', label: 'Feedback summary' },
  ];
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isHod = user?.role === 'hod';
  const isAdmin = user?.role === 'admin';
  const sections = isHod ? hodSections : adminSections;

  const fetchDepartments = async () => {
    try {
      if (isHod) {
        return;
      }
      const res = await authAPI.getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await adminAPI.getDashboardData();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await adminAPI.getPendingUsers();
      setPendingUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch pending users', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchDashboardData();
    if (isAdmin) {
      fetchPendingUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isHod) {
      setActiveSection('assignments');
    }
  }, [isHod]);

  useEffect(() => {
    if (isHod) {
      setDepartments(dashboardData.departments);
    }
  }, [isHod, dashboardData.departments]);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addDepartment({ name: departmentName });
      alert('Department added');
      setDepartmentName('');
      await Promise.all([fetchDashboardData(), fetchDepartments()]);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error adding department');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addSubject({ ...subjectData, academicYear: normalizeAcademicYear(subjectData.academicYear) });
      alert('Subject added');
      setSubjectData({ name: '', department: '', semester: '', academicYear: '' });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error adding subject');
    }
  };

  const handleAssignLecturer = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.assignLecturer(assignData.subjectId, { lecturerId: assignData.lecturerId, academicYear: normalizeAcademicYear(assignData.academicYear) });
      alert('Lecturer assigned to subject');
      setAssignData({ subjectId: '', lecturerId: '', academicYear: '' });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error assigning lecturer');
    }
  };

  const handleSetSemester = async (e) => {
    e.preventDefault();
    try {
        await adminAPI.setSemester({ ...semesterData, academicYear: normalizeAcademicYear(semesterData.academicYear) });
      alert('Semester set'); 
      setSemesterData({ department: '', semester: '', startDate: '', endDate: '', academicYear: '' });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error setting semester');
    }
  };

  const handleUpdateSemester = async (e) => {
    e.preventDefault();
    if (!editingSemester) return;
    try {
      await adminAPI.updateSemester(editingSemester._id, {
        startDate: editingSemester.startDate,
        endDate: editingSemester.endDate,
        academicYear: normalizeAcademicYear(editingSemester.academicYear),
      });
      alert('Semester dates updated');
      setEditingSemester(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error updating semester');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await adminAPI.deleteDepartment(deptId);
      fetchDepartments();
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting department');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await adminAPI.deleteSubject(subjectId);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting subject');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminAPI.deleteUser(userId);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  const handleApproval = async (userId, approve) => {
    const action = approve ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await adminAPI.updateUserApproval(userId, { approve });
      alert(`User ${action}ed successfully`);
      fetchPendingUsers(); // Refresh pending list
      fetchDashboardData(); // Refresh main dashboard data if user was approved
    } catch (err) {
      alert(err.response?.data?.message || `Error ${action}ing user`);
    }
  };

  const handlePromoteToHod = async (userId) => {
    if (!window.confirm('Promote this lecturer to HOD?')) return;
    try {
      await adminAPI.promoteToHod(userId);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to promote lecturer');
    }
  };

  const handleDemoteHod = async (userId) => {
    if (!window.confirm('Demote this HOD to lecturer?')) return;
    try {
      await adminAPI.demoteHod(userId);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to demote HOD');
    }
  };

  const handleImportStudents = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert('Please select an Excel file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setImporting(true);
      setImportResult(null);
      const res = await adminAPI.importStudents(formData);
      setImportResult(res.data);
      setImportFile(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Student import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleImportLecturers = async (e) => {
    e.preventDefault();
    if (!lecturerImportFile) {
      alert('Please select an Excel file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', lecturerImportFile);

    try {
      setLecturerImporting(true);
      setLecturerImportResult(null);
      const res = await adminAPI.importLecturers(formData);
      setLecturerImportResult(res.data);
      setLecturerImportFile(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lecturer import failed');
    } finally {
      setLecturerImporting(false);
    }
  };

  const studentSemesterOptions = Array.from(
    new Set(dashboardData.students.map((s) => `${s.year} ${s.semester}`))
  ).sort();

  const subjectSemesterOptions = Array.from(
    new Set([
      ...dashboardData.subjects.map((s) => s.semester),
      ...dashboardData.semesters.map((s) => s.semester),
    ])
  ).sort();

  const plannerAcademicYears = Array.from(
    new Set([
      ...dashboardData.semesters.map((s) => s.academicYear).filter(Boolean),
      ...dashboardData.subjects.map((s) => s.academicYear).filter(Boolean),
    ])
  ).sort();

  const handleReportFilterChange = (key, value) => {
    setReportFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildReportParams = () => {
    const params = {};
    if (reportFilters.academicYear) params.academicYear = reportFilters.academicYear;
    if (reportFilters.year && reportFilters.semester) {
      params.year = reportFilters.year;
      params.semester = reportFilters.semester;
    }
    if (reportFilters.subject) params.subject = reportFilters.subject;
    if (isAdmin && reportFilters.department) params.department = reportFilters.department;
    return params;
  };

  const validateReportFilters = () => {
    if ((reportFilters.year && !reportFilters.semester) || (!reportFilters.year && reportFilters.semester)) {
      setReportError('Select both year and semester to filter by term.');
      return false;
    }
    setReportError('');
    return true;
  };

  const fetchReports = async () => {
    if (!validateReportFilters()) return;
    const params = buildReportParams();

    try {
      setReportLoading(true);
      const res = await lecturerAPI.getReport(params);
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to fetch feedback summary', err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReports = async () => {
    if (!validateReportFilters()) return;
    const params = buildReportParams();
    const academicYearSafe = (reportFilters.academicYear || 'all').replace(/\//g, '-');

    try {
      setDownloadLoading(true);
      const res = await adminAPI.downloadFeedbackReportPdf(params);
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `feedback-reports-${academicYearSafe}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download feedback reports', err);
      alert('Failed to download feedback reports');
    } finally {
      setDownloadLoading(false);
    }
  };

  const filteredStudents = dashboardData.students.filter((s) => {
    const deptId = s.userId?.department?._id;
    const semLabel = `${s.year} ${s.semester}`;
    const matchesDept = studentFilters.department ? deptId === studentFilters.department : true;
    const matchesSem = studentFilters.semester ? semLabel === studentFilters.semester : true;
    return matchesDept && matchesSem;
  });

  const filteredDepartmentsForSubjects =
    subjectFilters.department && subjectFilters.semester
      ? dashboardData.departments.filter((d) => d._id === subjectFilters.department)
      : [];

  const lecturerRoster = isAdmin
    ? [...dashboardData.lecturers, ...dashboardData.hods]
    : dashboardData.lecturers;

  const assignmentLecturers = [...dashboardData.lecturers];
  if (isHod && user?.id && !assignmentLecturers.some((lecturer) => lecturer._id === user.id)) {
    assignmentLecturers.push({ _id: user.id, name: user.name || 'HOD' });
  }

  const reportSubjectOptions = dashboardData.subjects.filter((subject) => {
    const deptId = subject.department?._id || subject.department;
    if (isAdmin && reportFilters.department && deptId !== reportFilters.department) return false;
    if (reportFilters.academicYear && subject.academicYear !== reportFilters.academicYear) return false;
    if (reportFilters.year && reportFilters.semester) {
      const termLabel = `${reportFilters.year} ${reportFilters.semester}`;
      if (subject.semester !== termLabel) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!reportFilters.subject) return;
    const stillValid = reportSubjectOptions.some((s) => s._id === reportFilters.subject);
    if (!stillValid) {
      setReportFilters((prev) => ({ ...prev, subject: '' }));
    }
  }, [reportSubjectOptions, reportFilters.subject]);


  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-600" aria-hidden="true"></div>
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 18% 20%, rgba(255,255,255,0.25), transparent 35%), radial-gradient(circle at 85% 10%, rgba(255,255,255,0.2), transparent 30%)' }} aria-hidden="true"></div>
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">{isHod ? 'HOD Control Center' : 'Admin Control Center'}</p>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">{isHod ? 'Manage department planning' : 'Manage approvals and academic data'}</h1>
              <p className="text-white/80 max-w-2xl">{isHod ? 'Use the sidebar to manage lecturer assignments and semester timelines.' : 'Use the sidebar to manage approvals, departments, subjects, and users.'}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20 text-sm font-semibold">Role: {isHod ? 'HOD' : 'Admin'}</span>
              {isHod && (
                <button
                  onClick={() => navigate('/lecturer')}
                  className="px-5 py-3 rounded-2xl bg-white/20 border border-white/30 text-white font-semibold shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  Lecturer dashboard
                </button>
              )}
              <button onClick={logout} className="px-5 py-3 rounded-2xl bg-white text-gray-900 font-semibold shadow-lg hover:-translate-y-0.5 transition-all duration-200">Logout</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="card-surface rounded-3xl p-4 h-fit lg:sticky lg:top-6">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Navigation</p>
              <h2 className="text-lg font-bold text-gray-900">{isHod ? 'HOD sections' : 'Admin sections'}</h2>
            </div>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    activeSection === section.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-white/70 text-slate-700 hover:bg-white'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="space-y-6">
            {activeSection === 'pending' && (
              <div className="card-surface rounded-3xl p-6 interactive-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Pending lecturer approvals ({pendingUsers.length})</h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">Action Required</span>
                </div>
                <ul className="space-y-3">
                  {pendingUsers.map((user) => (
                    <li key={user._id} className="flex justify-between items-start bg-gray-50 border border-gray-100 rounded-2xl p-3">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                        <p className="text-gray-500 text-xs mt-1">Dept: {user.department?.name || 'N/A'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproval(user._id, true)} className="text-green-600 hover:text-green-700 text-xs font-semibold">Approve</button>
                        <button onClick={() => handleApproval(user._id, false)} className="text-red-600 hover:text-red-700 text-xs font-semibold">Reject</button>
                      </div>
                    </li>
                  ))}
                  {pendingUsers.length === 0 && <p className="text-gray-500 italic">No pending approvals.</p>}
                </ul>
              </div>
            )}

            {activeSection === 'departments' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Add Department</h2>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">Organize</span>
                  </div>
                  <form onSubmit={handleAddDepartment} className="space-y-4">
                    <input
                      type="text"
                      placeholder="e.g., Computer Science"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      required
                    />
                    <button type="submit" className="w-full py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg">Add department</button>
                  </form>
                </div>

                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Departments ({dashboardData.departments.length})</h3>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700">Names</span>
                  </div>
                  <ul className="grid grid-cols-1 gap-3">
                    {dashboardData.departments.map((dept) => (
                      <li key={dept._id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div>
                          <p className="font-semibold text-gray-900">{dept.name}</p>
                          <p className="text-xs text-gray-500">ID: {dept._id}</p>
                        </div>
                        <button onClick={() => handleDeleteDepartment(dept._id)} className="text-red-600 hover:text-red-700 text-xs font-semibold">Remove</button>
                      </li>
                    ))}
                    {dashboardData.departments.length === 0 && <p className="text-gray-500 italic">No departments found.</p>}
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'subjects' && (
              <div className="space-y-6">
                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Add Subject</h2>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">Map to department</span>
                  </div>
                  <form onSubmit={handleAddSubject} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Subject Name"
                      value={subjectData.name}
                      onChange={(e) => setSubjectData({ ...subjectData, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      required
                    />
                    <select
                      value={subjectData.department}
                      onChange={(e) => setSubjectData({ ...subjectData, department: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dep) => (
                        <option key={dep._id} value={dep._id}>{dep.name}</option>
                      ))}
                    </select>
                    <select
                      value={subjectData.semester}
                      onChange={(e) => setSubjectData({ ...subjectData, semester: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      required
                    >
                      <option value="">Select Semester</option>
                      <option value="Year I Semester I">Year I Semester I</option>
                      <option value="Year I Semester II">Year I Semester II</option>
                      <option value="Year II Semester I">Year II Semester I</option>
                      <option value="Year II Semester II">Year II Semester II</option>
                      <option value="Year III Semester I">Year III Semester I</option>
                      <option value="Year III Semester II">Year III Semester II</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Academic Year (e.g., 23/24)"
                      value={subjectData.academicYear || ''}
                      onChange={(e) => setSubjectData({ ...subjectData, academicYear: normalizeAcademicYear(e.target.value) })}
                      onBlur={() => setSubjectData((prev) => ({ ...prev, academicYear: normalizeAcademicYear(prev.academicYear) }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      title="Use YY/YY format, e.g., 23/24"
                      required
                    />
                    <button type="submit" className="w-full py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg">Add subject</button>
                  </form>
                </div>

                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Subjects by Department & Semester</h3>
                    <div className="flex gap-2 items-center text-sm">
                      <select
                        value={subjectFilters.department}
                        onChange={(e) => setSubjectFilters((prev) => ({ ...prev, department: e.target.value }))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                        required
                      >
                        <option value="">Department...</option>
                        {departments.map((dep) => (
                          <option key={dep._id} value={dep._id}>{dep.name}</option>
                        ))}
                      </select>
                      <select
                        value={subjectFilters.semester}
                        onChange={(e) => setSubjectFilters((prev) => ({ ...prev, semester: e.target.value }))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                        required
                      >
                        <option value="">Semester...</option>
                        {subjectSemesterOptions.map((sem) => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!subjectFilters.department || !subjectFilters.semester ? (
                    <p className="text-gray-500 text-sm">Select both department and semester to view subjects.</p>
                  ) : filteredDepartmentsForSubjects.length === 0 ? (
                    <p className="text-gray-500 text-sm">No subjects found for the selected filters.</p>
                  ) : (
                    <div className="space-y-6">
                      {filteredDepartmentsForSubjects.map(dept => {
                        const deptSubjects = dashboardData.subjects.filter(s => s.department?._id === dept._id);
                        const deptSemesters = dashboardData.semesters?.filter(s => s.department?._id === dept._id) || [];

                        if (deptSubjects.length === 0 && deptSemesters.length === 0) return null;

                        const semestersSet = [...new Set([
                          ...deptSubjects.map(s => s.semester),
                          ...deptSemesters.map(s => s.semester)
                        ])].sort();

                        const filteredSemesters = semestersSet.filter((sem) => sem === subjectFilters.semester);

                        return (
                          <div key={dept._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-bold text-gray-900">{dept.name}</h4>
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">{filteredSemesters.length} semester{filteredSemesters.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredSemesters.map((semester) => {
                                const subjects = deptSubjects.filter(s => s.semester === semester);
                                return (
                                  <div key={semester} className="interactive-card bg-white rounded-2xl p-4 border border-gray-100">
                                    <div className="mb-2">
                                      <h5 className="font-semibold text-gray-900">{semester}</h5>
                                    </div>
                                    <ul className="space-y-2">
                                      {subjects.map(subject => (
                                        <li key={subject._id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-2">
                                          <span className="font-semibold text-gray-900">{subject.name}</span>
                                          <button onClick={() => handleDeleteSubject(subject._id)} className="text-red-600 hover:text-red-700 text-[11px] font-semibold ml-3">Remove</button>
                                        </li>
                                      ))}
                                      {subjects.length === 0 && <p className="text-gray-500 text-xs italic">No subjects added.</p>}
                                    </ul>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'assignments' && (
              <div className="card-surface rounded-3xl p-6 interactive-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Assign Lecturer to Subject</h2>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">Link</span>
                </div>
                <form onSubmit={handleAssignLecturer} className="space-y-3">
                  <select
                    value={assignData.subjectId}
                    onChange={(e) => setAssignData({ ...assignData, subjectId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  >
                    <option value="">Select Subject</option>
                    {dashboardData.subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} • {subject.semester}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Academic Year (e.g., 23/24)"
                    value={assignData.academicYear}
                    onChange={(e) => setAssignData({ ...assignData, academicYear: normalizeAcademicYear(e.target.value) })}
                    onBlur={() => setAssignData((prev) => ({ ...prev, academicYear: normalizeAcademicYear(prev.academicYear) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    title="Use YY/YY format, e.g., 23/24"
                    required
                  />
                  <select
                    value={assignData.lecturerId}
                    onChange={(e) => setAssignData({ ...assignData, lecturerId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  >
                    <option value="">Select Lecturer</option>
                    {assignmentLecturers.map((lecturer) => (
                      <option key={lecturer._id} value={lecturer._id}>{lecturer.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="w-full py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg">Assign lecturer</button>
                </form>
              </div>
            )}

            {activeSection === 'semesters' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="card-surface rounded-3xl p-6 interactive-card lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Set Semester Dates</h2>
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">Timeline</span>
                    </div>
                    <form onSubmit={handleSetSemester} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          value={semesterData.department}
                          onChange={(e) => setSemesterData({ ...semesterData, department: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((dep) => (
                            <option key={dep._id} value={dep._id}>{dep.name}</option>
                          ))}
                        </select>
                        <select
                          value={semesterData.semester}
                          onChange={(e) => setSemesterData({ ...semesterData, semester: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                          required
                        >
                          <option value="">Select Semester</option>
                          <option value="Year I Semester I">Year I Semester I</option>
                          <option value="Year I Semester II">Year I Semester II</option>
                          <option value="Year II Semester I">Year II Semester I</option>
                          <option value="Year II Semester II">Year II Semester II</option>
                          <option value="Year III Semester I">Year III Semester I</option>
                          <option value="Year III Semester II">Year III Semester II</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="date"
                          placeholder="Start Date"
                          value={semesterData.startDate}
                          onChange={(e) => setSemesterData({ ...semesterData, startDate: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                          required
                        />
                        <input
                          type="date"
                          placeholder="End Date"
                          value={semesterData.endDate}
                          onChange={(e) => setSemesterData({ ...semesterData, endDate: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Academic Year (e.g., 23/24)"
                          value={semesterData.academicYear}
                          onChange={(e) => setSemesterData({ ...semesterData, academicYear: normalizeAcademicYear(e.target.value) })}
                          onBlur={() => setSemesterData((prev) => ({ ...prev, academicYear: normalizeAcademicYear(prev.academicYear) }))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                          title="Use YY/YY format, e.g., 23/24"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg">Set semester</button>
                    </form>
                  </div>

                  <div className="card-surface rounded-3xl p-6 interactive-card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Quick checks</h2>
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">Guide</span>
                    </div>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <span className="text-emerald-500 mt-1">✓</span>
                        <div>
                          <p className="font-semibold">Use departments before subjects</p>
                          <p className="text-sm text-gray-500">Create the department so you can map subjects and semesters cleanly.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <span className="text-blue-500 mt-1">✓</span>
                        <div>
                          <p className="font-semibold">Assign a lecturer each time</p>
                          <p className="text-sm text-gray-500">Lecturer selection is required to keep analytics meaningful.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <span className="text-amber-500 mt-1">✓</span>
                        <div>
                          <p className="font-semibold">Set semester dates</p>
                          <p className="text-sm text-gray-500">Students see accurate timelines and lecturers know the evaluation window.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Semester timelines & lecturer assignments</h3>
                      <p className="text-xs text-gray-500">Shows set dates, academic year, and assigned lecturers per batch</p>
                    </div>
                    <div className="flex gap-2 items-center text-sm">
                      <select
                        value={plannerFilters.department}
                        onChange={(e) => setPlannerFilters((prev) => ({ ...prev, department: e.target.value }))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                        required
                      >
                        <option value="">Department...</option>
                        {departments.map((dep) => (
                          <option key={dep._id} value={dep._id}>{dep.name}</option>
                        ))}
                      </select>
                      <select
                        value={plannerFilters.academicYear}
                        onChange={(e) => setPlannerFilters((prev) => ({ ...prev, academicYear: e.target.value }))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                        required
                      >
                        <option value="">Academic year...</option>
                        {plannerAcademicYears.map((ay) => (
                          <option key={ay} value={ay}>{ay}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!plannerFilters.department || !plannerFilters.academicYear ? (
                    <p className="text-gray-500 text-sm">Choose department and academic year to view timelines and lecturer assignments.</p>
                  ) : dashboardData.semesters.length === 0 ? (
                    <p className="text-gray-500 text-sm">No semesters have been configured yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {dashboardData.departments
                        .filter((dept) => dept._id === plannerFilters.department)
                        .map((dept) => {
                          const deptSemesters = dashboardData.semesters.filter(
                            (s) => s.department?._id === dept._id && s.academicYear === plannerFilters.academicYear
                          );
                          if (deptSemesters.length === 0) {
                            return (
                              <div key={dept._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-bold text-gray-900">{dept.name}</h4>
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">0 semesters</span>
                                </div>
                                <p className="text-gray-500 text-xs italic">No semesters found for this academic year.</p>
                              </div>
                            );
                          }

                          return (
                            <div key={dept._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-gray-900">{dept.name}</h4>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">{deptSemesters.length} semester{deptSemesters.length !== 1 ? 's' : ''}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {deptSemesters.map((sem) => {
                                  const semSubjects = dashboardData.subjects.filter(
                                    (subj) =>
                                      subj.department?._id === dept._id &&
                                      subj.semester === sem.semester &&
                                      (!subj.academicYear || subj.academicYear === plannerFilters.academicYear)
                                  );

                                  return (
                                    <div key={sem._id || sem.semester} className="interactive-card bg-white rounded-2xl p-4 border border-gray-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <h5 className="font-semibold text-gray-900">{sem.semester}</h5>
                                          <p className="text-[11px] font-semibold text-slate-600">AY {sem.academicYear || 'N/A'}</p>
                                        </div>
                                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                          {sem.startDate ? new Date(sem.startDate).toLocaleDateString() : 'Start ?'} - {sem.endDate ? new Date(sem.endDate).toLocaleDateString() : 'End ?'}
                                        </span>
                                      </div>

                                      {semSubjects.length > 0 ? (
                                        <ul className="space-y-2">
                                          {semSubjects.map((subject) => (
                                            <li key={subject._id} className="bg-gray-50 border border-gray-100 rounded-xl p-2">
                                              <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-900">{subject.name}</span>
                                                {subject.lecturerId?.userId ? (
                                                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                                                    {subject.lecturerId.userId.name}
                                                  </span>
                                                ) : (
                                                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Unassigned</span>
                                                )}
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-gray-500 text-xs italic">No subjects or lecturer assignments for this batch yet.</p>
                                      )}

                                      <div className="flex justify-end mt-3">
                                        <button
                                          type="button"
                                          onClick={() => setEditingSemester({
                                            _id: sem._id,
                                            startDate: sem.startDate?.slice(0, 10) || '',
                                            endDate: sem.endDate?.slice(0, 10) || '',
                                            academicYear: sem.academicYear || '',
                                            title: `${dept.name} • ${sem.semester}`,
                                          })}
                                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                        >
                                          Edit dates
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'students' && (
              <div className="space-y-6">
                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Import students from Excel</h3>
                      <p className="text-xs text-gray-500">Columns: name, email, department, year, semester, academicYear</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">Bulk upload</span>
                  </div>
                  <form onSubmit={handleImportStudents} className="space-y-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg"
                      disabled={importing}
                    >
                      {importing ? 'Importing...' : 'Upload and import'}
                    </button>
                  </form>

                  {importResult && (
                    <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-gray-800">Imported: {importResult.imported}</p>
                      <p className="text-sm font-semibold text-gray-800">Skipped: {importResult.skipped}</p>
                      {importResult.failed?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-red-600">Failed rows</p>
                          <ul className="mt-2 space-y-2 text-sm text-gray-700">
                            {importResult.failed.map((item, index) => (
                              <li key={`${item.row}-${index}`} className="bg-white border border-gray-100 rounded-xl p-2">
                                Row {item.row}: {item.email} — {item.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Students ({filteredStudents.length})</h3>
                      <p className="text-xs text-gray-500">Filter by department and semester</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={studentFilters.department}
                        onChange={(e) => setStudentFilters((prev) => ({ ...prev, department: e.target.value }))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                      >
                        <option value="">All departments</option>
                        {departments.map((dep) => (
                          <option key={dep._id} value={dep._id}>{dep.name}</option>
                        ))}
                      </select>
                      <select
                        value={studentFilters.semester}
                        onChange={(e) => setStudentFilters((prev) => ({ ...prev, semester: e.target.value }))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                      >
                        <option value="">All semesters</option>
                        {studentSemesterOptions.map((sem) => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {filteredStudents.map((student) => (
                      <li key={student._id} className="flex justify-between items-start bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div>
                          <p className="font-semibold text-gray-900">{student.userId?.name}</p>
                          <p className="text-gray-600 text-sm">{student.userId?.email}</p>
                          <p className="text-gray-500 text-xs mt-1">Dept: {student.userId?.department?.name || 'N/A'}</p>
                          <p className="text-gray-500 text-xs">Semester: {student.year} {student.semester}</p>
                          <p className="text-gray-500 text-xs">Academic Year: {student.academicYear || 'N/A'}</p>
                        </div>
                        <button onClick={() => handleDeleteUser(student.userId?._id)} className="text-red-600 hover:text-red-700 text-xs font-semibold">Remove</button>
                      </li>
                    ))}
                    {filteredStudents.length === 0 && <p className="text-gray-500 italic">No students found for the selected filters.</p>}
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'lecturers' && (
              <div className="space-y-6">
                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Import lecturers from Excel</h3>
                      <p className="text-xs text-gray-500">Columns: name, email, department</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">Bulk upload</span>
                  </div>
                  <form onSubmit={handleImportLecturers} className="space-y-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setLecturerImportFile(e.target.files?.[0] || null)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg"
                      disabled={lecturerImporting}
                    >
                      {lecturerImporting ? 'Importing...' : 'Upload and import'}
                    </button>
                  </form>

                  {lecturerImportResult && (
                    <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-gray-800">Imported: {lecturerImportResult.imported}</p>
                      <p className="text-sm font-semibold text-gray-800">Skipped: {lecturerImportResult.skipped}</p>
                      {lecturerImportResult.failed?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-red-600">Failed rows</p>
                          <ul className="mt-2 space-y-2 text-sm text-gray-700">
                            {lecturerImportResult.failed.map((item, index) => (
                              <li key={`${item.row}-${index}`} className="bg-white border border-gray-100 rounded-xl p-2">
                                Row {item.row}: {item.email} — {item.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Lecturers ({lecturerRoster.length})</h3>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700">Manage</span>
                  </div>
                  <ul className="space-y-3">
                    {lecturerRoster.map((lecturer) => (
                      <li key={lecturer._id} className="flex justify-between items-start bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {lecturer.name}
                            {lecturer.role === 'hod' && (
                              <span className="ml-2 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">HOD</span>
                            )}
                          </p>
                          <p className="text-gray-600 text-sm">{lecturer.email}</p>
                          <p className="text-gray-500 text-xs mt-1">Dept: {lecturer.department?.name || 'N/A'}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {isAdmin && lecturer.role === 'lecturer' && (
                            <button onClick={() => handlePromoteToHod(lecturer._id)} className="text-amber-600 hover:text-amber-700 text-xs font-semibold">Promote to HOD</button>
                          )}
                          {isAdmin && lecturer.role === 'hod' && (
                            <button onClick={() => handleDemoteHod(lecturer._id)} className="text-amber-600 hover:text-amber-700 text-xs font-semibold">Demote to lecturer</button>
                          )}
                          <button onClick={() => handleDeleteUser(lecturer._id)} className="text-red-600 hover:text-red-700 text-xs font-semibold">Remove</button>
                        </div>
                      </li>
                    ))}
                    {lecturerRoster.length === 0 && <p className="text-gray-500 italic">No lecturers found.</p>}
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'feedback' && (
              <div className="space-y-6">
                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Feedback summary</h3>
                      <p className="text-xs text-gray-500">Filter by academic year, term, and subject to review averages.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={fetchReports}
                        className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        {reportLoading ? 'Loading...' : 'Apply filters'}
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleDownloadReports}
                          className="px-5 py-3 rounded-2xl bg-white text-slate-900 text-sm font-semibold border border-slate-200 shadow-lg hover:-translate-y-0.5 transition-all"
                          disabled={downloadLoading}
                        >
                          {downloadLoading ? 'Preparing ZIP...' : 'Download PDFs'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Academic year</label>
                      <select
                        value={reportFilters.academicYear}
                        onChange={(e) => handleReportFilterChange('academicYear', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none"
                      >
                        <option value="">All</option>
                        {plannerAcademicYears.map((ay) => (
                          <option key={ay} value={ay}>{ay}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Year</label>
                      <select
                        value={reportFilters.year}
                        onChange={(e) => handleReportFilterChange('year', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none"
                      >
                        <option value="">All</option>
                        {['Year I', 'Year II', 'Year III'].map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Semester</label>
                      <select
                        value={reportFilters.semester}
                        onChange={(e) => handleReportFilterChange('semester', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none"
                      >
                        <option value="">All</option>
                        {['Semester I', 'Semester II'].map((semester) => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    </div>

                    {isAdmin && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Department</label>
                        <select
                          value={reportFilters.department}
                          onChange={(e) => handleReportFilterChange('department', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none"
                        >
                          <option value="">All</option>
                          {departments.map((dep) => (
                            <option key={dep._id} value={dep._id}>{dep.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Subject</label>
                      <select
                        value={reportFilters.subject}
                        onChange={(e) => handleReportFilterChange('subject', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none"
                      >
                        <option value="">All subjects</option>
                        {reportSubjectOptions.map((subject) => (
                          <option key={subject._id} value={subject._id}>{subject.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {reportError && (
                    <p className="mt-4 text-sm font-semibold text-rose-600">{reportError}</p>
                  )}
                </div>

                <div className="card-surface rounded-3xl p-6 interactive-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Report results</h3>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700">{reports.length} subjects</span>
                  </div>

                  {reports.length === 0 ? (
                    <p className="text-gray-500 italic">No feedback summaries found for the selected filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {reports.map((report) => (
                        <div key={report.subjectId} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">{report.subject}</h4>
                              <p className="text-xs text-gray-500">Subject ID: {report.subjectId}</p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-900 text-white">{report.totalFeedbacks} entries</span>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Overall average</span>
                            <span className={`text-lg font-black ${getAverageColor(report.overallAverage)}`}>
                              {report.totalFeedbacks ? report.overallAverage.toFixed(1) : '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        {editingSemester && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Edit semester</p>
                  <h3 className="text-xl font-bold text-gray-900">{editingSemester.title || 'Update dates'}</h3>
                </div>
                <button onClick={() => setEditingSemester(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleUpdateSemester} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Start date</label>
                    <input
                      type="date"
                      value={editingSemester.startDate}
                      onChange={(e) => setEditingSemester({ ...editingSemester, startDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">End date</label>
                    <input
                      type="date"
                      value={editingSemester.endDate}
                      onChange={(e) => setEditingSemester({ ...editingSemester, endDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Academic year (YY/YY)</label>
                    <input
                      type="text"
                      value={editingSemester.academicYear || ''}
                      onChange={(e) => setEditingSemester({ ...editingSemester, academicYear: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      pattern="\d{2}/\d{2}"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg">Save changes</button>
                  <button type="button" onClick={() => setEditingSemester(null)} className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;