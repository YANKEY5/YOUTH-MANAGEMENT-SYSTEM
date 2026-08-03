import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Church, Mail, Lock, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { isMockMode } from '../firebase/mockDb';

export const Login: React.FC = () => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      await resetPassword(data.forgotEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-900 bg-cover bg-center px-4" style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1600')` }}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-church-gold-400 to-church-gold-600 text-church-navy-950 shadow-lg shadow-church-gold-500/20 mb-4">
            <Church className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            TRUE ANOINTING VICTORY YOUTH
          </h2>
          <p className="text-sm text-church-gold-500 font-semibold uppercase tracking-wider mt-1">
            Youth Management System
          </p>
        </div>

        {/* Info alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {resetSent && (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p>Password reset link has been sent to your email.</p>
          </div>
        )}

        {/* Demo Mode Guide */}
        {isMockMode && !showForgotPassword && (
          <div className="mb-5 rounded-xl bg-church-navy-800/30 border border-church-navy-700/40 p-3.5 text-xs text-slate-300">
            <p className="font-bold text-church-gold-400 mb-1">💡 Demo Credentials Available:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Super Admin: <code className="text-white">joshuayankey19@gmail.com</code> / any</li>
              <li>Youth Leader: <code className="text-white">leader@victoryyouth.org</code> / any</li>
              <li>Member: <code className="text-white">member@victoryyouth.org</code> / any</li>
            </ul>
          </div>
        )}

        {!showForgotPassword ? (
          /* Login Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  {...formRegister('email', { required: 'Email is required' })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <span className="text-xs text-red-400 mt-1 block">Email is required</span>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setError(null); }}
                  className="text-xs font-medium text-church-gold-400 hover:text-church-gold-300"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type="password"
                  {...formRegister('password', { required: 'Password is required' })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <span className="text-xs text-red-400 mt-1 block">Password is required</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-church-gold-500 to-church-gold-600 py-3.5 text-sm font-bold text-slate-950 hover:from-church-gold-400 hover:to-church-gold-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-church-gold-500/10"
            >
              {loading && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Social Logins */}
            <div className="relative flex items-center justify-center my-6">
              <span className="absolute w-full border-t border-white/10" />
              <span className="relative bg-slate-950 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Or Continue With
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google Account
            </button>

            <div className="text-center text-xs text-slate-400 mt-6">
              New youth member?{' '}
              <Link to="/register" className="font-bold text-church-gold-400 hover:text-church-gold-300">
                Register here
              </Link>
            </div>
          </form>
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleSubmit(handleForgotPassword)} className="space-y-4">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enter your registered email address and we will send you a secure link to reset your account password.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  {...formRegister('forgotEmail', { required: 'Email is required' })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-church-gold-500 to-church-gold-600 py-3.5 text-sm font-bold text-slate-950 hover:from-church-gold-400 hover:to-church-gold-500 transition-all flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setResetSent(false); setError(null); }}
              className="w-full text-center text-xs font-medium text-slate-400 hover:text-white mt-4"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
