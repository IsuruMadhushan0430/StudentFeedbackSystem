import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setIsSubmitting(true);

    try {
      const res = await authAPI.forgotPassword({ email });
      setMessage(res.data.message || 'Reset instructions generated.');
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md card-surface rounded-3xl p-8 lg:p-10 interactive-card">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Account recovery</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-600 mb-6">Enter your email to generate a reset link.</p>

        {error && <p className="text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm">{error}</p>}
        {message && <p className="text-green-700 bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-sm">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl text-white font-semibold shadow-lg transition-all duration-200 neon-pill disabled:opacity-70"
          >
            {isSubmitting ? 'Generating...' : 'Generate Reset Link'}
          </button>
        </form>

        {resetUrl && (
          <a
            href={resetUrl}
            className="mt-4 inline-block text-blue-600 font-semibold hover:underline"
          >
            Open reset page
          </a>
        )}

        <div className="mt-6 text-sm">
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
