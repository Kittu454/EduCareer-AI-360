'use client';

import React, { useEffect, useState } from 'react';
import { Briefcase, Search, Calendar, Building, CheckCircle2, XCircle, ArrowRight, Check } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { apiFetch } from '../../../lib/api';
import { Job, JobApplication } from '../../../types';

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applyMsg, setApplyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadJobs();
    loadMyApplications();
  }, []);

  async function loadJobs(searchQuery = '') {
    const res = await apiFetch<Job[]>(`/jobs?search=${encodeURIComponent(searchQuery)}`);
    if (res.success && res.data) setJobs(res.data);
  }

  async function loadMyApplications() {
    const res = await apiFetch<JobApplication[]>('/applications');
    if (res.success && res.data) {
      setAppliedJobIds(new Set(res.data.map((a) => a.jobId)));
    }
  }

  const handleOpenDetail = async (jobId: string) => {
    setApplyMsg(null);
    const res = await apiFetch<Job>(`/jobs/${jobId}`);
    if (res.success && res.data) {
      setSelectedJob(res.data);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplying(true);
    setApplyMsg(null);

    const res = await apiFetch<JobApplication>(`/applications/jobs/${jobId}/apply`, {
      method: 'POST',
    });

    setApplying(false);

    if (res.success && res.data) {
      setAppliedJobIds(new Set([...Array.from(appliedJobIds), jobId]));
      setApplyMsg({ type: 'success', text: 'Application submitted successfully!' });
    } else {
      setApplyMsg({ type: 'error', text: res.error?.message || 'Failed to apply.' });
    }
  };

  return (
    <DashboardLayout title="Jobs & Placement Drives" subtitle="Browse active placement drives and check your eligibility.">
      <div className="space-y-6">
        {/* SEARCH BAR */}
        <Card>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search job title, company name, or skills..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadJobs(e.target.value);
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </Card>

        {/* JOBS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const isApplied = appliedJobIds.has(job.id);
            const isExpired = new Date(job.applicationDeadline) < new Date();

            return (
              <Card key={job.id} className="flex flex-col justify-between shadow-hover">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                      <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5" /> {job.company.name}
                      </p>
                    </div>
                    {isApplied ? (
                      <Badge variant="success">Applied</Badge>
                    ) : isExpired ? (
                      <Badge variant="neutral">Closed</Badge>
                    ) : (
                      <Badge variant="info">Active Drive</Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 my-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <p className="flex justify-between">
                      <span>Min CGPA Required:</span>
                      <span className="font-semibold text-slate-900">{Number(job.minGpa).toFixed(1)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Application Deadline:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(job.applicationDeadline).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {job.jobSkills.slice(0, 2).map((js) => (
                      <span key={js.skillId} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                        {js.skill.name}
                      </span>
                    ))}
                  </div>

                  <Button size="sm" variant="outline" onClick={() => handleOpenDetail(job.id)}>
                    View & Apply
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* JOB DETAIL & ELIGIBILITY MODAL */}
        {selectedJob && (
          <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob.title} maxWidth="lg">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-blue-600">{selectedJob.company.name}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedJob.description}</p>
              </div>

              {/* DETERMINISTIC ELIGIBILITY BREAKDOWN */}
              {selectedJob.eligibility && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900">Eligibility Engine Evaluation</span>
                    <Badge variant={selectedJob.eligibility.eligible ? 'success' : 'danger'}>
                      {selectedJob.eligibility.eligible ? 'Eligible to Apply' : 'Ineligible'}
                    </Badge>
                  </div>

                  <div className="space-y-2 pt-1">
                    {selectedJob.eligibility.checks.map((check, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {check.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          <span className="font-medium text-slate-700">{check.criterion}: {check.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {applyMsg && (
                <div className={`p-3 rounded-lg text-xs border ${
                  applyMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {applyMsg.text}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setSelectedJob(null)}>Close</Button>
                {appliedJobIds.has(selectedJob.id) ? (
                  <Button disabled icon={<Check className="w-4 h-4" />}>Applied</Button>
                ) : (
                  <Button
                    onClick={() => handleApply(selectedJob.id)}
                    loading={applying}
                    disabled={selectedJob.eligibility ? !selectedJob.eligibility.eligible : false}
                  >
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
