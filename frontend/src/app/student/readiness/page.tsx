'use client';

import React, { useEffect, useState } from 'react';
import { Target, Award, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { apiFetch } from '../../../lib/api';
import { PlacementReadiness } from '../../../types';

export default function StudentReadinessPage() {
  const [readiness, setReadiness] = useState<PlacementReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadReadiness();
  }, []);

  async function loadReadiness() {
    const res = await apiFetch<PlacementReadiness>('/placement-readiness/students/me/placement-readiness');
    if (res.success && res.data) setReadiness(res.data);
    setLoading(false);
  }

  const handleRecalculate = async () => {
    setRecalculating(true);
    const res = await apiFetch<PlacementReadiness>('/placement-readiness/predict', { method: 'POST' });
    setRecalculating(false);
    if (res.success && res.data) {
      setReadiness(res.data);
    }
  };

  const score = readiness ? Number(readiness.readinessScore) : 0;
  const breakdown = readiness?.breakdown || { academicScore: 75, skillsScore: 70, resumeScore: 80, practicalScore: 60 };

  return (
    <DashboardLayout title="Placement Readiness Index" subtitle="Transparent multi-dimensional placement readiness calculation.">
      <div className="space-y-6">
        {/* OVERALL SCORE BANNER */}
        <Card
          className="bg-gradient-to-r from-blue-900 to-slate-900 text-white border-0 shadow-xl"
          action={
            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/20" onClick={handleRecalculate} loading={recalculating} icon={<RefreshCw className="w-4 h-4" />}>
              Recalculate Score
            </Button>
          }
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
            <div>
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Overall Readiness Index</span>
              <h2 className="text-4xl font-extrabold text-white mt-1">{score}%</h2>
              <p className="text-xs text-slate-300 mt-2">
                Status: <span className="font-bold text-white">{readiness?.statusLabel.replace('_', ' ') || 'ACTION NEEDED'}</span>
              </p>
            </div>
            <div className="w-full md:w-64">
              <Progress value={score} color={score >= 80 ? 'emerald' : 'blue'} />
            </div>
          </div>
        </Card>

        {/* DIMENSION BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Readiness Dimension Breakdown" subtitle="Weighted performance indicator breakdown">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Academic Performance (30% Weight)</span>
                  <span className="text-blue-600">{breakdown.academicScore}%</span>
                </div>
                <Progress value={breakdown.academicScore} color="blue" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Verified Skill Inventory (25% Weight)</span>
                  <span className="text-teal-600">{breakdown.skillsScore}%</span>
                </div>
                <Progress value={breakdown.skillsScore} color="teal" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Resume Profile Completeness (20% Weight)</span>
                  <span className="text-emerald-600">{breakdown.resumeScore}%</span>
                </div>
                <Progress value={breakdown.resumeScore} color="emerald" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Practical Experience & Applications (25% Weight)</span>
                  <span className="text-purple-600">{breakdown.practicalScore}%</span>
                </div>
                <Progress value={breakdown.practicalScore} color="rose" />
              </div>
            </div>
          </Card>

          <Card title="Score Key Drivers & Action Recommendations" subtitle="Verified platform factors influencing score">
            <div className="space-y-3">
              {(readiness?.drivers || ['Academic CGPA satisfied', 'Resume uploaded', 'Skill verification recommended']).map((driver, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-800">{driver}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
