'use client';

import React, { useEffect, useState } from 'react';
import { FileCheck2, Building, Calendar, ArrowRight, XCircle } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { JobApplication } from '../../../types';

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    const res = await apiFetch<JobApplication[]>('/applications');
    if (res.success && res.data) setApplications(res.data);
    setLoading(false);
  }

  const handleWithdraw = async (appId: string) => {
    const res = await apiFetch(`/applications/${appId}/withdraw`, { method: 'POST' });
    if (res.success) {
      loadApplications();
    }
  };

  const STAGES = ['SUBMITTED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED'];

  return (
    <DashboardLayout title="My Applications & Recruitment Pipeline" subtitle="Track application status across active hiring drives.">
      <div className="space-y-6">
        <Card title="Submitted Job Applications" subtitle="Recruitment workflow pipeline tracking">
          {applications.length === 0 ? (
            <div className="text-center py-10">
              <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-700">No Applications Submitted Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Explore placement drives to check eligibility and submit your first application.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const currentStageIdx = STAGES.indexOf(app.status);
                const isFinalState = ['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(app.status);

                return (
                  <div key={app.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{app.job.title}</h4>
                        <p className="text-xs font-medium text-slate-500">{app.job.company.name} • Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            app.status === 'SELECTED' ? 'success' : app.status === 'REJECTED' ? 'danger' : app.status === 'WITHDRAWN' ? 'neutral' : 'info'
                          }
                        >
                          {app.status}
                        </Badge>

                        {!isFinalState && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleWithdraw(app.id)}>
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* PIPELINE VISUAL TRACKER */}
                    {!isFinalState && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Recruitment Pipeline Progress</p>
                        <div className="flex items-center justify-between gap-1">
                          {STAGES.map((stage, idx) => {
                            const isPassed = currentStageIdx >= idx;
                            const isCurrent = currentStageIdx === idx;

                            return (
                              <div key={stage} className="flex-1 flex flex-col items-center">
                                <div className={`w-full h-1.5 rounded-full mb-1 ${
                                  isPassed ? 'bg-blue-600' : 'bg-slate-200'
                                }`} />
                                <span className={`text-[10px] font-medium truncate ${
                                  isCurrent ? 'text-blue-600 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                                }`}>
                                  {stage}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
