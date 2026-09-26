'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Target,
  Compass,
  Briefcase,
  Bot,
  BarChart3,
  CheckCircle2,
  Users,
  Award,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-blue-900/5 via-slate-50 to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI-Enabled University Career & Placement Ecosystem</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
              Transforming Academic Talent into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Placement Excellence</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              EduCareer-AI-360 combines deterministic placement readiness algorithms, interactive skill-gap analysis, recruitment pipeline automation, and AI career coaching into one unified university SaaS platform.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  Explore Student Portal
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Placement Officer Sign In
                </Button>
              </Link>
            </div>

            {/* PLATFORM STATS */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { label: 'Readiness Metrics', value: '100% Data-Driven', icon: <Target className="w-5 h-5 text-blue-600" /> },
                { label: 'Skill Taxonomy', value: 'Verified Skill-Gaps', icon: <Award className="w-5 h-5 text-teal-600" /> },
                { label: 'Recruitment Drives', value: 'Automated Pipeline', icon: <Briefcase className="w-5 h-5 text-indigo-600" /> },
                { label: 'AI Career Coach', value: 'Contextual AI', icon: <Bot className="w-5 h-5 text-purple-600" /> },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle text-left">
                  <div className="p-2 bg-slate-50 rounded-xl w-fit mb-3">{stat.icon}</div>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Core Capabilities</h2>
              <p className="text-3xl font-extrabold text-slate-900">Designed for Students, Faculty, and TPO Leaders</p>
              <p className="mt-3 text-slate-600 text-sm">
                Complete end-to-end tooling to bridge student skills with recruiter demand.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="w-6 h-6 text-blue-600" />,
                  title: 'Placement Readiness Engine',
                  description: 'Transparent scoring calculated from academic CGPA, verified skill counts, resume completeness, and practical experience.',
                },
                {
                  icon: <Sparkles className="w-6 h-6 text-teal-600" />,
                  title: 'Deterministic Skill-Gap Analysis',
                  description: 'Real-time mapping of your current skill inventory against target career requirements with high-priority missing skill alerts.',
                },
                {
                  icon: <Compass className="w-6 h-6 text-indigo-600" />,
                  title: 'Career Roadmaps & Simulator',
                  description: 'Interactive career path progression milestone cards and hypothetical skill profile simulators.',
                },
                {
                  icon: <Briefcase className="w-6 h-6 text-blue-600" />,
                  title: 'Recruitment & Job Drives',
                  description: 'Deterministic server-side eligibility validation before student job application submission.',
                },
                {
                  icon: <Bot className="w-6 h-6 text-purple-600" />,
                  title: 'AI Career Coach',
                  description: 'Context-aware conversational assistant providing interview prep, resume guidance, and skill growth strategies.',
                },
                {
                  icon: <BarChart3 className="w-6 h-6 text-teal-600" />,
                  title: 'Institutional Analytics & Reports',
                  description: 'Department-level placement metrics, salary distribution tracking, and CSV report export generation.',
                },
              ].map((feat, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-subtle hover:border-blue-300 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-subtle flex items-center justify-center mb-4">{feat.icon}</div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RECRUITMENT WORKFLOW */}
        <section id="ecosystem" className="py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Connected Workflows</h2>
              <p className="text-3xl font-extrabold text-white">End-to-End Placement Lifecycle</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {[
                  { title: '1. Profile & Academic Ingestion', text: 'Students create profiles, upload academic records, and list self-reported technical skills.' },
                  { title: '2. Skill Validation & Gap Analysis', text: 'Faculty officers verify student skill assertions while algorithms generate career gap reports.' },
                  { title: '3. Job Drive & Eligibility Engine', text: 'TPO officers publish placement drives with hard criteria (CGPA, deadline, skills).' },
                  { title: '4. Application Pipeline & Selection', text: 'Eligible students apply; recruiters shortlist candidates through multi-stage pipelines.' },
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{step.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
                  <span className="text-xs font-semibold text-slate-300">Live Placement Pipeline Mock</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">Active Drive</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Senior Fullstack Engineer', company: 'TechCorp Solutions', package: '18 LPA', status: 'SHORTLISTED', count: '42 Candidates' },
                    { name: 'Data Scientist', company: 'Analytics AI', package: '22 LPA', status: 'INTERVIEWING', count: '18 Candidates' },
                    { name: 'Cloud Infrastructure Associate', company: 'CloudSys Global', package: '14 LPA', status: 'SELECTED', count: '12 Offers' },
                  ].map((job, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{job.name}</p>
                        <p className="text-[11px] text-slate-400">{job.company} • {job.package}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-16 bg-blue-600 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold mb-4">Ready to Elevate University Career Outcomes?</h2>
            <p className="text-blue-100 text-sm max-w-xl mx-auto mb-8">
              Empower your campus with real-time placement readiness, skill gap analysis, and automated recruitment workflows.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Register Student Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
