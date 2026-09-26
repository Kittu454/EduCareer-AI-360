'use client';

import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, Target, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { apiFetch } from '../../../lib/api';
import { Career, CareerRecommendation, CareerRoadmap } from '../../../types';

export default function StudentCareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [careersRes, recsRes, roadmapRes] = await Promise.all([
        apiFetch<Career[]>('/careers'),
        apiFetch<CareerRecommendation[]>('/careers/students/me/career-recommendations'),
        apiFetch<CareerRoadmap>('/careers/students/me/roadmap'),
      ]);

      if (careersRes.success && careersRes.data) setCareers(careersRes.data);
      if (recsRes.success && recsRes.data) setRecommendations(recsRes.data);
      if (roadmapRes.success && roadmapRes.data) setRoadmap(roadmapRes.data);
    }

    loadData();
  }, []);

  const handleGenerateRecommendations = async () => {
    setGenerating(true);
    const res = await apiFetch<CareerRecommendation[]>('/careers/recommendations/generate', { method: 'POST' });
    setGenerating(false);
    if (res.success && res.data) {
      setRecommendations(res.data);
    }
  };

  const handleGenerateRoadmap = async (careerId: string) => {
    const res = await apiFetch<CareerRoadmap>('/careers/roadmaps', {
      method: 'POST',
      body: JSON.stringify({ targetCareerId: careerId }),
    });
    if (res.success && res.data) {
      setRoadmap(res.data);
    }
  };

  return (
    <DashboardLayout title="Career Exploration & Roadmaps" subtitle="Discover career paths, match percentage, and step-by-step learning roadmaps.">
      <div className="space-y-6">
        {/* CAREER RECOMMENDATIONS BANNER */}
        <Card
          title="Career Recommendations & Skill Overlap"
          subtitle="Matching algorithms based on verified skill profile and CGPA"
          action={
            <Button size="sm" icon={<Sparkles className="w-4 h-4 text-teal-300" />} onClick={handleGenerateRecommendations} loading={generating}>
              Update Recommendations
            </Button>
          }
        >
          {recommendations.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Click "Update Recommendations" to match your skills with career paths!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">{rec.career.title}</h4>
                      <Badge variant={rec.matchPercentage >= 80 ? 'success' : 'info'}>
                        {rec.matchPercentage}% Match
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">{rec.rationale}</p>
                    <Progress value={rec.matchPercentage} color={rec.matchPercentage >= 80 ? 'emerald' : 'blue'} />
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleGenerateRoadmap(rec.career.id)}>
                      Generate Roadmap
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ACTIVE CAREER ROADMAP */}
        {roadmap && (
          <Card title={`Active Roadmap: ${roadmap.targetCareer}`} subtitle="Sequenced milestone learning roadmap">
            <div className="space-y-3">
              {roadmap.items.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      item.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : item.status === 'CURRENT' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {item.sequenceOrder}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500">Skill: {item.skill.name} ({item.skill.category})</p>
                    </div>
                  </div>
                  <Badge variant={item.status === 'COMPLETED' ? 'success' : item.status === 'CURRENT' ? 'info' : 'neutral'}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* CAREERS TAXONOMY EXPLORER */}
        <Card title="Career Taxonomy Explorer" subtitle="Browse all university placement career tracks">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {careers.map((c) => (
              <div key={c.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{c.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description || 'Professional tech career path.'}</p>
                  <p className="text-[11px] font-medium text-slate-700">Min CGPA Required: {Number(c.minGpaRequirement).toFixed(1)}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{c.careerSkills?.length || 0} Required Skills</span>
                  <Button size="sm" variant="ghost" onClick={() => handleGenerateRoadmap(c.id)}>
                    View Track
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
