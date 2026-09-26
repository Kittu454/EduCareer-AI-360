'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs(query = '') {
    const res = await apiFetch<any[]>(`/admin/audit-logs?search=${encodeURIComponent(query)}`);
    if (res.success && res.data) setLogs(res.data);
  }

  return (
    <DashboardLayout title="Immutable System Audit Trail" subtitle="Audited security event logs and system table mutations.">
      <div className="space-y-6">
        <Card>
          <Input
            placeholder="Search action type, actor email, or target table..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              loadAuditLogs(e.target.value);
            }}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        <Card title="Audit Event Log" subtitle="Security & mutation records">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No audit log records recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Target Table</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-3 font-medium text-slate-900">{log.actor?.email || 'SYSTEM'}</td>
                      <td className="p-3">
                        <Badge variant="info">{log.actionType}</Badge>
                      </td>
                      <td className="p-3 font-mono text-slate-700">{log.tableName}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                        {JSON.stringify(log.newValues || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
