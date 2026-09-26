'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { Student } from '../../../types';

export default function TpoStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents(query = '') {
    const res = await apiFetch<Student[]>(`/students?search=${encodeURIComponent(query)}`);
    if (res.success && res.data) setStudents(res.data);
  }

  return (
    <DashboardLayout title="Candidate Pool Directory" subtitle="Browse student profiles, academic CGPA, and readiness rankings.">
      <div className="space-y-6">
        <Card>
          <Input
            placeholder="Search student name, roll number, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              loadStudents(e.target.value);
            }}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        <Card title="Enrolled Candidates Directory" subtitle="Student roster">
          {students.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No students found matching your search query.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Admission Year</th>
                    <th className="p-3">Current CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{s.firstName} {s.lastName}</td>
                      <td className="p-3 font-mono">{s.rollNumber}</td>
                      <td className="p-3">{s.user?.email || 'N/A'}</td>
                      <td className="p-3">{s.department?.name || 'Computer Science'}</td>
                      <td className="p-3">{s.admissionYear}</td>
                      <td className="p-3 font-bold text-blue-600">{Number(s.currentGpa).toFixed(2)}</td>
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
