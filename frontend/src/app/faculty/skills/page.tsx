'use client';

import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { Student, StudentSkill } from '../../../types';

export default function FacultySkillsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Student[]>('/students').then((res) => {
      if (res.success && res.data) {
        setStudents(res.data);
        if (res.data.length > 0) {
          setSelectedStudentId(res.data[0].id);
          loadSkillsForStudent(res.data[0].id);
        }
      }
    });
  }, []);

  async function loadSkillsForStudent(stId: string) {
    const res = await apiFetch<StudentSkill[]>(`/skills/students/${stId}/skills`);
    if (res.success && res.data) setSkills(res.data);
  }

  const handleVerifySkill = async (studentSkillId: string) => {
    setVerifying(studentSkillId);
    const res = await apiFetch(`/skills/faculty/students/${selectedStudentId}/skill-assessments`, {
      method: 'POST',
      body: JSON.stringify({
        studentSkillId,
        assessmentType: 'FACULTY_VERIFICATION',
        score: 90,
      }),
    });
    setVerifying(null);
    if (res.success) {
      setSkills(skills.map((s) => (s.id === studentSkillId ? { ...s, verified: true } : s)));
    }
  };

  return (
    <DashboardLayout title="Faculty Skill Validation" subtitle="Review self-reported student skills and grant verified badges.">
      <div className="space-y-6">
        <Card title="Select Student Candidate" subtitle="Department roster">
          <select
            className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              loadSkillsForStudent(e.target.value);
            }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>
            ))}
          </select>
        </Card>

        <Card title="Student Skill Inventory" subtitle="Verification status">
          {skills.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No skills listed by student yet.</p>
          ) : (
            <div className="space-y-3">
              {skills.map((s) => (
                <div key={s.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{s.skill.name}</p>
                      {s.verified && <Badge variant="success">Verified</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-500">{s.skill.category} • {s.proficiencyLevel}</p>
                  </div>

                  {!s.verified ? (
                    <Button
                      size="sm"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      loading={verifying === s.id}
                      onClick={() => handleVerifySkill(s.id)}
                    >
                      Verify Skill
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Faculty Verified
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
