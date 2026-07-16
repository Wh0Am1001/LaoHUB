import { NavLink } from 'react-router-dom';
import { Home, Rss, MessageCircle, Bell, Settings, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';
import { cn } from '../../utils';

export function Sidebar() {
  const { profile } = useAuth();
  const { unreadNotifications, unreadMessages } = useUnreadCounts();

  const links = [
    { to: '/home', icon: Home, label: 'Discover' },
    { to: '/feed', icon: Rss, label: 'Feed' },
    { to: '/chat', icon: MessageCircle, label: 'Messages', badge: unreadMessages },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
    { to: `/profile/${profile?.username ?? ''}`, icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/5 h-[calc(100svh-4rem)] sticky top-16 p-4 gap-1">
      {links.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors relative',
              isActive ? 'bg-gradient-brand text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            )
          }
        >
          <Icon className="w-5 h-5" />
          {label}
          {!!badge && (
            <span className="ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </NavLink>
      ))}
    </aside>
  );
}
