'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Database, Cpu, Server, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

export default function AdminSystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  async function loadHealth() {
    setRefreshing(true);
    const res = await apiFetch<any>('/admin/system/health');
    setRefreshing(false);
    if (res.success && res.data) setHealth(res.data);
  }

  return (
    <DashboardLayout
      title="System Health & Infrastructure Monitor"
      subtitle="Operational liveness of Backend, PostgreSQL, and FastAPI ML Dependency Services."
      action={
        <Button size="sm" variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={loadHealth} loading={refreshing}>
          Refresh Health Check
        </Button>
      }
    >
      <div className="space-y-6">
        <Card title="Operational Service Status" subtitle="Monitored subsystem components">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Node Express Gateway</p>
                  <p className="text-[11px] text-slate-500">Public REST API (/api/v1)</p>
                </div>
              </div>
              <Badge variant="success">HEALTHY</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-teal-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">PostgreSQL Database</p>
                  <p className="text-[11px] text-slate-500">Prisma ORM engine</p>
                </div>
              </div>
              <Badge variant={health?.services?.database === 'HEALTHY' ? 'success' : 'danger'}>
                {health?.services?.database || 'HEALTHY'}
              </Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">FastAPI ML Service</p>
                  <p className="text-[11px] text-slate-500">Internal ML REST (/ml/v1)</p>
                </div>
              </div>
              <Badge variant={health?.services?.mlService === 'HEALTHY' ? 'success' : 'warning'}>
                {health?.services?.mlService || 'HEALTHY'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
