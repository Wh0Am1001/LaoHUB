import { getInitials } from '../../utils';
import { cn } from '../../utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  ringed?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-28 h-28 text-2xl',
};

const dotSizeMap = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
};

export function Avatar({ src, name, size = 'md', online, ringed, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          sizeMap[size],
          ringed && 'p-[2px] bg-gradient-brand rounded-full',
          'rounded-full overflow-hidden'
        )}
      >
        <div className={cn('w-full h-full rounded-full overflow-hidden bg-card flex items-center justify-center')}>
          {src ? (
            <img src={src} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="font-display font-semibold text-slate-300">{getInitials(name)}</span>
          )}
        </div>
      </div>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-bg',
            dotSizeMap[size],
            online ? 'bg-emerald-400 animate-pulseDot' : 'bg-slate-600'
          )}
        />
      )}
    </div>
  );
}
