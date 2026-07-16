import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  BadgeCheck,
  MapPin,
  Briefcase,
  Heart,
  Ruler,
  Weight,
  MessageCircle,
  Share2,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getProfileByUsername,
  followCreator,
  unfollowCreator,
  isFollowing as checkIsFollowing,
  getFollowCounts,
} from '../services/profileService';
import { getUserPosts } from '../services/postService';
import type { Post, Profile } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { ImageViewer } from '../components/ui/ImageViewer';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { calculateAge } from '../utils';
import { RELATIONSHIP_STATUSES } from '../constants';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: myProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const isOwnProfile = myProfile?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getProfileByUsername(username)
      .then(async (data) => {
        setProfile(data);
        if (data) {
          const [userPosts, followCounts, followingStatus] = await Promise.all([
            getUserPosts(data.id),
            getFollowCounts(data.id),
            user ? checkIsFollowing(user.id, data.id) : Promise.resolve(false),
          ]);
          setPosts(userPosts);
          setCounts(followCounts);
          setIsFollowing(followingStatus);
        }
      })
      .catch(() => showToast('Could not load profile', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, user]);

  async function handleToggleFollow() {
    if (!user || !profile) return;
    const next = !isFollowing;
    setIsFollowing(next);
    setCounts((c) => ({ ...c, followers: c.followers + (next ? 1 : -1) }));
    try {
      if (next) await followCreator(user.id, profile.id);
      else await unfollowCreator(user.id, profile.id);
    } catch {
      showToast('Could not update follow status', 'error');
      setIsFollowing(!next);
      setCounts((c) => ({ ...c, followers: c.followers + (next ? -1 : 1) }));
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied', 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="w-full h-48 rounded-2xl" />
        <Skeleton className="w-32 h-32 rounded-full -mt-16 ml-6" />
        <Skeleton className="h-6 w-48" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState icon={ImageIcon} title="Profile not found" description="This creator doesn't exist or was removed." />
    );
  }

  const age = calculateAge(profile.birth_date);
  const relationshipLabel = RELATIONSHIP_STATUSES.find((r) => r.value === profile.relationship_status)?.label;

  return (
    <div className="pb-8">
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-primary-500/30 to-secondary-500/30">
        {profile.cover_url && <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />}
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-4">
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name}
            size="xl"
            ringed
            online={profile.online}
            className="border-4 border-bg rounded-full"
          />
          <div className="flex items-center gap-2 pb-1">
            {isOwnProfile ? (
              <button
                onClick={() => navigate('/profile/edit')}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <Pencil className="w-4 h-4" /> Edit profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={isFollowing ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <Link to={`/chat?to=${profile.id}`} className="btn-secondary !p-2.5">
                  <MessageCircle className="w-4.5 h-4.5" />
                </Link>
                <button onClick={handleShare} className="btn-secondary !p-2.5">
                  <Share2 className="w-4.5 h-4.5" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <h1 className="font-display text-xl font-bold">{profile.display_name}</h1>
          {profile.verified && <BadgeCheck className="w-5 h-5 text-secondary-400" />}
          {profile.premium && <Badge variant="premium" />}
        </div>
        <p className="text-slate-500 text-sm">@{profile.username}</p>

        {profile.bio && <p className="text-slate-300 text-sm mt-3 max-w-lg">{profile.bio}</p>}

        <div className="flex items-center gap-4 mt-4 text-sm">
          <span>
            <strong>{counts.followers}</strong> <span className="text-slate-500">Followers</span>
          </span>
          <span>
            <strong>{counts.following}</strong> <span className="text-slate-500">Following</span>
          </span>
          <span>
            <strong>{posts.length}</strong> <span className="text-slate-500">Posts</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {age !== null && <span className="stat-chip">{age} years</span>}
          {profile.height && (
            <span className="stat-chip flex items-center gap-1">
              <Ruler className="w-3 h-3" /> {profile.height}cm
            </span>
          )}
          {profile.weight && (
            <span className="stat-chip flex items-center gap-1">
              <Weight className="w-3 h-3" /> {profile.weight}kg
            </span>
          )}
          {profile.province && (
            <span className="stat-chip flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {profile.province}
            </span>
          )}
          {profile.occupation && (
            <span className="stat-chip flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> {profile.occupation}
            </span>
          )}
          {relationshipLabel && (
            <span className="stat-chip flex items-center gap-1">
              <Heart className="w-3 h-3" /> {relationshipLabel}
            </span>
          )}
        </div>

        <div className="mt-8">
          <h2 className="font-display font-semibold mb-3">Gallery</h2>
          {posts.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No posts yet"
              description={
                isOwnProfile ? 'Share your first post from the Feed page.' : 'This creator has not posted yet.'
              }
            />
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setViewerSrc(post.image_url)}
                  className="aspect-square rounded-lg overflow-hidden bg-card"
                >
                  <img
                    src={post.image_url}
                    alt={post.caption ?? ''}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
    </div>
  );
}
