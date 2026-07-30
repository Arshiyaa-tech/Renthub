import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { HiUser, HiMail, HiLockClosed, HiEye, HiEyeOff, HiPhone } from 'react-icons/hi';
import { APP_NAME } from '../utils/constants';
import useAuth from '../hooks/useAuth';

/**
 * Signup page — full authentication integration.
 *
 * Fields: fullName, email, phone, password, confirmPassword, role
 * Features: password strength, visibility toggle, role selection, terms checkbox
 */
const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'RENTER',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError('Password must be at least 8 characters with one uppercase, one lowercase, and one number');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setIsLoading(true);

    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
    });

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { score: 75, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600 mb-4">
            <span className="bg-primary-600 text-white px-2.5 py-1 rounded-lg">RH</span>
            {APP_NAME}
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-gray-600">Join the rental community</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input id="fullName" name="fullName" type="text" required value={formData.fullName} onChange={handleChange}
                  placeholder="John Doe" className="input-field pl-10" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange}
                  placeholder="you@example.com" className="input-field pl-10" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange}
                  placeholder="+91 98765 43210" className="input-field pl-10" />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                I want to...
              </label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="input-field">
                <option value="RENTER">Rent items (Renter)</option>
                <option value="OWNER">List items for rent (Owner)</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required
                  value={formData.password} onChange={handleChange} placeholder="Create a strong password"
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password strength: {passwordStrength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required
                  value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password"
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span>
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
              </span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={isLoading || !formData.agreeToTerms || (formData.confirmPassword && !passwordsMatch)}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading ? (
                <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg> Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
