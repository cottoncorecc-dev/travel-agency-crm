'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  KeyRound,
  Mail,
  Phone,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Agent } from '@/types/crm';

interface LoginPageProps {
  onLoginSuccess: (agent: Agent, token: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');

  // Login Form States (initially empty, no quick accounts)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Signup Form States
  const [signupCompany, setSignupCompany] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupDoneMessage, setSignupDoneMessage] = useState<string | null>(null);

  // Forgot Password / OTP States
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpConfirmPassword, setOtpConfirmPassword] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both your username/email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid credentials or unauthorized account.');
        return;
      }

      // Save token to localStorage for persistent session
      if (typeof window !== 'undefined') {
        localStorage.setItem('devntom_token', data.token);
        localStorage.setItem('devntom_user', JSON.stringify(data.agent));
      }

      onLoginSuccess(data.agent, data.token);
    } catch (err: any) {
      setErrorMessage('Unable to sign in. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signupCompany.trim() || !signupName.trim() || !signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: signupCompany.trim(),
          superAdminName: signupName.trim(),
          username: signupUsername.trim(),
          email: signupEmail.trim(),
          phone: signupPhone.trim(),
          password: signupPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Registration failed.');
        return;
      }

      setSignupDoneMessage(
        `Application submitted! Your Super Admin account and workspace for "${signupCompany}" has been sent to the CRM Owner for approval. You can log in once authorized.`
      );
    } catch (err) {
      setErrorMessage('Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpIdentifier.trim()) {
      setErrorMessage('Please enter your username or registered email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSimulatedOtpNotice(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: otpIdentifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to dispatch verification code.');
        return;
      }

      setOtpStep(2);
      if (data.otp) {
        setSimulatedOtpNotice(`Verification OTP generated: [${data.otp}]`);
        setOtpCode(data.otp);
      }
    } catch (err) {
      setErrorMessage('Network error while requesting OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode.trim() || !otpNewPassword) {
      setErrorMessage('Please enter the 6-digit OTP code and your new password.');
      return;
    }

    if (otpNewPassword !== otpConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (otpNewPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: otpIdentifier.trim(),
          otpCode: otpCode.trim(),
          newPassword: otpNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update password.');
        return;
      }

      setSuccessMessage('Password reset successfully! You can now log in.');
      setUsername(otpIdentifier);
      setMode('login');
      setOtpStep(1);
      setOtpCode('');
      setOtpNewPassword('');
      setOtpConfirmPassword('');
      setSimulatedOtpNotice(null);
    } catch (err) {
      setErrorMessage('Error resetting password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm border border-neutral-800">
            <span className="text-amber-400">DS</span>
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-sm tracking-tight leading-none">
              Enterprise CRM Platform
            </div>
            <div className="text-[11px] text-amber-700 font-medium tracking-wide mt-1">
              Multi-Tenant Travel & Umrah Workspace
            </div>
          </div>
        </div>

        <Link
          href="/owner"
          className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 font-medium shadow-2xs transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>CRM Owner Portal</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-6">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-7 shadow-xl shadow-slate-200/70">
          {/* Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* VIEW 1: SIGN IN */}
          {/* ----------------------------------------------------------- */}
          {mode === 'login' && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 mb-3 shadow-xs">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                  Sign In to Your Workspace
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Enter your credentials to access your company CRM portal.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Username or Work Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. admin or yourname@company.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setErrorMessage('');
                        setSuccessMessage('');
                        setOtpStep(1);
                      }}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-9 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all text-xs tracking-wide disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {isLoading ? <span>Signing In...</span> : <><span>Sign In</span><ArrowRight className="w-4 h-4 stroke-[2.5]" /></>}
                </button>
              </form>

              {/* Bottom Switcher: Register New Company */}
              <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
                <div className="text-xs text-neutral-600 mb-2">
                  Need a CRM workspace for your travel agency?
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                    setSignupDoneMessage(null);
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-neutral-300 hover:border-amber-400 bg-neutral-50/80 hover:bg-amber-50/40 text-neutral-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5 text-amber-700" />
                  <span>Register Company & Super Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* VIEW 2: SUPER ADMIN SIGN UP */}
          {/* ----------------------------------------------------------- */}
          {mode === 'signup' && (
            <div>
              {signupDoneMessage ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900">Application Submitted!</h2>
                  <p className="text-xs text-neutral-600 leading-relaxed bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl">
                    {signupDoneMessage}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Once the CRM Owner approves your company in the Owner Portal, you will be able to log in with your Super Admin credentials.
                  </p>
                  <button
                    onClick={() => {
                      setMode('login');
                      setSignupDoneMessage(null);
                    }}
                    className="w-full py-2.5 rounded-lg bg-neutral-900 text-amber-400 font-bold text-xs shadow-xs cursor-pointer hover:bg-neutral-800 transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage('');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      Company Onboarding
                    </span>
                  </div>

                  <div className="text-center mb-5">
                    <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
                      Super Admin & Company Sign Up
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                      Register your company name. Your team and sub-accounts will see this branded CRM.
                    </p>
                  </div>

                  <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                        Company Name *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Al-Noor Global Travel"
                          value={signupCompany}
                          onChange={(e) => setSignupCompany(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tariq Khan"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                          Username *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. tkhan_admin"
                          value={signupUsername}
                          onChange={(e) => setSignupUsername(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="admin@company.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="+44 7700 900123"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Min 6 characters"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all text-xs tracking-wide disabled:opacity-50 mt-3 cursor-pointer"
                    >
                      {isLoading ? 'Submitting Application...' : 'Submit Workspace for Approval'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* VIEW 3: FORGOT PASSWORD (OTP FLOW) */}
          {/* ----------------------------------------------------------- */}
          {mode === 'forgot_password' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setSimulatedOtpNotice(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  OTP Password Recovery
                </span>
              </div>

              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
                  Reset Password via OTP
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  {otpStep === 1
                    ? 'Enter your username or registered work email to receive a 6-digit verification code.'
                    : 'Enter the 6-digit code and set your new password.'}
                </p>
              </div>

              {simulatedOtpNotice && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-mono font-semibold flex items-center justify-between">
                  <span>{simulatedOtpNotice}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                    SIMULATED
                  </span>
                </div>
              )}

              {otpStep === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Username or Work Email
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your registered username or email"
                        value={otpIdentifier}
                        onChange={(e) => setOtpIdentifier(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all text-xs tracking-wide disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? 'Generating OTP...' : 'Send 6-Digit OTP Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordWithOtp} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      6-Digit OTP Verification Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono tracking-widest text-center text-base font-bold shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={otpNewPassword}
                      onChange={(e) => setOtpNewPassword(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={otpConfirmPassword}
                      onChange={(e) => setOtpConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpStep(1)}
                      className="w-1/3 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold cursor-pointer hover:bg-neutral-50"
                    >
                      Resend Code
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-2/3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold py-2 rounded-lg shadow-sm transition-all text-xs tracking-wide disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-400 font-medium py-4">
        Developed by Devntom Solutions
      </footer>
    </div>
  );
}
