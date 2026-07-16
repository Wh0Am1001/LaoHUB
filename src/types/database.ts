// Hand-authored types mirroring the Supabase schema (supabase/schema.sql).
// If you regenerate with `supabase gen types typescript`, this file can be replaced.
//
// NOTE: Row/Insert/Update shapes are declared with `type`, not `interface`.
// supabase-js resolves table types via a conditional check against
// `Record<string, unknown>`, and TypeScript only satisfies that check for
// closed object type aliases -- interfaces (which are "open"/extendable)
// fail the check and silently collapse every table to `never`.

export type Gender = 'male' | 'female' | 'other';
export type RelationshipStatus = 'single' | 'in_relationship' | 'married' | 'complicated' | 'prefer_not_to_say';
export type NotificationType = 'like' | 'comment' | 'follow' | 'message';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  gender: Gender | null;
  birth_date: string | null;
  height: number | null;
  weight: number | null;
  province: string | null;
  district: string | null;
  occupation: string | null;
  relationship_status: RelationshipStatus | null;
  verified: boolean;
  online: boolean;
  premium: boolean;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  created_at: string;
};

export type Like = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Chat = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

// Helper to build a Row/Insert/Update/Relationships table shape with sane
// defaults: Insert makes everything but the given required keys optional,
// Update makes everything optional.
type TableOf<Row, RequiredInsertKeys extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsertKeys>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableOf<Profile, 'id' | 'username' | 'display_name'>;
      posts: TableOf<Post, 'user_id' | 'image_url'>;
      comments: TableOf<Comment, 'post_id' | 'user_id' | 'comment'>;
      likes: TableOf<Like, 'post_id' | 'user_id'>;
      follows: TableOf<Follow, 'follower_id' | 'following_id'>;
      chats: TableOf<Chat, 'sender_id' | 'receiver_id' | 'message'>;
      notifications: TableOf<Notification, 'user_id' | 'type' | 'message'>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
