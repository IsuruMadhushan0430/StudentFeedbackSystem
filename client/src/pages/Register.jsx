import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="card-surface rounded-3xl p-8 text-center max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-900">Registration is disabled</h1>
        <p className="text-gray-600 mt-2">Please contact the admin if you need access.</p>
        <Link
          to="/login"
          className="inline-flex mt-6 px-5 py-3 rounded-2xl text-white font-semibold neon-pill shadow-lg"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
};

export default Register;