import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'info' | 'success' | 'error'

  const fillDemoCredentials = () => {
    setEmail('admin@suraksha.ai');
    setPassword('password123');
    showNotification('Demo credentials populated (admin@suraksha.ai)', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification('Please fill in all security credentials', 'error');
      return;
    }

    setIsLoading(true);
    setAlertType('info');
    setAlertMsg('Authenticating with Suraksha-AI Identity Broker...');

    try {
      const result = await login(email, password);
      if (result.success) {
        setAlertType('success');
        setAlertMsg('Credentials accepted. Routing to SecOps Command Dashboard...');
        showNotification('Access Granted. Opening session.', 'success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setIsLoading(false);
        setAlertType('error');
        setAlertMsg(result.message || 'Authentication failed. Please check credentials.');
        showNotification(result.message || 'Login failed', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      setAlertType('error');
      setAlertMsg('An unexpected error occurred during authentication.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9ff] text-[#0b1c30] font-sans antialiased selection:bg-[#4f46e5] selection:text-white">
      
      {/* Main Container matching login.html */}
      <main className="w-full flex-1 flex flex-col justify-center items-center py-8 md:py-12 px-4 md:px-6">
        <div className="flex flex-col w-full mx-auto py-2 md:py-4 max-w-md">
          <div className="w-full max-w-md mx-auto p-6 md:p-8 rounded-xl bg-white shadow-[0_4px_25px_rgba(11,28,48,0.06)] border border-[#dce9ff] flex flex-col gap-5">
            
            {/* Logo / Header */}
            <div className="flex flex-col items-center text-center gap-1">
              <div className="w-12 h-12 rounded-xl bg-[#3525cd] flex items-center justify-center text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.35)] mb-1">
                <span className="material-symbols-outlined text-[28px]">shield_lock</span>
              </div>
              <h1 className="font-extrabold text-2xl tracking-tight text-[#0b1c30]">Suraksha-AI</h1>
              <h2 className="font-bold text-base text-[#0b1c30] mt-0.5">Welcome back</h2>
              <p className="text-xs text-[#464555]">Sign in to your Suraksha-AI account</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Work Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]" htmlFor="work-email">
                  Work Email
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#464555] text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    id="work-email"
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0b1c30]" htmlFor="work-password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => showNotification('Demo default password is: password123', 'info')}
                    className="text-[11px] text-[#3525cd] font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#464555] text-[20px] pointer-events-none">
                    lock
                  </span>
                  <input
                    id="work-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#4f46e5] cursor-pointer"
                  />
                  <span className="text-xs text-[#0b1c30] font-medium">Remember me</span>
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
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>

            {/* Quick Demo Credentials Assistant */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#eff4ff] border border-[#dce9ff] text-[11px] text-[#464555]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#3525cd]">badge</span>
                Quick Demo:
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="font-bold text-[#3525cd] hover:underline cursor-pointer"
              >
                Use admin@suraksha.ai
              </button>
            </div>

            {/* Footer Prompt */}
            <div className="pt-2 text-center border-t border-[#e5eeff]">
              <p className="text-xs text-[#464555]">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-[#3525cd] font-bold hover:underline cursor-pointer"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer matching login.html */}
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

export default Login;
