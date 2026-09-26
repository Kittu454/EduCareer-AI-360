import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-[#1e293b] grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">EduCareer-AI-360</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified university career, skill gap, readiness analytics, and placement orchestration platform.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure Role-Based Authorization
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">For Students</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/login" className="hover:text-white transition-colors">Placement Readiness</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Skill-Gap Analyzer</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Career Roadmaps</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">AI Career Coach</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">For Placement Officers</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/login" className="hover:text-white transition-colors">Job Drive Management</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Recruitment Workflows</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Placement Analytics</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Report Exports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Platform Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by Next.js REST API Architecture, Node.js Backend Engine, PostgreSQL Prisma ORM, and Python FastAPI ML Service.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EduCareer-AI-360. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <span>Production Version 1.0.0</span>
            <span>REST API v1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
