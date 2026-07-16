import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';
import { NotificationItem } from '../components/notification/NotificationItem';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

import { getOrCreateChannel } from '../lib/realtime';

export default function NotificationsPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getNotifications(userId)
      .then(setNotifications)
      .catch(() => showToast('Could not load notifications', 'error'))
      .finally(() => setLoading(false));

    const channel = getOrCreateChannel(`notif-feed:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // non-critical, ignore
    }
  }

  async function handleMarkAll() {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(user.id);
    } catch {
      showToast('Could not mark all as read', 'error');
    }
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-bold">Notifications</h1>
        {hasUnread && (
          <button onClick={handleMarkAll} className="text-sm text-primary-400 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="New likes, comments, follows, and messages will show up here."
        />
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={handleRead} />
          ))}
        </div>
      )}
    </div>
  );
}
