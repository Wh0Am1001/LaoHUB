import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Mail } from 'lucide-react';
import type { Notification } from '../../types';
import { formatRelativeTime, cn } from '../../utils';

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: Mail,
};

const colorMap = {
  like: 'text-primary-400 bg-primary-500/10',
  comment: 'text-secondary-400 bg-secondary-500/10',
  follow: 'text-emerald-400 bg-emerald-500/10',
  message: 'text-sky-400 bg-sky-500/10',
};

const linkMap: Record<Notification['type'], () => string> = {
  like: () => '/feed',
  comment: () => '/feed',
  follow: () => `/chat`,
  message: () => '/chat',
};

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const Icon = iconMap[notification.type];

  return (
    <Link
      to={linkMap[notification.type]()}
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl transition-colors hover:bg-white/5',
        !notification.is_read && 'bg-white/[0.04]'
      )}
    >
      <div
        className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', colorMap[notification.type])}
      >
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-200">{notification.message}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(notification.created_at)}</p>
      </div>
      {!notification.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />}
    </Link>
  );
}
