'use client';

import React, { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';
import { Student, Subject, Semester } from '../../../types';

export default function FacultyAcademicsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [gradePoints, setGradePoints] = useState(9.0);
  const [letterGrade, setLetterGrade] = useState('A+');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      const [studentsRes, semRes, subRes] = await Promise.all([
        apiFetch<Student[]>('/students'),
        apiFetch<Semester[]>('/academics/semesters'),
        apiFetch<Subject[]>('/academics/subjects'),
      ]);

      if (studentsRes.success && studentsRes.data) setStudents(studentsRes.data);
      if (semRes.success && semRes.data) setSemesters(semRes.data);
      if (subRes.success && subRes.data) setSubjects(subRes.data);
    }

    loadData();
  }, []);

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    const res = await apiFetch('/academics/academic-records', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        semesterId,
        subjectId,
        gradePoints: Number(gradePoints),
        letterGrade,
      }),
    });

    setSubmitting(false);

    if (res.success) {
      setMsg({ type: 'success', text: 'Grade record created and CGPA recalculated!' });
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit grade record.' });
    }
  };

  return (
    <DashboardLayout title="Academic Grade Entry" subtitle="Submit course marks and calculate updated student CGPA.">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card title="Enter Student Grade Record" subtitle="Academic record entry form">
          {msg && (
            <div className={`p-3 rounded-lg text-xs border mb-4 ${
              msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmitGrade} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Student</label>
              <select
                className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              >
                <option value="">Select Candidate...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Semester</label>
                <select
                  className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  required
                >
                  <option value="">Select Semester...</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>{sem.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                <select
                  className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Grade Points (0.0 - 10.0)"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={gradePoints}
                onChange={(e) => setGradePoints(Number(e.target.value))}
                required
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Letter Grade</label>
                <select
                  className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={letterGrade}
                  onChange={(e) => setLetterGrade(e.target.value)}
                >
                  <option value="O">O (Outstanding)</option>
                  <option value="A+">A+ (Excellent)</option>
                  <option value="A">A (Very Good)</option>
                  <option value="B+">B+ (Good)</option>
                  <option value="B">B (Above Average)</option>
                  <option value="C">C (Pass)</option>
                  <option value="F">F (Fail)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={submitting}>
                Submit Grade & Update CGPA
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
