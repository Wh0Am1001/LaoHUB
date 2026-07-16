import { NavLink } from 'react-router-dom';
import { Home, Rss, MessageCircle, Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';
import { cn } from '../../utils';

export function BottomNav() {
  const { profile } = useAuth();
  const { unreadNotifications, unreadMessages } = useUnreadCounts();

  const links = [
    { to: '/home', icon: Home, label: 'Discover' },
    { to: '/feed', icon: Rss, label: 'Feed' },
    { to: '/chat', icon: MessageCircle, label: 'Chat', badge: unreadMessages },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: unreadNotifications },
    { to: `/profile/${profile?.username ?? ''}`, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs',
                isActive ? 'text-primary-400' : 'text-slate-500'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
            {!!badge && (
              <span className="absolute top-1.5 right-1/2 translate-x-3 min-w-[1rem] h-4 px-1 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
