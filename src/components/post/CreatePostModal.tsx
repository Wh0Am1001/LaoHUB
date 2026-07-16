import { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/FormField';
import { uploadImage } from '../../services/storageService';
import { createPost } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { STORAGE_BUCKETS } from '../../constants';
import type { PostWithAuthor } from '../../types';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: PostWithAuthor) => void;
}

export function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setCaption('');
  }

  async function handleSubmit() {
    if (!user || !profile || !file) return;
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(STORAGE_BUCKETS.posts, user.id, file);
      const post = await createPost(user.id, imageUrl, caption.trim());
      onCreated({
        ...post,
        author: {
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          verified: profile.verified,
        },
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      });
      showToast('Post shared', 'success');
      reset();
      onClose();
    } catch {
      showToast('Could not create post', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create post"
    >
      <div className="space-y-4">
        <label className="block aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-primary-500/50 cursor-pointer overflow-hidden bg-white/5 flex items-center justify-center transition-colors">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-400">
              <ImagePlus className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Click to upload an image</p>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>

        <TextArea
          placeholder="Write a caption..."
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
        />

        <button onClick={handleSubmit} disabled={!file || submitting} className="btn-primary w-full">
          {submitting ? 'Sharing...' : 'Share post'}
        </button>
      </div>
    </Modal>
  );
}
