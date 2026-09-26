'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, GraduationCap, Award, AlertTriangle, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';

export default function FacultyDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    apiFetch<any>('/analytics/faculty/analytics').then((res) => {
      if (res.success && res.data) setStats(res.data);
    });
  }, []);

  return (
    <DashboardLayout title="Faculty Portal Overview" subtitle="Department academic performance and student skill verification.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-l-4 border-l-blue-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Students</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalStudents || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Enrolled department roster</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-teal-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Avg CGPA</p>
            <p className="text-2xl font-extrabold text-teal-600 mt-1">{stats?.averageGpa || 0.0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Mean academic average</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-amber-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">At-Risk Candidates</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats?.atRiskStudentsCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">CGPA &lt; 6.5 or low attendance</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Alerts</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">{stats?.lowAttendanceCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Low attendance course records</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Grade Entry" subtitle="Submit course marks">
            <p className="text-xs text-slate-600 mb-4">
              Record semester course grades and calculate updated student CGPA.
            </p>
            <Link href="/faculty/academics">
              <Button size="sm" variant="outline" className="w-full">Grade Entry Form</Button>
            </Link>
          </Card>

          <Card title="Skill Verification" subtitle="Validate practical skills">
            <p className="text-xs text-slate-600 mb-4">
              Review self-reported student skills and grant faculty verified badges.
            </p>
            <Link href="/faculty/skills">
              <Button size="sm" variant="outline" className="w-full">Skill Validation Portal</Button>
            </Link>
          </Card>

          <Card title="Student Roster" subtitle="Department student list">
            <p className="text-xs text-slate-600 mb-4">
              View department student academic history and progress.
            </p>
            <Link href="/faculty/students">
              <Button size="sm" variant="outline" className="w-full">View Roster</Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
