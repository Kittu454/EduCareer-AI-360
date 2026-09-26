'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ShieldCheck, Activity, Building2, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

export default function AdminDashboard() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    apiFetch<any>('/admin/system/health').then((res) => {
      if (res.success && res.data) setHealth(res.data);
    });
  }, []);

  return (
    <DashboardLayout title="Admin System Overview" subtitle="System administration, role management, audit trail, and health metrics.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-l-4 border-l-blue-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Status</p>
            <div className="mt-1">
              <Badge variant={health?.status === 'HEALTHY' ? 'success' : 'warning'}>
                {health?.status || 'HEALTHY'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Services operational</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-teal-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Database Engine</p>
            <p className="text-xl font-bold text-teal-600 mt-1">{health?.services?.database || 'HEALTHY'}</p>
            <p className="text-[11px] text-slate-400 mt-1">PostgreSQL Prisma ORM</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ML Service</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{health?.services?.mlService || 'HEALTHY'}</p>
            <p className="text-[11px] text-slate-400 mt-1">Python FastAPI ML Service</p>
          </Card>

          <Card className="bg-white border-l-4 border-l-indigo-600">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">API Namespace</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">REST /api/v1</p>
            <p className="text-[11px] text-slate-400 mt-1">Node.js Express Gateway</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="User Directory & Roles" subtitle="Role-based access control">
            <p className="text-xs text-slate-600 mb-4">
              Manage accounts, assign STUDENT, FACULTY, TPO, and ADMIN roles.
            </p>
            <Link href="/admin/users">
              <Button size="sm" variant="outline" className="w-full">User Directory</Button>
            </Link>
          </Card>

          <Card title="Audit Trail" subtitle="System immutable event logs">
            <p className="text-xs text-slate-600 mb-4">
              Inspect user actions, role changes, and database mutation events.
            </p>
            <Link href="/admin/audit-logs">
              <Button size="sm" variant="outline" className="w-full">View Audit Logs</Button>
            </Link>
          </Card>

          <Card title="System Health" subtitle="Service monitor">
            <p className="text-xs text-slate-600 mb-4">
              Monitor liveness of Backend, Database, and Python ML dependency services.
            </p>
            <Link href="/admin/system">
              <Button size="sm" variant="outline" className="w-full">System Health</Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
