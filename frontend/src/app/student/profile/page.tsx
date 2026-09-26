'use client';

import React, { useEffect, useState } from 'react';
import { User, GraduationCap, Building, Hash, Calendar, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { Student } from '../../../types';

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiFetch<Student>('/students/me').then((res) => {
      if (res.success && res.data) {
        setStudent(res.data);
        setFirstName(res.data.firstName);
        setLastName(res.data.lastName);
        if (res.data.graduationYear) setGraduationYear(res.data.graduationYear);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const res = await apiFetch<Student>('/students/me', {
      method: 'PATCH',
      body: JSON.stringify({
        firstName,
        lastName,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
      }),
    });

    setSaving(false);
    if (res.success && res.data) {
      setStudent(res.data);
      setMsg('Profile updated successfully.');
    }
  };

  return (
    <DashboardLayout title="Student Profile" subtitle="Manage your academic identity and personal profile.">
      <div className="max-w-4xl mx-auto space-y-6">
        {student && (
          <Card className="bg-gradient-to-r from-blue-900 to-slate-900 text-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-extrabold text-xl text-white shadow-md">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5">Roll No: {student.rollNumber}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="info">{student.department?.name || 'Computer Science'}</Badge>
                  <Badge variant="success">Current CGPA: {Number(student.currentGpa).toFixed(2)}</Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card title="Edit Personal Information" subtitle="Update profile details">
          {msg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{msg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Roll Number (Read-Only)"
                value={student?.rollNumber || ''}
                disabled
                icon={<Hash className="w-4 h-4" />}
              />
              <Input
                label="Admission Year (Read-Only)"
                value={student?.admissionYear || ''}
                disabled
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Graduation Year"
              type="number"
              value={graduationYear || ''}
              onChange={(e) => setGraduationYear(Number(e.target.value))}
              placeholder="2026"
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
