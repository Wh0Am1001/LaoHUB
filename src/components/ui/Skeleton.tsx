import { cn } from '../../utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-white/[0.06] rounded-lg', className)} />;
}

export function CreatorCardSkeleton() {
  return (
    <div className="card-base p-3 space-y-3">
      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="w-full aspect-square rounded-xl" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
