'use client';

import React, { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { apiFetch } from '../../../lib/api';
import { AcademicRecord, Attendance, Student } from '../../../types';

export default function StudentAcademicsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAcademicData() {
      const [studentRes, recordsRes, attendanceRes] = await Promise.all([
        apiFetch<Student>('/students/me'),
        apiFetch<AcademicRecord[]>('/academics/students/me/academic-records'),
        apiFetch<Attendance[]>('/academics/students/me/attendance'),
      ]);

      if (studentRes.success && studentRes.data) setStudent(studentRes.data);
      if (recordsRes.success && recordsRes.data) setRecords(recordsRes.data);
      if (attendanceRes.success && attendanceRes.data) setAttendance(attendanceRes.data);

      setLoading(false);
    }

    loadAcademicData();
  }, []);

  return (
    <DashboardLayout title="Academic Performance" subtitle="View grades, course records, and attendance history.">
      <div className="space-y-6">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Current CGPA" subtitle="Overall Grade Point Average">
            <div className="text-3xl font-extrabold text-blue-600 my-2">
              {Number(student?.currentGpa || 0).toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ 10.0</span>
            </div>
            <p className="text-xs text-slate-500">Calculated across verified semester course grade records.</p>
          </Card>

          <Card title="Course Subjects" subtitle="Total courses completed">
            <div className="text-3xl font-extrabold text-slate-900 my-2">{records.length}</div>
            <p className="text-xs text-slate-500">Verified academic course entries</p>
          </Card>

          <Card title="Attendance Status" subtitle="Overall attendance average">
            {attendance.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No attendance records logged.</p>
            ) : (
              <div>
                <div className="text-3xl font-extrabold text-teal-600 my-2">
                  {Math.round(
                    (attendance.reduce((acc, a) => acc + (a.totalSessions > 0 ? (a.attendedSessions / a.totalSessions) : 1), 0) / attendance.length) * 100
                  )}%
                </div>
                <p className="text-xs text-slate-500">Average attendance across enrolled courses</p>
              </div>
            )}
          </Card>
        </div>

        {/* ACADEMIC RECORDS TABLE */}
        <Card title="Semester Grade Records" subtitle="Verified subject letter grades and grade points">
          {records.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No academic records recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Course Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Grade Points</th>
                    <th className="p-3">Letter Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{r.semester.name}</td>
                      <td className="p-3 font-mono text-slate-600">{r.subject.code}</td>
                      <td className="p-3 font-medium text-slate-900">{r.subject.name}</td>
                      <td className="p-3">{r.subject.credits}</td>
                      <td className="p-3 font-bold text-blue-600">{Number(r.gradePoints).toFixed(1)}</td>
                      <td className="p-3">
                        <Badge variant={['A+', 'A', 'O'].includes(r.letterGrade) ? 'success' : 'info'}>
                          {r.letterGrade}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ATTENDANCE SECTION */}
        <Card title="Subject Attendance Breakdown" subtitle="Session attendance requirement tracking">
          {attendance.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No attendance records found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attendance.map((att) => {
                const pct = att.totalSessions > 0 ? Math.round((att.attendedSessions / att.totalSessions) * 100) : 100;
                return (
                  <div key={att.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{att.subject.name}</p>
                        <p className="text-[11px] text-slate-500">{att.attendedSessions} / {att.totalSessions} sessions attended</p>
                      </div>
                      <Badge variant={pct >= 75 ? 'success' : 'danger'}>{pct}%</Badge>
                    </div>
                    <Progress value={pct} color={pct >= 75 ? 'teal' : 'rose'} />
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
