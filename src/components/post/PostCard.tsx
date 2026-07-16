import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, BadgeCheck } from 'lucide-react';
import type { PostWithAuthor } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime, cn } from '../../utils';
import { CommentBox } from './CommentBox';
import { ImageViewer } from '../ui/ImageViewer';
import { useToast } from '../../hooks/useToast';

interface PostCardProps {
  post: PostWithAuthor;
  onToggleLike: (post: PostWithAuthor) => void;
}

export function PostCard({ post, onToggleLike }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleShare() {
    const url = `${window.location.origin}/profile/${post.author.username}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard', 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
  }

  return (
    <article className="card-base overflow-hidden animate-fadeIn">
      <div className="flex items-center gap-3 p-4">
        <Link to={`/profile/${post.author.username}`}>
          <Avatar src={post.author.avatar_url} name={post.author.display_name} size="sm" ringed />
        </Link>
        <div className="min-w-0">
          <Link
            to={`/profile/${post.author.username}`}
            className="flex items-center gap-1 font-medium text-sm hover:underline"
          >
            <span className="truncate">{post.author.display_name}</span>
            {post.author.verified && <BadgeCheck className="w-3.5 h-3.5 text-secondary-400 shrink-0" />}
          </Link>
          <p className="text-xs text-slate-500">{formatRelativeTime(post.created_at)}</p>
        </div>
      </div>

      <button className="block w-full aspect-square bg-black/20" onClick={() => setViewerSrc(post.image_url)}>
        <img
          src={post.image_url}
          alt={post.caption ?? 'Post image'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </button>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-5">
          <button onClick={() => onToggleLike(post)} className="flex items-center gap-1.5 group">
            <Heart
              className={cn(
                'w-5.5 h-5.5 transition-colors',
                post.liked_by_me ? 'fill-primary-500 text-primary-500' : 'text-slate-400 group-hover:text-primary-400'
              )}
            />
            <span className="text-sm text-slate-300">{post.like_count}</span>
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-secondary-400"
          >
            <MessageCircle className="w-5.5 h-5.5" />
            <span className="text-sm text-slate-300">{post.comment_count}</span>
          </button>
          <button onClick={handleShare} className="ml-auto text-slate-400 hover:text-slate-200">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {post.caption && (
          <p className="text-sm text-slate-200">
            <Link to={`/profile/${post.author.username}`} className="font-medium mr-1.5">
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        )}

        {showComments && <CommentBox postId={post.id} postOwnerId={post.user_id} />}
      </div>

      <ImageViewer src={viewerSrc} alt={post.caption ?? ''} onClose={() => setViewerSrc(null)} />
    </article>
  );
}
