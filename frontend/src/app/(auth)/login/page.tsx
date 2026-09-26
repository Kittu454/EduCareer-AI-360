'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth, homePathForRoles } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { AuthRole } from '../../../types';

const ROLE_OPTIONS: Array<{ value: '' | AuthRole; label: string }> = [
  { value: '', label: 'Select your role (optional)' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'TPO', label: 'Training & Placement Officer' },
  { value: 'ADMIN', label: 'Administrator' },
];

// Development demo accounts, grouped by role (backend remains the source of truth).
const DEMO_ACCOUNTS: Record<Exclude<AuthRole, ''>, string> = {
  STUDENT: 'student1@demo.educareer.local',
  FACULTY: 'faculty@demo.educareer.local',
  TPO: 'tpo@demo.educareer.local',
  ADMIN: 'admin@demo.educareer.local',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'' | AuthRole>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success && res.user) {
      // Destination is ALWAYS driven by the authenticated roles returned by the
      // backend (never by the frontend selection), so login works for every role.
      const roles = res.user.roles ?? [];
      const target =
        role && roles.includes(role)
          ? homePathForRoles([role]) // honour the chosen role when the account actually has it
          : homePathForRoles(roles);  // otherwise fall back to the account's default area
      if (target === '/login') {
        setError('This account has no role assigned yet. Please contact your administrator.');
        return;
      }
      router.push(target);
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  // Convenience: picking a role prefills its development demo email (does not affect security).
  const handleRoleChange = (value: '' | AuthRole) => {
    setRole(value);
    if (value && !email) setEmail(DEMO_ACCOUNTS[value]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900">EduCareer<span className="text-blue-600">AI</span></span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="mt-2 text-xs text-slate-600">
          Or{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
            register a new student account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-role" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sign in as
              </label>
              <select
                id="login-role"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as '' | AuthRole)}
                className="w-full rounded-lg border border-slate-300 bg-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">Optional — your destination is always based on your account&apos;s actual role.</p>
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={submitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Development demo logins (password: DemoPassw0rd!2024)
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
              <span>Student: {DEMO_ACCOUNTS.STUDENT}</span>
              <span>Faculty: {DEMO_ACCOUNTS.FACULTY}</span>
              <span>TPO: {DEMO_ACCOUNTS.TPO}</span>
              <span>Admin: {DEMO_ACCOUNTS.ADMIN}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
