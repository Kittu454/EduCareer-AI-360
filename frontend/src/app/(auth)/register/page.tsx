'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass, Mail, Lock, User, Hash, Calendar, AlertCircle, ArrowLeft,
  GraduationCap, Presentation, Building2, ShieldCheck, Info,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { AuthRole } from '../../../types';

type AccountType = 'STUDENT' | 'FACULTY' | 'TPO' | 'ADMIN';

const ACCOUNT_TYPES: Array<{ type: AccountType; title: string; description: string; icon: React.ReactNode; selfSignup: boolean }> = [
  { type: 'STUDENT', title: 'Student', description: 'Access career, academic, placement and AI career coach features.', icon: <GraduationCap className="w-5 h-5" />, selfSignup: true },
  { type: 'FACULTY', title: 'Faculty', description: 'Academic and student-support tools. Provisioned by an administrator.', icon: <Presentation className="w-5 h-5" />, selfSignup: false },
  { type: 'TPO', title: 'Training & Placement Officer', description: 'Placement, jobs and analytics tools. Provisioned by an administrator.', icon: <Building2 className="w-5 h-5" />, selfSignup: false },
  { type: 'ADMIN', title: 'Administrator', description: 'System administration and user management. Provisioned by an administrator.', icon: <ShieldCheck className="w-5 h-5" />, selfSignup: false },
];

const MIN_PASSWORD = 12;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType>('STUDENT');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [provisionNotice, setProvisionNotice] = useState<AccountType | null>(null);

  const { register } = useAuth();
  const router = useRouter();

  const clearFieldError = (key: string) =>
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const chooseAccountType = (type: AccountType) => {
    setAccountType(type);
    const meta = ACCOUNT_TYPES.find((a) => a.type === type)!;
    if (meta.selfSignup) {
      setProvisionNotice(null);
      setStep(2);
    } else {
      // Non-self-registration roles now RESPOND instead of being a silent no-op,
      // while still enforcing that only Students self-register (backend is authoritative).
      setProvisionNotice(type);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!rollNumber.trim()) errs.rollNumber = 'Roll number is required.';
    const year = Number(admissionYear);
    if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      errs.admissionYear = 'Enter a valid admission year.';
    }
    if (password.length < MIN_PASSWORD) errs.password = `Password must be at least ${MIN_PASSWORD} characters.`;
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    const res = await register({
      email: email.trim().toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      rollNumber: rollNumber.trim(),
      admissionYear: Number(admissionYear),
    });
    setSubmitting(false);

    if (res.success) {
      // Real, authenticated student account created -> move to profile completion (onboarding).
      router.push('/student/profile');
    } else {
      setError(res.message || 'Registration failed. Please try again.');
    }
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
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {step === 1 ? 'Create your account' : 'Student registration'}
        </h2>
        <p className="mt-2 text-xs text-slate-600">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">Sign in here</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-slate-200 sm:px-10">
          {step === 1 ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 mb-1">STEP 1 — Choose your account type</p>
              {ACCOUNT_TYPES.map((a) => (
                <button
                  key={a.type}
                  type="button"
                  onClick={() => chooseAccountType(a.type)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                    a.selfSignup
                      ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 bg-white'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                  } ${provisionNotice === a.type ? 'ring-2 ring-blue-400 border-blue-400' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.selfSignup ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {a.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{a.title}</span>
                      {!a.selfSignup && <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Admin-provisioned</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                  </div>
                </button>
              ))}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Faculty, TPO and Admin accounts are created by an administrator to prevent unauthorized access.</span>
              </div>

              {provisionNotice && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-bold text-blue-900 mb-1">
                    {ACCOUNT_TYPES.find((a) => a.type === provisionNotice)!.title} accounts are provisioned by an administrator
                  </p>
                  <p className="text-[11px] text-blue-800 mb-3 leading-relaxed">
                    For security, {ACCOUNT_TYPES.find((a) => a.type === provisionNotice)!.title} accounts can&apos;t be
                    self-registered here. Ask your institution administrator to create your account, then sign in to continue.
                  </p>
                  <Link href="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-600">
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> Go to Sign In
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change account type
              </button>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs font-medium text-slate-500 mb-3">STEP 2 — Enter your details</p>
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" placeholder="Alex" value={firstName} onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName'); }} error={fieldErrors.firstName} icon={<User className="w-4 h-4" />} />
                  <Input label="Last Name" placeholder="Morgan" value={lastName} onChange={(e) => { setLastName(e.target.value); clearFieldError('lastName'); }} error={fieldErrors.lastName} />
                </div>

                <Input label="Email Address" type="email" placeholder="alex.morgan@university.edu" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }} error={fieldErrors.email} icon={<Mail className="w-4 h-4" />} />

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Roll Number" placeholder="2024CS0101" value={rollNumber} onChange={(e) => { setRollNumber(e.target.value); clearFieldError('rollNumber'); }} error={fieldErrors.rollNumber} icon={<Hash className="w-4 h-4" />} />
                  <Input label="Admission Year" type="number" placeholder="2024" value={admissionYear} onChange={(e) => { setAdmissionYear(Number(e.target.value)); clearFieldError('admissionYear'); }} error={fieldErrors.admissionYear} icon={<Calendar className="w-4 h-4" />} />
                </div>

                <Input label="Password" type="password" placeholder={`At least ${MIN_PASSWORD} characters`} value={password} onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }} error={fieldErrors.password} icon={<Lock className="w-4 h-4" />} />
                <Input label="Confirm Password" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }} error={fieldErrors.confirmPassword} icon={<Lock className="w-4 h-4" />} />

                <Button type="submit" className="w-full mt-2" loading={submitting}>
                  Create Student Account
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
