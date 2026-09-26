'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.roles.includes('STUDENT')) return '/student/dashboard';
    if (user.roles.includes('TPO')) return '/tpo/dashboard';
    if (user.roles.includes('FACULTY')) return '/faculty/dashboard';
    if (user.roles.includes('ADMIN')) return '/admin/dashboard';
    return '/login';
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">EduCareer<span className="text-blue-600">AI</span></span>
            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold ml-1 border border-blue-200">360</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/#features" className="hover:text-blue-600 transition-colors">Features</Link>
          <Link href="/#ecosystem" className="hover:text-blue-600 transition-colors">Placement Ecosystem</Link>
          <Link href="/#ai-coach" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" /> AI Coach
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href={getDashboardLink()}>
                <Button size="sm" icon={<UserCheck className="w-4 h-4" />}>
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={logout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
