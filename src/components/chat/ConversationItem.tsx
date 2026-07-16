import type { ConversationPreview } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime, cn } from '../../utils';

interface ConversationItemProps {
  conversation: ConversationPreview;
  active: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, active, onClick }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
        active ? 'bg-white/10' : 'hover:bg-white/5'
      )}
    >
      <Avatar
        src={conversation.partner_avatar_url}
        name={conversation.partner_display_name}
        size="lg"
        online={conversation.partner_online}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{conversation.partner_display_name}</p>
          <span className="text-[11px] text-slate-500 shrink-0">
            {formatRelativeTime(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-xs truncate',
              conversation.unread_count > 0 ? 'text-slate-100 font-medium' : 'text-slate-500'
            )}
          >
            {conversation.last_message}
          </p>
          {conversation.unread_count > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center shrink-0">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
