import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { authAPI } from '../services/api';
import heroImage from '../assets/login.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((formData.password || '').length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    try {
      const res = await authAPI.login(formData);
      login(res.data.token, res.data.user);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
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
          <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(99,102,241,0.32), transparent 40%), radial-gradient(circle at 80% 10%, rgba(34,211,238,0.25), transparent 35%)' }}></div>
          <div className="relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 neon-pill px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em]">
              <span className="h-2 w-2 bg-black rounded-full animate-pulse"></span>
              Realtime feedback
            </span>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight">Student Feedback System</h1>
            <p className="text-lg text-slate-200/90 max-w-xl">
              Capture sentiment, surface insights, and act fast with a sleek, modern workspace built for students, lecturers, and admins.
            </p>
          </div>
        </div>

        <div className="card-surface rounded-3xl p-8 lg:p-10 interactive-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Welcome back</p>
              <h2 className="text-2xl font-bold text-gray-900">Sign in to continue</h2>
            </div>
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-900 text-white">Secure</span>
          </div>

          {error && <p className="text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
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
                  className="w-full bg-transparent outline-none text-gray-800 placeholder:text-center"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
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
                  className="w-full bg-transparent outline-none text-gray-800 placeholder:text-center"
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

            <button type="submit" className="w-full py-3 rounded-2xl text-white font-semibold shadow-lg transition-all duration-200 neon-pill">Login</button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">New here?</p>
              <p className="text-gray-500">Create an account to access your portal.</p>
            </div>
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;