import { BadgeCheck, Crown, Circle } from 'lucide-react';
import { cn } from '../../utils';

type BadgeVariant = 'verified' | 'premium' | 'online' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  if (variant === 'verified') {
    return (
      <span
        title="Verified creator"
        className={cn(
          'inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary-500 text-white',
          className
        )}
      >
        <BadgeCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (variant === 'premium') {
    return (
      <span
        title="Premium member"
        className={cn(
          'inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-brand text-white',
          className
        )}
      >
        <Crown className="w-3 h-3" strokeWidth={2.5} />
      </span>
    );
  }
  if (variant === 'online') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-emerald-400 font-medium', className)}>
        <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
        Online
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300', className)}
    >
      {children}
    </span>
  );
}
