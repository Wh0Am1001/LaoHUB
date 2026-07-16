import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { getCreators, followCreator, unfollowCreator } from '../services/profileService';
import { supabase } from '../lib/supabase';
import type { CreatorCardData, HomeFilters } from '../types';
import { CreatorCard } from '../components/creator/CreatorCard';
import { FilterBar } from '../components/creator/FilterBar';
import { CreatorCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const DEFAULT_FILTERS: HomeFilters = {
  province: '',
  gender: '',
  minAge: null,
  maxAge: null,
  minHeight: null,
  maxHeight: null,
  minWeight: null,
  maxWeight: null,
  sort: 'newest',
  search: '',
};

export default function HomePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<HomeFilters>({ ...DEFAULT_FILTERS, search: searchParams.get('search') ?? '' });
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput);

  const [creators, setCreators] = useState<CreatorCardData[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilters((f) => ({ ...f, search: debouncedSearch }));
  }, [debouncedSearch]);

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      setLoading(true);
      try {
        const { creators: results, hasMore: more } = await getCreators(filters, pageToLoad);
        setCreators((prev) => (replace ? results : [...prev, ...results]));
        setHasMore(more);
      } catch {
        showToast('Could not load creators', 'error');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters]
  );

  useEffect(() => {
    setPage(0);
    loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .then(({ data }) => setFollowingIds(new Set((data ?? []).map((r) => r.following_id))));
  }, [user]);

  const sentinelRef = useInfiniteScroll(() => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      loadPage(next, false);
    }
  }, hasMore && !loading);

  async function handleToggleFollow(creator: CreatorCardData) {
    if (!user) return;
    const isFollowing = followingIds.has(creator.id);
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(creator.id);
      else next.add(creator.id);
      return next;
    });
    try {
      if (isFollowing) await unfollowCreator(user.id, creator.id);
      else await followCreator(user.id, creator.id);
    } catch {
      showToast('Could not update follow status', 'error');
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(creator.id);
        else next.delete(creator.id);
        return next;
      });
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="sm:hidden">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search creators..."
          className="input-base text-sm"
        />
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {creators.length === 0 && !loading ? (
        <EmptyState icon={Users} title="No creators found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {creators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              isFollowing={followingIds.has(creator.id)}
              onToggleFollow={handleToggleFollow}
            />
          ))}
          {loading && Array.from({ length: 8 }).map((_, i) => <CreatorCardSkeleton key={`s-${i}`} />)}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
