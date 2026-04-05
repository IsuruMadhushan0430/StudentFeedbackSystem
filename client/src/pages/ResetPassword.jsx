import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authAPI.resetPassword(token, { password });
      setMessage(res.data.message || 'Password reset successful.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md card-surface rounded-3xl p-8 lg:p-10 interactive-card">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Account recovery</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-6">Enter a new password for your account.</p>

        {error && <p className="text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm">{error}</p>}
        {message && <p className="text-green-700 bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-sm">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl text-white font-semibold shadow-lg transition-all duration-200 neon-pill disabled:opacity-70"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 text-sm">
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
