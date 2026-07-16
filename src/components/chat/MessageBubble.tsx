import type { Chat } from '../../types';
import { cn } from '../../utils';

export function MessageBubble({ message, isOwn }: { message: Chat; isOwn: boolean }) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
          isOwn ? 'bg-gradient-brand text-white rounded-br-sm' : 'bg-white/10 text-slate-100 rounded-bl-sm'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <p className={cn('text-[10px] mt-1', isOwn ? 'text-white/70' : 'text-slate-500')}>{time}</p>
      </div>
    </div>
  );
}
