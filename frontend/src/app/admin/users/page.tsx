'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers(query = '') {
    const url = `/admin/users?${roleFilter ? `role=${roleFilter}&` : ''}search=${encodeURIComponent(query)}`;
    const res = await apiFetch<any[]>(url);
    if (res.success && res.data) setUsers(res.data);
  }

  const handleUpdateRoles = async (userId: string, currentRoles: string[], targetRole: string) => {
    const updatedRoles = currentRoles.includes(targetRole)
      ? currentRoles.filter((r) => r !== targetRole)
      : [...currentRoles, targetRole];

    if (updatedRoles.length === 0) return;

    const res = await apiFetch(`/admin/users/${userId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ roles: updatedRoles }),
    });

    if (res.success) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, roles: updatedRoles } : u)));
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.success) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    }
  };

  return (
    <DashboardLayout title="User Directory & Role Management" subtitle="System-wide RBAC role assignment and user status control.">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search user email or student name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadUsers(e.target.value);
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              className="rounded-lg border border-slate-300 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All User Roles</option>
              <option value="STUDENT">STUDENT</option>
              <option value="TPO">TPO</option>
              <option value="FACULTY">FACULTY</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </Card>

        <Card title="System Users Roster" subtitle="Manage RBAC roles & account status">
          {users.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No users found matching query.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3">Active Roles</th>
                    <th className="p-3">Role Toggle</th>
                    <th className="p-3 text-right">Account Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{u.email}</td>
                      <td className="p-3">
                        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r: string) => (
                            <span key={r} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px] border border-slate-200">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {['STUDENT', 'FACULTY', 'TPO', 'ADMIN'].map((r) => {
                            const isAssigned = u.roles.includes(r);
                            return (
                              <button
                                key={r}
                                onClick={() => handleUpdateRoles(u.id, u.roles, r)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                  isAssigned ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {r}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant={u.status === 'ACTIVE' ? 'ghost' : 'outline'}
                          onClick={() => handleToggleStatus(u.id, u.status)}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
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
