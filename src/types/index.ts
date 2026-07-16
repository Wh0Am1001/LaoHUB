export * from './database';

export interface CreatorCardData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  province: string | null;
  height: number | null;
  weight: number | null;
  birth_date: string | null;
  online: boolean;
  verified: boolean;
  premium: boolean;
  is_following?: boolean;
}

export type SortOption = 'newest' | 'popular' | 'online';

export interface HomeFilters {
  province: string;
  gender: string;
  minAge: number | null;
  maxAge: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  sort: SortOption;
  search: string;
}

export interface PostWithAuthor extends Record<string, unknown> {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
  };
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface ConversationPreview {
  partner_id: string;
  partner_username: string;
  partner_display_name: string;
  partner_avatar_url: string | null;
  partner_online: boolean;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
