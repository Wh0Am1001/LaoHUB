import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addComment, getComments,updateComment,deleteComment } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../utils';
import type { Comment } from '../../types';
import { Pencil, Trash2, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

interface CommentBoxProps {
  postId: string;
  postOwnerId: string;
}

type CommentWithAuthor = Comment & { author: { username: string; display_name: string; avatar_url: string | null } };

const COMMENT_PREVIEW_LENGTH = 100;

export function CommentBox({ postId, postOwnerId }: CommentBoxProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    getComments(postId)
      .then(setComments)
      .catch(() => showToast('Could not load comments', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !text.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(postId, user.id, text.trim(), postOwnerId);
      setComments((prev) => [
        ...prev,
        {
          ...newComment,
          author: { username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url },
        },
      ]);
      setText('');
    } catch {
      showToast('Could not post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-white/5 pt-3 space-y-3">
      {loading ? (
  <p className="text-xs text-slate-500">Loading comments...</p>
) : comments.length === 0 ? (
  <p className="text-xs text-slate-500">
    No comments yet. Be the first to say something.
  </p>
) : (
  <div className="space-y-2.5 max-h-64 overflow-y-auto">
    {comments.map((c) => (
        <div key={c.id} className="flex justify-between gap-2">
        <div className="flex min-w-0 flex-1 gap-2">
          <Link to={`/profile/${c.author.username}`}>
            <Avatar
              src={c.author.avatar_url}
              name={c.author.display_name}
              size="sm"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="max-w-full text-sm">
              <Link
                to={`/profile/${c.author.username}`}
                className="font-medium mr-1.5"
              >
                {c.author.username}
              </Link>

              {editingId === c.id ? (
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="input-base mt-1 w-full"
                />
              ) : (() => {
                const isLongComment = c.comment.length > COMMENT_PREVIEW_LENGTH;
                const isExpanded = expandedCommentIds.has(c.id);
                const displayedComment =
                  isLongComment && !isExpanded
                    ? `${c.comment.slice(0, COMMENT_PREVIEW_LENGTH)}...`
                    : c.comment;

                return (
                  <>
                    <span className="mt-0.5 block max-w-full whitespace-pre-wrap break-all text-slate-300">
                      {displayedComment}
                    </span>
                    {isLongComment && (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedCommentIds((previous) => {
                            const next = new Set(previous);

                            if (isExpanded) next.delete(c.id);
                            else next.add(c.id);

                            return next;
                          });
                        }}
                        className="mt-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </>
                );
              })()}
            </p>

            <p className="text-[11px] text-slate-500">
              {formatRelativeTime(c.created_at)}

              {c.updated_at &&
                c.updated_at !== c.created_at &&
                " • Edited"}
            </p>

            {editingId === c.id && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs"
                >
                  Cancel
                </button>

                <button
                  className="text-xs text-blue-500"
                  onClick={async () => {
                    const updated = await updateComment(
                      c.id,
                      editingText
                    );

                    setComments((prev) =>
                      prev.map((item) =>
                        item.id === c.id
                          ? {
                              ...item,
                              comment: updated.comment,
                              updated_at: updated.updated_at,
                            }
                          : item
                      )
                    );

                    setEditingId(null);
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {user?.id === c.user_id && editingId !== c.id && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditingId(c.id);
                setEditingText(c.comment);
              }}
              aria-label="Edit comment"
              title="Edit comment"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this comment?")) return;

                await deleteComment(c.id);

                setComments((prev) =>
                  prev.filter((item) => item.id !== c.id)
                );
              }}
              aria-label="Delete comment"
              title="Delete comment"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
)}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
            <input
                value={text}
                onChange={(e)=>setText(e.target.value)}
                className="input-base !py-2 text-sm w-full pr-10"
                placeholder="Add a comment..."
                maxLength={500}
            />

            <button
                type="button"
                onClick={()=>setShowEmoji(!showEmoji)}
                className="absolute right-2 top-2"
            >
                <Smile className="w-5 h-5"/>
            </button>

            {showEmoji && (
                <div className="absolute bottom-12 right-0 z-50">
                    <EmojiPicker
                        onEmojiClick={(emoji)=>
                            setText(prev=>prev+emoji.emoji)
                        }
                    />
                </div>
            )}
        </div>
        <button type="submit" disabled={submitting || !text.trim()} className="btn-primary !p-2.5 disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
