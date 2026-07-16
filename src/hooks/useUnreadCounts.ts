import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getUnreadNotificationCount } from '../services/notificationService';
import { getOrCreateChannel } from '../lib/realtime';

export function useUnreadCounts() {
  const { user } = useAuth();
  const userId = user?.id;
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getUnreadNotificationCount(userId)
      .then((count) => !cancelled && setUnreadNotifications(count))
      .catch(() => {});

    supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .then(({ count }) => !cancelled && setUnreadMessages(count ?? 0));

    const notifChannel = getOrCreateChannel(`notifications:${userId}`);
    notifChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => getUnreadNotificationCount(userId).then((count) => !cancelled && setUnreadNotifications(count))
      )
      .subscribe();

    const chatChannel = getOrCreateChannel(`unread-chats:${userId}`);
    chatChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats', filter: `receiver_id=eq.${userId}` },
        () => {
          supabase
            .from('chats')
            .select('id', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false)
            .then(({ count }) => !cancelled && setUnreadMessages(count ?? 0));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [userId]);

  return { unreadNotifications, unreadMessages };
}
