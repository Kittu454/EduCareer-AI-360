'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, CheckCheck } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { NotificationItem } from '../../../types';

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const res = await apiFetch<NotificationItem[]>('/notifications');
    if (res.success && res.data) setNotifications(res.data);
    setLoading(false);
  }

  const handleMarkRead = async (id: string) => {
    const res = await apiFetch(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead: true }),
    });
    if (res.success) {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    }
  };

  const handleMarkAllRead = async () => {
    const res = await apiFetch('/notifications/read-all', { method: 'POST' });
    if (res.success) {
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <DashboardLayout title="Notification Inbox" subtitle="Alerts on application updates, placement drives, and readiness alerts.">
      <div className="space-y-6">
        <Card
          title="System Notifications"
          subtitle="Real-time alerts"
          action={
            <Button size="sm" variant="ghost" icon={<CheckCheck className="w-4 h-4" />} onClick={handleMarkAllRead}>
              Mark All as Read
            </Button>
          }
        >
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Your notification inbox is clean!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-colors flex items-start justify-between ${
                    n.isRead ? 'bg-white border-slate-200' : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{n.title}</p>
                      {!n.isRead && <Badge variant="info">New</Badge>}
                    </div>
                    <p className="text-xs text-slate-600">{n.content}</p>
                    <p className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>

                  {!n.isRead && (
                    <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}>
                      Mark Read
                    </Button>
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
