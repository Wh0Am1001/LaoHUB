import { supabase } from '../lib/supabase';
import type { Comment, PostWithAuthor } from '../types';
import { FEED_PAGE_SIZE } from '../constants';

export async function getFeedPosts(
  page: number,
  currentUserId?: string
): Promise<{ posts: PostWithAuthor[]; hasMore: boolean }> {
  const from = page * FEED_PAGE_SIZE;
  const to = from + FEED_PAGE_SIZE - 1;

  const { data: postRows, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const posts = postRows ?? [];
  if (posts.length === 0) return { posts: [], hasMore: false };

  const postIds = posts.map((p) => p.id);
  const authorIds = Array.from(new Set(posts.map((p) => p.user_id)));

  const [{ data: authors }, { data: likeRows }, { data: commentRows }, { data: myLikeRows }] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url, verified').in('id', authorIds),
    supabase.from('likes').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    currentUserId
      ? supabase.from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
  const likeCounts = new Map<string, number>();
  for (const row of likeRows ?? []) likeCounts.set(row.post_id, (likeCounts.get(row.post_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const row of commentRows ?? []) commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
  const likedIds = new Set((myLikeRows ?? []).map((r) => r.post_id));

  const result: PostWithAuthor[] = posts.map((post) => {
    const author = authorMap.get(post.user_id);
    return {
      id: post.id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      author: {
        username: author?.username ?? '',
        display_name: author?.display_name ?? '',
        avatar_url: author?.avatar_url ?? null,
        verified: author?.verified ?? false,
      },
      like_count: likeCounts.get(post.id) ?? 0,
      comment_count: commentCounts.get(post.id) ?? 0,
      liked_by_me: likedIds.has(post.id),
    };
  });

  return { posts: result, hasMore: posts.length === FEED_PAGE_SIZE };
}

export async function getUserPosts(userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPost(userId: string, imageUrl: string, caption: string) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, image_url: imageUrl, caption })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean, postOwnerId: string) {
  if (currentlyLiked) {
    const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
    if (postOwnerId !== userId) {
      await supabase.from('notifications').insert({
        user_id: postOwnerId,
        type: 'like',
        reference_id: postId,
        message: 'liked your post',
      });
    }
  }
}

export async function getComments(
  postId: string
): Promise<(Comment & { author: { username: string; display_name: string; avatar_url: string | null } })[]> {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!comments || comments.length === 0) return [];

  const authorIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', authorIds);
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  return comments.map((c) => {
    const author = authorMap.get(c.user_id);
    return {
      ...c,
      author: {
        username: author?.username ?? '',
        display_name: author?.display_name ?? '',
        avatar_url: author?.avatar_url ?? null,
      },
    };
  });
}

export async function addComment(postId: string, userId: string, comment: string, postOwnerId: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, comment })
    .select()
    .single();
  if (error) throw error;

  if (postOwnerId !== userId) {
    await supabase.from('notifications').insert({
      user_id: postOwnerId,
      type: 'comment',
      reference_id: postId,
      message: 'commented on your post',
    });
  }
  return data;
}
export async function updateComment(
  commentId: string,
  comment: string
) {
  const { data, error } = await supabase
    .from("comments")
    .update({
      comment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}