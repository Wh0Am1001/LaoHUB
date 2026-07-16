import { useCallback, useEffect, useState } from 'react';
import { Plus, Rss } from 'lucide-react';
import { getFeedPosts, toggleLike } from '../services/postService';
import type { PostWithAuthor } from '../types';
import { PostCard } from '../components/post/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CreatePostModal } from '../components/post/CreatePostModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export default function FeedPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      setLoading(true);
      try {
        const { posts: results, hasMore: more } = await getFeedPosts(pageToLoad, user?.id);
        setPosts((prev) => (replace ? results : [...prev, ...results]));
        setHasMore(more);
      } catch {
        showToast('Could not load feed', 'error');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  useEffect(() => {
    loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sentinelRef = useInfiniteScroll(() => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      loadPage(next, false);
    }
  }, hasMore && !loading);

  async function handleToggleLike(post: PostWithAuthor) {
    if (!user) return;
    const wasLiked = post.liked_by_me;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: !wasLiked, like_count: p.like_count + (wasLiked ? -1 : 1) } : p
      )
    );
    try {
      await toggleLike(post.id, user.id, wasLiked, post.user_id);
    } catch {
      showToast('Could not update like', 'error');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, liked_by_me: wasLiked, like_count: p.like_count + (wasLiked ? 1 : -1) } : p
        )
      );
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Feed</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-1.5 !px-4 !py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New post
        </button>
      </div>

      {posts.length === 0 && !loading ? (
        <EmptyState
          icon={Rss}
          title="No posts yet"
          description="Follow creators or share your first post to get started."
        />
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onToggleLike={handleToggleLike} />
          ))}
          {loading && Array.from({ length: 2 }).map((_, i) => <PostCardSkeleton key={`s-${i}`} />)}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      <CreatePostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(post) => setPosts((prev) => [post, ...prev])}
      />
    </div>
  );
}
