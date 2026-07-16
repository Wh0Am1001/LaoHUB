import { supabase } from '../lib/supabase';
import type { CreatorCardData, HomeFilters, Profile, Gender } from '../types';
import { PAGE_SIZE } from '../constants';
import { calculateAge } from '../utils';

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function isUsernameTaken(username: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from('profiles').select('id').eq('username', username);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function followCreator(followerId: string, followingId: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: followingId,
    type: 'follow',
    reference_id: followerId,
    message: 'started following you',
  });
}

export async function unfollowCreator(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function getFollowCounts(userId: string) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

/**
 * Fetches creator cards for the Home page, applying search/filter/sort.
 * Age/height/weight filters are applied client-side after fetch since birth_date
 * requires computed age; for large datasets this should move to a Postgres function.
 */
export async function getCreators(
  filters: HomeFilters,
  page: number
): Promise<{ creators: CreatorCardData[]; hasMore: boolean }> {
  let query = supabase
    .from('profiles')
    .select(
      'id, username, display_name, avatar_url, province, height, weight, birth_date, online, verified, premium, created_at'
    );

  if (filters.search) {
    query = query.or(`display_name.ilike.%${filters.search}%,username.ilike.%${filters.search}%`);
  }
  if (filters.province) query = query.eq('province', filters.province);
  if (filters.gender) query = query.eq('gender', filters.gender as Gender);
  if (filters.minHeight != null) query = query.gte('height', filters.minHeight);
  if (filters.maxHeight != null) query = query.lte('height', filters.maxHeight);
  if (filters.minWeight != null) query = query.gte('weight', filters.minWeight);
  if (filters.maxWeight != null) query = query.lte('weight', filters.maxWeight);

  if (filters.sort === 'newest') query = query.order('created_at', { ascending: false });
  else if (filters.sort === 'online')
    query = query.order('online', { ascending: false }).order('created_at', { ascending: false });
  else query = query.order('created_at', { ascending: false }); // 'popular' refined client-side by follower count in a real Postgres RPC

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error } = await query;
  if (error) throw error;

  let creators = (data ?? []) as CreatorCardData[];

  if (filters.minAge != null || filters.maxAge != null) {
    creators = creators.filter((c) => {
      const age = calculateAge(c.birth_date);
      if (age === null) return false;
      if (filters.minAge != null && age < filters.minAge) return false;
      if (filters.maxAge != null && age > filters.maxAge) return false;
      return true;
    });
  }

  return { creators, hasMore: (data?.length ?? 0) === PAGE_SIZE };
}
