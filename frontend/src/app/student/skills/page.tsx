'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, CheckCircle2, AlertCircle, Trash2, Award } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { apiFetch } from '../../../lib/api';
import { StudentSkill, Skill, SkillGap, Career } from '../../../types';

export default function StudentSkillsPage() {
  const [studentSkills, setStudentSkills] = useState<StudentSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('BEGINNER');
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [userSkillsRes, taxonomyRes, careersRes, gapsRes] = await Promise.all([
        apiFetch<StudentSkill[]>('/skills/students/me/skills'),
        apiFetch<Skill[]>('/skills?limit=100'),
        apiFetch<Career[]>('/careers'),
        apiFetch<SkillGap[]>('/careers/students/me/skill-gaps'),
      ]);

      if (userSkillsRes.success && userSkillsRes.data) setStudentSkills(userSkillsRes.data);
      if (taxonomyRes.success && taxonomyRes.data) setAllSkills(taxonomyRes.data);
      if (careersRes.success && careersRes.data) {
        setCareers(careersRes.data);
        if (careersRes.data.length > 0) setSelectedCareerId(careersRes.data[0].id);
      }
      if (gapsRes.success && gapsRes.data) setGaps(gapsRes.data);
    }

    loadData();
  }, []);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    setSubmitting(true);
    const res = await apiFetch<StudentSkill>('/skills/students/me/skills', {
      method: 'POST',
      body: JSON.stringify({ skillId: selectedSkillId, proficiencyLevel: proficiency }),
    });

    setSubmitting(false);
    if (res.success && res.data) {
      setStudentSkills([...studentSkills, res.data]);
      setIsAddModalOpen(false);
      setSelectedSkillId('');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    const res = await apiFetch(`/skills/students/me/skills/${id}`, { method: 'DELETE' });
    if (res.success) {
      setStudentSkills(studentSkills.filter((s) => s.id !== id));
    }
  };

  const handleAnalyzeGaps = async () => {
    if (!selectedCareerId) return;
    setAnalyzing(true);
    const res = await apiFetch<SkillGap[]>('/careers/skill-gaps/analyze', {
      method: 'POST',
      body: JSON.stringify({ targetCareerId: selectedCareerId }),
    });
    setAnalyzing(false);
    if (res.success && res.data) {
      setGaps(res.data);
    }
  };

  return (
    <DashboardLayout title="Skills & Skill-Gap Analysis" subtitle="Manage your skill inventory and analyze target career gaps.">
      <div className="space-y-6">
        {/* SKILLS INVENTORY CARD */}
        <Card
          title="My Verified & Claimed Skills"
          subtitle="Self-reported technical and professional skills"
          action={
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
              Add Skill
            </Button>
          }
        >
          {studentSkills.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No skills added yet. Click "Add Skill" to build your inventory!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {studentSkills.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900">{item.skill.name}</p>
                      {item.verified && (
                        <span title="Faculty Verified">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{item.skill.category} • {item.proficiencyLevel}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSkill(item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Remove Skill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* SKILL GAP ANALYSIS ENGINE SECTION */}
        <Card title="Skill-Gap Analyzer Engine" subtitle="Deterministic calculation against career requirements">
          <div className="flex flex-col sm:flex-row items-end gap-4 pb-6 mb-6 border-b border-slate-100">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Career Path</label>
              <select
                className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCareerId}
                onChange={(e) => setSelectedCareerId(e.target.value)}
              >
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleAnalyzeGaps} loading={analyzing} icon={<Sparkles className="w-4 h-4 text-teal-300" />}>
              Analyze Gaps
            </Button>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-3">Target Skill Gaps Identified</h4>
            {gaps.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No missing skills detected for this career path! You satisfy the requirements.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {gaps.map((gap) => (
                  <div key={gap.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-subtle">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{gap.skill.name}</p>
                        <p className="text-[10px] text-slate-500">{gap.skill.category}</p>
                      </div>
                    </div>
                    <Badge variant={gap.priority === 'HIGH' ? 'danger' : 'warning'}>
                      {gap.priority} Priority
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ADD SKILL MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Skill to Profile">
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Skill</label>
            <select
              className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              required
            >
              <option value="">Select a skill from taxonomy...</option>
              {allSkills.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Proficiency Level</label>
            <select
              className="w-full rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value as any)}
            >
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="ADVANCED">ADVANCED</option>
              <option value="EXPERT">EXPERT</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Skill</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
