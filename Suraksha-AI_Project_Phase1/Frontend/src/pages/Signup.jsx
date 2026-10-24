import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';

const Signup = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'info' | 'success' | 'error'

  // Validation helpers
  const isLengthValid = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordStrong = isLengthValid && hasLetter && hasNumber;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showNotification('Please enter your full name', 'error');
      return;
    }

    if (!email.trim()) {
      showNotification('Please enter your work email', 'error');
      return;
    }

    if (!isPasswordStrong) {
      setAlertType('error');
      setAlertMsg('Password must be at least 8 characters with at least one letter and one number.');
      showNotification('Password does not meet security criteria', 'error');
      return;
    }

    if (password !== confirmPassword) {
      setAlertType('error');
      setAlertMsg('Passwords do not match. Please re-enter.');
      showNotification('Passwords do not match', 'error');
      return;
    }

    if (!agreeTerms) {
      showNotification('Please accept the Terms of Service to proceed', 'error');
      return;
    }

    setIsLoading(true);
    setAlertType('info');
    setAlertMsg('Creating your security operator account and saving to database...');

    try {
      const result = await register(name.trim(), email.trim(), password);
      if (result.success) {
        setAlertType('success');
        setAlertMsg('Account registered successfully! Initializing security dashboard session...');
        showNotification('Welcome! Account registered successfully.', 'success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 900);
      } else {
        setIsLoading(false);
        setAlertType('error');
        setAlertMsg(result.message || 'Registration failed. Email might already be taken.');
        showNotification(result.message || 'Registration failed', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      setAlertType('error');
      setAlertMsg('An unexpected error occurred during account creation.');
      showNotification('Account creation failed. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9ff] text-[#0b1c30] font-sans antialiased selection:bg-[#4f46e5] selection:text-white">
      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col justify-center items-center py-8 md:py-12 px-4 md:px-6">
        <div className="flex flex-col w-full mx-auto py-2 md:py-4 max-w-md">
          <div className="w-full max-w-md mx-auto p-6 md:p-8 rounded-xl bg-white shadow-[0_4px_25px_rgba(11,28,48,0.06)] border border-[#dce9ff] flex flex-col gap-5">
            
            {/* Logo / Header */}
            <div className="flex flex-col items-center text-center gap-1">
              <div className="w-12 h-12 rounded-xl bg-[#3525cd] flex items-center justify-center text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.35)] mb-1">
                <span className="material-symbols-outlined text-[28px]">shield_lock</span>
              </div>
              <h1 className="font-extrabold text-2xl tracking-tight text-[#0b1c30]">Suraksha-AI</h1>
              <h2 className="font-bold text-base text-[#0b1c30] mt-0.5">Create your account</h2>
              <p className="text-xs text-[#464555]">Register as a SecOps operator in the database</p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]" htmlFor="full-name">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#464555] text-[20px] pointer-events-none">
                    person
                  </span>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-[#eff4ff] focus:bg-white text-[#0b1c30] text-xs font-medium shadow-xs border border-transparent focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none transition-all placeholder:text-[#777587]"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]" htmlFor="signup-email">
                  Work Email
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#464555] text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-[#eff4ff] focus:bg-white text-[#0b1c30] text-xs font-medium shadow-xs border border-transparent focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none transition-all placeholder:text-[#777587]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#464555] text-[20px] pointer-events-none">
                    lock
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters (letters & numbers)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#eff4ff] focus:bg-white text-[#0b1c30] text-xs font-medium shadow-xs border border-transparent focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none transition-all placeholder:text-[#777587]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 p-1.5 rounded-full text-[#464555] hover:text-[#0b1c30] transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Password Criteria Feedback */}
                {password && (
                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span className={`flex items-center gap-1 ${isLengthValid ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {isLengthValid ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      8+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasLetter ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      Letters
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      Numbers
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#464555] text-[20px] pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-[#eff4ff] focus:bg-white text-[#0b1c30] text-xs font-medium shadow-xs border border-transparent focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none transition-all placeholder:text-[#777587]"
                  />
                </div>
                {confirmPassword && (
                  <span className={`text-[11px] ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}
              </div>

              {/* Agree Terms */}
              <div className="flex items-center gap-2 pt-1 select-none">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#4f46e5] cursor-pointer"
                />
                <label htmlFor="agree-terms" className="text-xs text-[#464555] cursor-pointer">
                  I agree to the <span className="text-[#3525cd] font-semibold hover:underline">Security Policies</span> & <span className="text-[#3525cd] font-semibold hover:underline">Privacy Guidelines</span>
                </label>
              </div>

              {/* Status Alert Box */}
              {alertMsg && (
                <div className={`rounded-lg p-3 text-xs font-medium flex items-center gap-2 transition-all ${
                  alertType === 'error'
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : alertType === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#e5eeff] text-[#006172]'
                }`}>
                  <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
                    {isLoading ? 'sync' : alertType === 'error' ? 'error' : 'check_circle'}
                  </span>
                  <span>{alertMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isLoading ? 'Registering...' : 'Create Account & Sign In'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>

            {/* Footer Prompt */}
            <div className="pt-3 text-center border-t border-[#e5eeff]">
              <p className="text-xs text-[#464555]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#3525cd] font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full bg-white/80 backdrop-blur-xl py-3 border-t border-[#e5eeff] shadow-[0_-1px_8px_rgba(0,0,0,0.03)]">
        <div className="w-full px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#464555] max-w-md mx-auto">
          <span>&copy; {new Date().getFullYear()} Suraksha-AI Inc.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#3525cd] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#3525cd] cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
