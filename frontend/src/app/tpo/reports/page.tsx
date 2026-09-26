'use client';

import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Plus, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

export default function TpoReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const res = await apiFetch<any[]>('/reports');
    if (res.success && res.data) setReports(res.data);
  }

  const handleGenerateReport = async (type: string) => {
    setGenerating(true);
    const res = await apiFetch<any>('/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: `${type.replace('_', ' ')} Report`,
        reportType: type,
        format: 'CSV',
      }),
    });
    setGenerating(false);
    if (res.success && res.data) {
      setReports([res.data, ...reports]);
    }
  };

  const handleExportCsv = async () => {
    const res = await apiFetch<any[]>('/reports/tpo/placement-data');
    if (res.success && res.data) {
      const keys = Object.keys(res.data[0] || {});
      const csvContent = [
        keys.join(','),
        ...res.data.map((row) => keys.map((k) => `"${row[k] || ''}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placement_report_${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <DashboardLayout
      title="Placement Reports & CSV Data Export"
      subtitle="Generate audit reports and download placement raw datasets."
      action={
        <Button size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportCsv}>
          Export Placement CSV
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Quick Report Generators" subtitle="Generate standardized reports">
            <div className="space-y-3">
              {[
                { type: 'PLACEMENT_SUMMARY', title: 'Placement Summary Report', desc: 'Overall student placements, company breakdown, and salary packages.' },
                { type: 'STUDENT_READINESS', title: 'Student Readiness Audit', desc: 'Readiness scores, skill coverage, and academic CGPA metrics.' },
                { type: 'APPLICATION_PIPELINE', title: 'Recruitment Pipeline Report', desc: 'Detailed list of candidate application statuses across drives.' },
              ].map((item) => (
                <div key={item.type} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleGenerateReport(item.type)} loading={generating}>
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Generated Reports History" subtitle="Archive of system generated reports">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No reports generated yet.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-subtle">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.title}</p>
                      <p className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleString()} • Format: {r.format}</p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
