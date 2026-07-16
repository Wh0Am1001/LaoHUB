import { supabase } from '../lib/supabase';
import type { Chat, ConversationPreview } from '../types';

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const byPartner = new Map<string, Chat[]>();
  for (const msg of data ?? []) {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!byPartner.has(partnerId)) byPartner.set(partnerId, []);
    byPartner.get(partnerId)!.push(msg);
  }

  const partnerIds = Array.from(byPartner.keys());
  if (partnerIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, online')
    .in('id', partnerIds);
  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return partnerIds
    .map((partnerId) => {
      const messages = byPartner.get(partnerId)!;
      const last = messages[0];
      const unread = messages.filter((m) => m.receiver_id === userId && !m.is_read).length;
      const profile = profileMap.get(partnerId);
      if (!profile) return null;
      return {
        partner_id: partnerId,
        partner_username: profile.username,
        partner_display_name: profile.display_name,
        partner_avatar_url: profile.avatar_url,
        partner_online: profile.online,
        last_message: last.message,
        last_message_at: last.created_at,
        unread_count: unread,
      };
    })
    .filter((c): c is ConversationPreview => c !== null)
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
}

export async function getMessages(userId: string, partnerId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(senderId: string, receiverId: string, message: string) {
  const { data, error } = await supabase
    .from('chats')
    .insert({ sender_id: senderId, receiver_id: receiverId, message })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: receiverId,
    type: 'message',
    reference_id: senderId,
    message: 'sent you a message',
  });

  return data;
}

export async function markMessagesAsRead(userId: string, partnerId: string) {
  const { error } = await supabase
    .from('chats')
    .update({ is_read: true })
    .eq('sender_id', partnerId)
    .eq('receiver_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}
