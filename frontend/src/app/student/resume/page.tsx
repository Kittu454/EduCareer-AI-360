'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Download, Sparkles, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { Student, Resume } from '../../../types';

export default function StudentResumePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeTitle, setResumeTitle] = useState('Fullstack_Software_Engineer_Resume.pdf');

  // Resume Form State
  const [summary, setSummary] = useState('Passionate software engineering student with expertise in Fullstack TypeScript, Node.js REST APIs, and database modeling.');
  const [projects, setProjects] = useState([
    { title: 'EduCareer-AI-360 Platform', desc: 'Engineered student career analytics, skill-gap analysis, and recruitment pipeline platform.' },
  ]);
  const [analyzing, setAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [studentRes, resumesRes] = await Promise.all([
        apiFetch<Student>('/students/me'),
        apiFetch<Resume[]>('/resumes'),
      ]);

      if (studentRes.success && studentRes.data) setStudent(studentRes.data);
      if (resumesRes.success && resumesRes.data) {
        setResumes(resumesRes.data);
        if (resumesRes.data.length > 0 && resumesRes.data[0].analysis) {
          setLatestAnalysis(resumesRes.data[0].analysis);
        }
      }
    }
    loadData();
  }, []);

  const handleSaveResume = async () => {
    const res = await apiFetch<Resume>('/resumes', {
      method: 'POST',
      body: JSON.stringify({ fileName: resumeTitle }),
    });

    if (res.success && res.data) {
      setResumes([res.data, ...resumes]);
      // Trigger analysis
      handleAnalyze(res.data.id);
    }
  };

  const handleAnalyze = async (resumeId: string) => {
    setAnalyzing(true);
    const res = await apiFetch<any>(`/resumes/${resumeId}/analyze`, { method: 'POST' });
    setAnalyzing(false);
    if (res.success && res.data) {
      setLatestAnalysis(res.data);
    }
  };

  const addProject = () => {
    setProjects([...projects, { title: 'New Project', desc: 'Project description...' }]);
  };

  return (
    <DashboardLayout title="Resume Builder & ATS Optimizer" subtitle="Create, edit, preview, and score your professional resume.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: EDITING CONTROLS */}
        <div className="space-y-6">
          <Card title="Resume Content Editor" subtitle="Enter verified profile information">
            <div className="space-y-4">
              <Input
                label="Resume File Title"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Professional Summary</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 text-xs p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900">Featured Projects</label>
                  <Button size="sm" variant="ghost" onClick={addProject} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Project
                  </Button>
                </div>
                <div className="space-y-3">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <Input
                        placeholder="Project Title"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].title = e.target.value;
                          setProjects(updated);
                        }}
                      />
                      <textarea
                        className="w-full rounded-lg border border-slate-300 text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Project Description..."
                        value={proj.desc}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].desc = e.target.value;
                          setProjects(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button onClick={handleSaveResume} loading={analyzing} icon={<Sparkles className="w-4 h-4 text-teal-300" />}>
                  Save & Analyze Resume
                </Button>
              </div>
            </div>
          </Card>

          {/* ANALYSIS SCORE CARD */}
          {latestAnalysis && (
            <Card title="ATS Score & Analysis" subtitle="Automated profile feedback">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Overall ATS Compatibility Score</span>
                <span className="text-xl font-extrabold text-blue-600">{Number(latestAnalysis.overallScore).toFixed(0)} / 100</span>
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">{latestAnalysis.recommendations}</p>
            </Card>
          )}
        </div>

        {/* RIGHT: LIVE RESUME PREVIEW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-700">Live Resume Preview</span>
            <Button size="sm" variant="outline" icon={<Download className="w-4 h-4" />} onClick={() => window.print()}>
              Print / Export PDF
            </Button>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-xl min-h-[600px] text-slate-900 space-y-6">
            <div className="border-b-2 border-slate-900 pb-4">
              <h1 className="text-2xl font-bold uppercase tracking-wide">{student?.firstName || 'Alex'} {student?.lastName || 'Morgan'}</h1>
              <p className="text-xs text-slate-600 mt-1">
                {student?.user?.email} • Roll No: {student?.rollNumber} • CGPA: {Number(student?.currentGpa || 0).toFixed(2)}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                Professional Summary
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                Featured Projects
              </h3>
              <div className="space-y-3">
                {projects.map((p, idx) => (
                  <div key={idx}>
                    <p className="text-xs font-bold text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                Verified Technical Skills
              </h3>
              <p className="text-xs text-slate-600">TypeScript, Node.js, Express REST API, PostgreSQL, Prisma ORM, Python FastAPI, Docker Compose</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
