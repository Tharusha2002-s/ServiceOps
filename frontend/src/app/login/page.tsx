'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect
  if (isAuthenticated) {
    router.push('/dashboard');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your corporate email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing
  const setQuickCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ServiceOps ITSM</h1>
          <p className="text-slate-400 text-sm mt-1">Enterprise IT Service Delivery & Operations</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur shadow-2xl shadow-black/50">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Single Sign-On Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in using your enterprise credentials.</p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@serviceops.local"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <a href="#" className="text-xs text-brand-400 hover:text-brand-300 transition">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-brand-600/30 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to ServiceOps</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick Test: Select Pre-Seeded Role
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setQuickCredentials('admin@serviceops.local')}
                className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left hover:border-rose-500/50 transition flex items-center justify-between"
              >
                <span className="font-medium text-rose-400">Admin</span>
                <span className="text-[10px] text-slate-500">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('manager@serviceops.local')}
                className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left hover:border-indigo-500/50 transition flex items-center justify-between"
              >
                <span className="font-medium text-indigo-400">Manager</span>
                <span className="text-[10px] text-slate-500">SLA & Ops</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('agent@serviceops.local')}
                className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left hover:border-emerald-500/50 transition flex items-center justify-between"
              >
                <span className="font-medium text-emerald-400">Agent</span>
                <span className="text-[10px] text-slate-500">IT Support</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('employee@serviceops.local')}
                className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left hover:border-blue-500/50 transition flex items-center justify-between"
              >
                <span className="font-medium text-blue-400">Employee</span>
                <span className="text-[10px] text-slate-500">Requester</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Default Password for all: <code className="text-slate-400 font-mono">Password@123</code>
            </p>
          </div>
        </div>

        {/* Security Footer Notice */}
        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protected with Argon2id + Dual-Token Rotation</span>
        </p>
      </div>
    </div>
  );
}

