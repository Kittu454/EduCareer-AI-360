'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Sparkles,
  Briefcase,
  Bot,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { apiFetch } from '../../../lib/api';
import { PlacementReadiness, Job, JobApplication, SkillGap } from '../../../types';

export default function StudentDashboard() {
  const [readiness, setReadiness] = useState<PlacementReadiness | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [readinessRes, jobsRes, appsRes, gapsRes] = await Promise.all([
        apiFetch<PlacementReadiness>('/placement-readiness/students/me/placement-readiness'),
        apiFetch<Job[]>('/jobs?limit=3'),
        apiFetch<JobApplication[]>('/applications?limit=3'),
        apiFetch<SkillGap[]>('/careers/students/me/skill-gaps'),
      ]);

      if (readinessRes.success && readinessRes.data) setReadiness(readinessRes.data);
      if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data);
      if (appsRes.success && appsRes.data) setApplications(appsRes.data);
      if (gapsRes.success && gapsRes.data) setGaps(gapsRes.data);

      setLoading(false);
    }

    loadData();
  }, []);

  const readinessScore = readiness ? Number(readiness.readinessScore) : 0;
  const statusLabel = readiness ? readiness.statusLabel : 'ACTION_NEEDED';

  return (
    <DashboardLayout title="Student Overview" subtitle="Welcome back! Here is your placement & career progress.">
      <div className="space-y-6">
        {/* TOP BANNER & READINESS METRIC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
            <div className="relative z-10 p-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Placement Season 2026
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Accelerate Your Placement Readiness</h2>
              <p className="text-xs text-slate-300 max-w-lg mb-6 leading-relaxed">
                Your placement score is derived from verified technical skills, academic records, resume profile, and applications.
              </p>
              <div className="flex gap-3">
                <Link href="/student/readiness">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                    View Score Breakdown
                  </Button>
                </Link>
                <Link href="/student/ai-coach">
                  <Button size="sm">
                    <Bot className="w-4 h-4" /> Ask AI Coach
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card title="Placement Readiness Score" subtitle="Calculated from database profile">
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative flex items-center justify-center w-28 h-28 my-2">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-slate-900">{readinessScore}%</span>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Score</p>
                </div>
              </div>
              <Badge variant={statusLabel === 'PLACEMENT_READY' ? 'success' : statusLabel === 'MODERATE_READINESS' ? 'info' : 'warning'}>
                {statusLabel.replace('_', ' ')}
              </Badge>
              <Progress value={readinessScore} className="mt-4" color={readinessScore >= 80 ? 'emerald' : 'blue'} />
            </div>
          </Card>
        </div>

        {/* MIDDLE SECTION: UPCOMING JOBS & ACTIVE APPLICATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Active Placement Drives"
            subtitle="Explore eligible job postings"
            action={
              <Link href="/student/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                Browse All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {jobs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No placement drives published yet.</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{job.title}</p>
                      <p className="text-[11px] text-slate-500">{job.company.name} • Min CGPA: {Number(job.minGpa)}</p>
                    </div>
                    <Link href={`/student/jobs`}>
                      <Button size="sm" variant="outline">Apply</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="My Job Applications"
            subtitle="Track application status"
            action={
              <Link href="/student/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {applications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">You haven't submitted any job applications yet.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{app.job.title}</p>
                      <p className="text-[11px] text-slate-500">{app.job.company.name}</p>
                    </div>
                    <Badge variant={app.status === 'SELECTED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'info'}>
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* BOTTOM SECTION: SKILL GAPS & AI COACH SHORTCUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="md:col-span-2"
            title="Top Skill Gaps to Improve"
            subtitle="Identified from target career requirement matching"
            action={
              <Link href="/student/skills" className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                Skills Center
              </Link>
            }
          >
            {gaps.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">All key skills satisfied or skill gap analysis pending.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gaps.slice(0, 4).map((gap) => (
                  <div key={gap.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between shadow-subtle">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{gap.skill.name}</p>
                        <p className="text-[10px] text-slate-500">{gap.skill.category}</p>
                      </div>
                    </div>
                    <Badge variant={gap.priority === 'HIGH' ? 'danger' : 'warning'}>{gap.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="AI Career Assistant" subtitle="Prompt suggestions">
            <div className="space-y-2">
              <Link href="/student/ai-coach" className="block p-2.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-xs text-slate-700 hover:text-blue-700 transition-colors border border-slate-200">
                💬 "How can I improve my placement readiness?"
              </Link>
              <Link href="/student/ai-coach" className="block p-2.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-xs text-slate-700 hover:text-blue-700 transition-colors border border-slate-200">
                📝 "What skills should I add to my resume?"
              </Link>
              <Link href="/student/ai-coach" className="block p-2.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-xs text-slate-700 hover:text-blue-700 transition-colors border border-slate-200">
                🎯 "Help me prepare for technical interviews."
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
