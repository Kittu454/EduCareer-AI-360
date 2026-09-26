'use client';

import React, { useEffect, useState } from 'react';
import { FileCheck2, Search, Filter } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { JobApplication } from '../../../types';

export default function TpoApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  async function loadApplications() {
    const url = `/applications?${statusFilter ? `status=${statusFilter}` : ''}`;
    const res = await apiFetch<JobApplication[]>(url);
    if (res.success && res.data) setApplications(res.data);
  }

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    const res = await apiFetch(`/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) {
      setApplications(applications.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a)));
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      app.student?.firstName.toLowerCase().includes(term) ||
      app.student?.lastName.toLowerCase().includes(term) ||
      app.student?.rollNumber.toLowerCase().includes(term) ||
      app.job.title.toLowerCase().includes(term) ||
      app.job.company.name.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout title="Candidate Recruitment Pipeline" subtitle="Review candidates, update recruitment status, and record offers.">
      <div className="space-y-6">
        {/* FILTER BAR */}
        <Card>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search candidate name, roll number, or job title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              className="rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Pipeline Stages</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="SHORTLISTED">SHORTLISTED</option>
              <option value="ASSESSMENT">ASSESSMENT</option>
              <option value="INTERVIEW">INTERVIEW</option>
              <option value="SELECTED">SELECTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </Card>

        {/* CANDIDATE PIPELINE TABLE */}
        <Card title="Candidate Pipeline Applications" subtitle="Manage status transitions">
          {filteredApps.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No applications found matching your criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Job Title & Company</th>
                    <th className="p-3">Applied Date</th>
                    <th className="p-3">Stage Status</th>
                    <th className="p-3 text-right">Update Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">
                        {app.student ? `${app.student.firstName} ${app.student.lastName}` : 'Candidate'}
                      </td>
                      <td className="p-3 font-mono">{app.student?.rollNumber || 'N/A'}</td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{app.job.title}</p>
                        <p className="text-[11px] text-slate-500">{app.job.company.name}</p>
                      </td>
                      <td className="p-3">{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Badge variant={
                          app.status === 'SELECTED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'info'
                        }>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          className="rounded border border-slate-300 text-[11px] p-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        >
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="SHORTLISTED">SHORTLISTED</option>
                          <option value="ASSESSMENT">ASSESSMENT</option>
                          <option value="INTERVIEW">INTERVIEW</option>
                          <option value="SELECTED">SELECTED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
