'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Award, Zap } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { apiFetch } from '../../../lib/api';

export default function TpoAnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    apiFetch<any>('/analytics/tpo/metrics').then((res) => {
      if (res.success && res.data) setMetrics(res.data);
    });
  }, []);

  return (
    <DashboardLayout title="Placement Analytics & Skill Demand" subtitle="Real-time institutional placement stats and skill market demand.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Top Recruiter Demanded Skills" subtitle="Extracted from active job drive postings">
            {!metrics?.skillDemand || metrics.skillDemand.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No skill demand data calculated yet.</p>
            ) : (
              <div className="space-y-3">
                {metrics.skillDemand.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                      <span>{item.skillName}</span>
                      <span className="text-blue-600">{item.demandCount} Job Drives</span>
                    </div>
                    <Progress value={Math.min(100, item.demandCount * 25)} color="blue" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Placement Conversion Funnel" subtitle="Recruitment stage progression stats">
            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700">Total Applications Submitted</span>
                <span className="text-sm font-bold text-slate-900">{metrics?.totalApplications || 0}</span>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-blue-800">Shortlisted Candidates</span>
                <span className="text-sm font-bold text-blue-700">{metrics?.shortlistedCount || 0}</span>
              </div>
              <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-teal-800">Active Interview Stages</span>
                <span className="text-sm font-bold text-teal-700">{metrics?.interviewingCount || 0}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-800">Final Placements & Offers</span>
                <span className="text-sm font-bold text-emerald-700">{metrics?.selectedCount || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
