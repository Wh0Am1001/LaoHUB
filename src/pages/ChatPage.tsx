import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { getConversations, getMessages, sendMessage, markMessagesAsRead } from '../services/chatService';
import { getProfileById } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { getOrCreateChannel } from '../lib/realtime';
import type { Chat, ConversationPreview } from '../types';
import { ConversationItem } from '../components/chat/ConversationItem';
import { MessageBubble } from '../components/chat/MessageBubble';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { ConversationSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { cn } from '../utils';

export default function ChatPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(searchParams.get('to'));
  const [activePartner, setActivePartner] = useState<ConversationPreview | null>(null);
  const [messages, setMessages] = useState<Chat[]>([]);
  const [messageText, setMessageText] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvos(true);
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch {
      showToast('Could not load conversations', 'error');
    } finally {
      setLoadingConvos(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Resolve a partner passed via ?to= that has no conversation yet
  useEffect(() => {
    const toId = searchParams.get('to');
    if (!toId || !user) return;
    const existing = conversations.find((c) => c.partner_id === toId);
    if (existing) {
      setActivePartner(existing);
      return;
    }
    getProfileById(toId).then((p) => {
      if (p) {
        setActivePartner({
          partner_id: p.id,
          partner_username: p.username,
          partner_display_name: p.display_name,
          partner_avatar_url: p.avatar_url,
          partner_online: p.online,
          last_message: '',
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations, user]);

  useEffect(() => {
    const userId = user?.id;
    if (!activePartnerId || !userId) return;
    getMessages(userId, activePartnerId).then(setMessages);
    markMessagesAsRead(userId, activePartnerId).then(loadConversations);

    const channel = getOrCreateChannel(`chat:${[userId, activePartnerId].sort().join(':')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
        const msg = payload.new as Chat;
        const involvesThisChat =
          (msg.sender_id === userId && msg.receiver_id === activePartnerId) ||
          (msg.sender_id === activePartnerId && msg.receiver_id === user.id);
        if (involvesThisChat) {
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.receiver_id === userId) markMessagesAsRead(userId, activePartnerId).then(loadConversations);
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === activePartnerId) {
          setPartnerTyping(true);
          setTimeout(() => setPartnerTyping(false), 2000);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartnerId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, partnerTyping]);

  function handleTyping() {
    if (!user || !typingChannelRef.current) return;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activePartnerId || !messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      const msg = await sendMessage(user.id, activePartnerId, text);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      loadConversations();
    } catch {
      showToast('Could not send message', 'error');
    }
  }

  function selectConversation(c: ConversationPreview) {
    setActivePartnerId(c.partner_id);
    setActivePartner(c);
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] md:h-[calc(100svh-4rem)]">
      <div
        className={cn(
          'w-full md:w-80 shrink-0 border-r border-white/5 overflow-y-auto p-3',
          activePartnerId && 'hidden md:block'
        )}
      >
        <h1 className="font-display text-lg font-bold px-2 mb-2">Messages</h1>
        {loadingConvos ? (
          Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
        ) : conversations.length === 0 && !activePartner ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Visit a creator's profile and tap message to start chatting."
          />
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => (
              <ConversationItem
                key={c.partner_id}
                conversation={c}
                active={c.partner_id === activePartnerId}
                onClick={() => selectConversation(c)}
              />
            ))}
          </div>
        )}
      </div>

      <div className={cn('flex-1 flex flex-col min-w-0', !activePartnerId && 'hidden md:flex')}>
        {activePartner ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button className="md:hidden" onClick={() => setActivePartnerId(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar
                src={activePartner.partner_avatar_url}
                name={activePartner.partner_display_name}
                size="sm"
                online={activePartner.partner_online}
              />
              <div>
                <p className="font-medium text-sm">{activePartner.partner_display_name}</p>
                <p className="text-xs text-slate-500">{activePartner.partner_online ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} isOwn={m.sender_id === user?.id} />
              ))}
              {partnerTyping && <TypingIndicator />}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-white/5">
              <input
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="input-base flex-1 !py-2.5"
              />
              <button type="submit" disabled={!messageText.trim()} className="btn-primary !p-3 disabled:opacity-40">
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Select a conversation"
            description="Choose a conversation from the list to start chatting."
          />
        )}
      </div>
    </div>
  );
}
