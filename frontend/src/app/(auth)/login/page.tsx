'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CheckSquare,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, register, guestLogin } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await guestLogin();
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || 'Failed to login as guest');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section
          className="hidden min-h-screen flex-col justify-between px-12 py-10 lg:flex"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <CheckSquare size={22} />
            </div>
            <span className="text-xl font-bold">AbleSpace</span>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">Work dashboard</p>
            <h1 className="text-5xl font-bold leading-tight">
              Plan projects, assign work, and keep delivery moving.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/80">
              A focused workspace for tasks, teams, project status, and quick follow-through.
            </p>
          </div>

          <div className="grid gap-3">
            {['Project overview', 'Team workload', 'Task progress'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-medium text-white/90">
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                <CheckSquare size={20} />
              </div>
              <span className="text-xl font-bold">AbleSpace</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold leading-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
              <p className="mt-2 text-base" style={{ color: 'var(--text-muted)' }}>
                {isRegister ? 'Set up your workspace access.' : 'Sign in to continue to your workspace.'}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-lg p-1" style={{ background: 'var(--accent-light)' }}>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className="h-10 rounded-md text-sm font-semibold transition-colors"
                style={!isRegister ? { background: 'var(--bg-card)', color: 'var(--text)' } : { color: 'var(--accent)' }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className="h-10 rounded-md text-sm font-semibold transition-colors"
                style={isRegister ? { background: 'var(--bg-card)', color: 'var(--text)' } : { color: 'var(--accent)' }}
              >
                Sign up
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border px-3 py-2 text-sm text-red-600" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Full name</span>
                  <span className="flex h-12 items-center gap-3 rounded-lg border px-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                    <UserRound size={18} style={{ color: 'var(--text-muted)' }} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Demo User"
                      autoComplete="name"
                      required
                      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                      style={{ color: 'var(--text)' }}
                    />
                  </span>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Email</span>
                <span className="flex h-12 items-center gap-3 rounded-lg border px-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <Mail size={18} style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@ablespace.local"
                    autoComplete="email"
                    required
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                    style={{ color: 'var(--text)' }}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Password</span>
                <span className="flex h-12 items-center gap-3 rounded-lg border px-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <LockKeyhole size={18} style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                    style={{ color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="flex h-8 w-8 items-center justify-center rounded-md transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || guestLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading || guestLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}
              >
                {guestLoading && <Loader2 size={18} className="animate-spin" />}
                Continue as Guest
              </button>
            </div>

            <div className="mt-5 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
              Demo login: <span className="font-semibold" style={{ color: 'var(--text)' }}>demo@ablespace.local</span>
              <span className="mx-2">/</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>password123</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
