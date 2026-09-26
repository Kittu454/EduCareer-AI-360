'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, FileCheck2, Users, TrendingUp, Plus, ArrowRight, Award } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

export default function TpoDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>('/analytics/tpo/metrics').then((res) => {
      if (res.success && res.data) setMetrics(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout
      title="TPO Placement Operations"
      subtitle="Overview of campus placement drives, candidate readiness, and hiring stats."
      action={
        <Link href="/tpo/jobs">
          <Button size="sm" icon={<Plus className="w-4 h-4" />}>
            Create Placement Drive
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-l-4 border-l-blue-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.totalStudents || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Enrolled university candidates</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-teal-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Placement Drives</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.totalJobs || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Active company postings</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-indigo-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Applications</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.totalApplications || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Submitted candidate applications</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-emerald-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus Placement Rate</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics?.placementRate || 0}%</p>
            <p className="text-[11px] text-slate-400 mt-1">Verified placement selections</p>
          </Card>
        </div>

        {/* QUICK LINK PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Recruitment Pipeline" subtitle="Review candidates by stage">
            <p className="text-xs text-slate-600 mb-4">
              Shortlist, schedule interviews, and record selection outcomes.
            </p>
            <Link href="/tpo/applications">
              <Button size="sm" variant="outline" className="w-full">Manage Pipeline</Button>
            </Link>
          </Card>

          <Card title="Candidate Pool" subtitle="Filter by CGPA & Readiness">
            <p className="text-xs text-slate-600 mb-4">
              Search candidate pool by department, skills, and readiness index.
            </p>
            <Link href="/tpo/students">
              <Button size="sm" variant="outline" className="w-full">Search Candidates</Button>
            </Link>
          </Card>

          <Card title="Placement Reports" subtitle="Generate & Export Reports">
            <p className="text-xs text-slate-600 mb-4">
              Export placement datasets in CSV and JSON formats.
            </p>
            <Link href="/tpo/reports">
              <Button size="sm" variant="outline" className="w-full">Export Data</Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
