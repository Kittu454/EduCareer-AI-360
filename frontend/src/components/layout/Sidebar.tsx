'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Sparkles,
  Compass,
  Briefcase,
  FileCheck2,
  FileText,
  Target,
  Bot,
  Bell,
  Building2,
  BarChart3,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Activity,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isStudent = user.roles?.includes('STUDENT');
  const isTpo = user.roles?.includes('TPO');
  const isFaculty = user.roles?.includes('FACULTY');
  const isAdmin = user.roles?.includes('ADMIN');

  let navItems: Array<{ href: string; label: string; icon: React.ReactNode }> = [];

  if (isStudent) {
    navItems = [
      { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: '/student/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
      { href: '/student/academics', label: 'Academics', icon: <GraduationCap className="w-4 h-4" /> },
      { href: '/student/skills', label: 'Skills & Gaps', icon: <Sparkles className="w-4 h-4" /> },
      { href: '/student/careers', label: 'Career Explorer', icon: <Compass className="w-4 h-4" /> },
      { href: '/student/jobs', label: 'Jobs & Drives', icon: <Briefcase className="w-4 h-4" /> },
      { href: '/student/applications', label: 'My Applications', icon: <FileCheck2 className="w-4 h-4" /> },
      { href: '/student/resume', label: 'Resume Builder', icon: <FileText className="w-4 h-4" /> },
      { href: '/student/readiness', label: 'Readiness Score', icon: <Target className="w-4 h-4" /> },
      { href: '/student/ai-coach', label: 'AI Career Coach', icon: <Bot className="w-4 h-4" /> },
      { href: '/student/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    ];
  } else if (isTpo) {
    navItems = [
      { href: '/tpo/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: '/tpo/jobs', label: 'Placement Drives', icon: <Building2 className="w-4 h-4" /> },
      { href: '/tpo/applications', label: 'Recruitment Pipeline', icon: <FileCheck2 className="w-4 h-4" /> },
      { href: '/tpo/students', label: 'Candidates Directory', icon: <Users className="w-4 h-4" /> },
      { href: '/tpo/analytics', label: 'Placement Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      { href: '/tpo/reports', label: 'Reports & Exports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    ];
  } else if (isFaculty) {
    navItems = [
      { href: '/faculty/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: '/faculty/students', label: 'Department Roster', icon: <Users className="w-4 h-4" /> },
      { href: '/faculty/academics', label: 'Academic Grades', icon: <GraduationCap className="w-4 h-4" /> },
      { href: '/faculty/skills', label: 'Skill Validation', icon: <Award className="w-4 h-4" /> },
    ];
  } else if (isAdmin) {
    navItems = [
      { href: '/admin/dashboard', label: 'System Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: '/admin/users', label: 'User Directory & Roles', icon: <Users className="w-4 h-4" /> },
      { href: '/admin/audit-logs', label: 'Audit Trail', icon: <ShieldCheck className="w-4 h-4" /> },
      { href: '/admin/system', label: 'System Health', icon: <Activity className="w-4 h-4" /> },
    ];
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        <div className="h-16 px-6 flex items-center border-b border-slate-800 gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">EduCareer<span className="text-blue-400">AI</span></span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-semibold ml-1 border border-blue-500/30">360</span>
          </div>
        </div>

        <div className="px-3 py-4">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {isStudent ? 'Student Workspace' : isTpo ? 'Placement Operations' : isFaculty ? 'Faculty Portal' : 'Admin Console'}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
            {user.email.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden text-xs">
            <p className="font-medium text-slate-200 truncate">{user.email}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{user.roles?.join(', ')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
