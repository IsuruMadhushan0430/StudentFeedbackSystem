import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { authAPI } from '../services/api';
import heroImage from '../assets/login.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    academicYear: '',
    role: 'student',
    department: '',
    year: '',
    semester: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await authAPI.getDepartments();
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepartments();
  }, []);

  const normalizeAcademicYear = (value) => {
    if (!value) return '';
    const cleaned = value
      .trim()
      .replace(/[\uFF0F]/g, '/') // normalize full-width slash
      .replace(/-/g, '/'); // allow hyphen input
    const fourDigit = cleaned.match(/^(\d{4})\s*\/\s*(\d{4})$/);
    if (fourDigit) {
      return `${fourDigit[1].slice(-2)}/${fourDigit[2].slice(-2)}`;
    }
    const twoDigit = cleaned.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (twoDigit) {
      return `${twoDigit[1]}/${twoDigit[2]}`;
    }
    return cleaned;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'academicYear') {
      setFormData({ ...formData, [name]: normalizeAcademicYear(value) });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if ((formData.password || '').length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      year: formData.year,
      semester: formData.semester,
    };

    if (formData.role === 'student') {
      const normalizedAY = normalizeAcademicYear(formData.academicYear);
      if (!/^\d{2}\/\d{2}$/.test(normalizedAY)) {
        setError('Academic year must be YY/YY (e.g., 23/24).');
        return;
      }
      payload.academicYear = normalizedAY;
    }

    // Only send department when required (student or lecturer)
    if (formData.role !== 'admin') {
      payload.department = formData.department;
    }

    try {
      const res = await authAPI.register(payload);

      if (formData.role === 'lecturer') {
        setSuccess('Registration submitted. Please wait for admin approval before logging in.');
        setFormData({
          name: '',
          email: '',
          password: '',
          academicYear: '',
          role: 'student',
          department: '',
          year: '',
          semester: '',
        });
        return;
      }

      login(res.data.token, res.data.user);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      const apiError = err.response?.data;
      const message = apiError?.message || apiError?.errors?.[0]?.msg || 'Registration failed';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
        <div className="card-surface rounded-3xl p-8 lg:p-10 interactive-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Create account</p>
              <h2 className="text-2xl font-bold text-gray-900">Join the feedback workspace</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white">Step 1 of 1</span>
          </div>

          {error && <p className="text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm">{error}</p>}
          {success && <p className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 text-sm">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full name</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
                    <circle cx="12" cy="9" r="3.5" />
                  </svg>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name Here"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-transparent outline-none placeholder:text-center"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-transparent outline-none placeholder:text-center"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <svg
                  className="w-5 h-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="9" width="14" height="11" rx="2" ry="2" />
                  <path d="M8 9V7a4 4 0 1 1 8 0v2" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none placeholder:text-center"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                </select>
              </div>

              {formData.role !== 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((dep) => (
                      <option key={dep._id} value={dep._id}>{dep.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {formData.role === 'student' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Academic Year (YY/YY)</label>
                  <input
                    type="text"
                    name="academicYear"
                    placeholder="21/22"
                    value={formData.academicYear}
                    onChange={handleChange}
                    onBlur={() => setFormData((prev) => ({ ...prev, academicYear: normalizeAcademicYear(prev.academicYear) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-center"
                    title="Use YY/YY format, e.g., 23/24"
                    required
                  />
                  <p className="text-xs text-gray-500">Tip: 2023/2024 will auto-format to 23/24.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  >
                    <option value="">Select year</option>
                    <option value="Year I">Year I</option>
                    <option value="Year II">Year II</option>
                    <option value="Year III">Year III</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  >
                    <option value="">Select semester</option>
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="w-full py-3 rounded-2xl text-white font-semibold shadow-lg transition-all duration-200 neon-pill">Register</button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Already registered?</p>
              <p className="text-gray-500">Sign in to access your dashboard.</p>
            </div>
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
          </div>
        </div>

        <div
          className="glass-panel rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-slate-900/70"></div>
          <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.32), transparent 40%), radial-gradient(circle at 85% 30%, rgba(34,211,238,0.25), transparent 35%)' }}></div>
          <div className="relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 neon-pill px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em]">
              Instant access
            </span>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight">Designed for every role</h1>
            <p className="text-lg text-slate-200/90 max-w-xl">
              Students share anonymous feedback, lecturers get actionable insights, and admins orchestrate the entire workflow with confidence.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-100/90">
              {[{
                title: 'Students',
                desc: 'Fast feedback loops with rating grids and comments.'
              }, {
                title: 'Lecturers',
                desc: 'Performance analytics with averages and comments feed.'
              }, {
                title: 'Admins',
                desc: 'Control departments, semesters, and user access.'
              }].map((item) => (
                <div key={item.title} className="rounded-2xl p-4 bg-white/5 border-white/10">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">{item.title}</p>
                  <p className="font-semibold leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;