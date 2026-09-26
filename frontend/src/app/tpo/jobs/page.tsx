'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { apiFetch } from '../../../lib/api';
import { Job, Company } from '../../../types';

export default function TpoJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minGpa, setMinGpa] = useState(7.0);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [jobsRes, companiesRes] = await Promise.all([
      apiFetch<Job[]>('/jobs'),
      apiFetch<Company[]>('/jobs/companies'),
    ]);

    if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data);
    if (companiesRes.success && companiesRes.data) setCompanies(companiesRes.data);
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName) return;
    const res = await apiFetch<Company>('/jobs/companies', {
      method: 'POST',
      body: JSON.stringify({ name: newCompanyName }),
    });

    if (res.success && res.data) {
      setCompanies([...companies, res.data]);
      setCompanyId(res.data.id);
      setNewCompanyName('');
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    const res = await apiFetch<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        title,
        description,
        minGpa: Number(minGpa),
        applicationDeadline: new Date(deadline).toISOString(),
      }),
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setJobs([res.data, ...jobs]);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
    } else {
      setMsg(res.error?.message || 'Failed to create job posting.');
    }
  };

  const handleDeleteJob = async (id: string) => {
    const res = await apiFetch(`/jobs/${id}`, { method: 'DELETE' });
    if (res.success) {
      setJobs(jobs.filter((j) => j.id !== id));
    }
  };

  return (
    <DashboardLayout
      title="Placement Drives Management"
      subtitle="Publish and manage campus job postings."
      action={
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Create New Job Drive
        </Button>
      }
    >
      <div className="space-y-6">
        <Card title="Published Placement Drives" subtitle="Active and past job listings">
          {jobs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No placement drives published yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Company</th>
                    <th className="p-3">Job Title</th>
                    <th className="p-3">Min CGPA</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => {
                    const isExpired = new Date(j.applicationDeadline) < new Date();
                    return (
                      <tr key={j.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{j.company.name}</td>
                        <td className="p-3 font-medium text-slate-900">{j.title}</td>
                        <td className="p-3 font-semibold text-blue-600">{Number(j.minGpa).toFixed(1)}</td>
                        <td className="p-3">{new Date(j.applicationDeadline).toLocaleDateString()}</td>
                        <td className="p-3">
                          <Badge variant={isExpired ? 'neutral' : 'success'}>
                            {isExpired ? 'Closed' : 'Active'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteJob(j.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* CREATE JOB MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Placement Drive">
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
              >
                <option value="">Select Company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              placeholder="Or add new company name..."
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />
            <Button size="sm" type="button" variant="outline" onClick={handleCreateCompany}>
              Add
            </Button>
          </div>

          <Input
            label="Job Title"
            placeholder="Associate Software Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Job Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 text-xs p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe roles, responsibilities, and qualifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min CGPA Requirement"
              type="number"
              step="0.1"
              value={minGpa}
              onChange={(e) => setMinGpa(Number(e.target.value))}
              required
            />
            <Input
              label="Application Deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Publish Job Drive</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
