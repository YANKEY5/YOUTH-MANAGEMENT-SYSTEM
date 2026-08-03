import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Church, User, Phone, Mail, MapPin, UserCheck, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export const Register: React.FC = () => {
  const { register: authRegister, systemSettings } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      // Split authentication and profile fields
      const { email, password, firstName, lastName, phone, gender, dateOfBirth, residentialAddress, emergencyContact, emergencyPhone, ministry, position, baptized } = data;
      
      const profile = {
        firstName,
        lastName,
        phone,
        gender,
        dateOfBirth,
        residentialAddress,
        emergencyContact,
        emergencyPhone,
        ministry,
        position,
        baptized: baptized === 'true' || baptized === true,
        photoURL: '',
        dateJoined: new Date().toISOString().split('T')[0]
      };

      await authRegister(email, password, profile);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  if (systemSettings && !systemSettings.allowRegistration) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-900 bg-cover bg-center py-12 px-4" style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1600')` }}>
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 mb-4 mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Registration Suspended
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            New member registration for {systemSettings.churchName} has been temporarily suspended by system administrators. Please contact your youth leaders for assistance.
          </p>
          <Link to="/login" className="inline-flex items-center justify-center rounded-xl bg-church-gold-500 hover:bg-church-gold-600 px-6 py-3 text-sm font-bold text-church-navy-950 transition-colors w-full">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-900 bg-cover bg-center py-12 px-4" style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1600')` }}>
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-church-gold-400 to-church-gold-600 text-church-navy-950 shadow-lg shadow-church-gold-500/20 mb-4">
            <Church className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
            JOIN {systemSettings?.churchName}
          </h2>
          <p className="text-sm text-church-gold-500 font-semibold uppercase tracking-wider mt-1">
            Create Member Account
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p>Registration successful! Redirecting to Dashboard...</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Section 1: Credentials */}
          <div>
            <h3 className="text-xs font-bold text-church-gold-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">
              Account Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="email"
                    {...formRegister('email', { required: true })}
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && <span className="text-xs text-red-400 mt-1 block">Email is required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    {...formRegister('password', { required: true, minLength: 6 })}
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                    placeholder="•••••••• (min 6 chars)"
                  />
                </div>
                {errors.password && <span className="text-xs text-red-400 mt-1 block">Password must be at least 6 characters</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Personal Details */}
          <div>
            <h3 className="text-xs font-bold text-church-gold-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">First Name *</label>
                <input
                  type="text"
                  {...formRegister('firstName', { required: true })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                  placeholder="John"
                />
                {errors.firstName && <span className="text-xs text-red-400 mt-1 block">First Name is required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  {...formRegister('lastName', { required: true })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                  placeholder="Doe"
                />
                {errors.lastName && <span className="text-xs text-red-400 mt-1 block">Last Name is required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender *</label>
                <select
                  {...formRegister('gender', { required: true })}
                  className="block w-full rounded-xl border border-white/10 bg-slate-900 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <span className="text-xs text-red-400 mt-1 block">Gender is required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  {...formRegister('dateOfBirth', { required: true })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                />
                {errors.dateOfBirth && <span className="text-xs text-red-400 mt-1 block">Date of Birth is required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="tel"
                    {...formRegister('phone', { required: true })}
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                    placeholder="+233 24 123 4567"
                  />
                </div>
                {errors.phone && <span className="text-xs text-red-400 mt-1 block">Phone is required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Residential Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    {...formRegister('residentialAddress', { required: true })}
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                    placeholder="123 Faith Street, Accra"
                  />
                </div>
                {errors.residentialAddress && <span className="text-xs text-red-400 mt-1 block">Residential address is required</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Emergency & Ministry */}
          <div>
            <h3 className="text-xs font-bold text-church-gold-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">
              Emergency Contact & Ministry Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Emergency Contact Name *</label>
                <input
                  type="text"
                  {...formRegister('emergencyContact', { required: true })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                  placeholder="Jane Doe"
                />
                {errors.emergencyContact && <span className="text-xs text-red-400 mt-1 block">Required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  {...formRegister('emergencyPhone', { required: true })}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                  placeholder="+233 24 000 0000"
                />
                {errors.emergencyPhone && <span className="text-xs text-red-400 mt-1 block">Required</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Ministry of Choice</label>
                <select
                  {...formRegister('ministry')}
                  className="block w-full rounded-xl border border-white/10 bg-slate-900 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                >
                  <option value="General">Select Ministry (Optional)</option>
                  <option value="Music">Music (Choir / Band)</option>
                  <option value="Media">Media & Publicity</option>
                  <option value="Ushering">Ushering & Protocol</option>
                  <option value="Drama">Drama & Creative Arts</option>
                  <option value="Prayer">Prayer & Intercession</option>
                  <option value="Evangelism">Evangelism & Outreach</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Are you Baptized?</label>
                <select
                  {...formRegister('baptized')}
                  className="block w-full rounded-xl border border-white/10 bg-slate-900 py-2.5 px-4 text-sm text-white focus:border-church-gold-500 focus:ring-1 focus:ring-church-gold-500 outline-none"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-church-gold-500 to-church-gold-600 py-3.5 text-sm font-bold text-slate-950 hover:from-church-gold-400 hover:to-church-gold-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-church-gold-500/10"
          >
            {loading && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
            {loading ? 'Creating account...' : 'Complete Registration'}
          </button>

          <div className="text-center text-xs text-slate-400 mt-4">
            Already a youth member?{' '}
            <Link to="/login" className="font-bold text-church-gold-400 hover:text-church-gold-300">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
