import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { CreatorCardData } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { calculateAge, formatHeightWeight } from '../../utils';

interface CreatorCardProps {
  creator: CreatorCardData;
  onToggleFollow: (creator: CreatorCardData) => void;
  isFollowing: boolean;
}

export function CreatorCard({ creator, onToggleFollow, isFollowing }: CreatorCardProps) {
  const age = calculateAge(creator.birth_date);
  const stats = formatHeightWeight(creator.height, creator.weight);

  return (
    <div className="card-base group overflow-hidden hover:bg-card-hover transition-colors duration-200">
      <Link to={`/profile/${creator.username}`} className="block relative aspect-[3/4] overflow-hidden">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.display_name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
            <span className="font-display text-3xl font-bold text-white/40">{creator.display_name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute top-2 left-2 flex gap-1">
          {creator.verified && <Badge variant="verified" />}
          {creator.premium && <Badge variant="premium" />}
        </div>
        {creator.online && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
            <Badge variant="online" />
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-3">
          <p className="font-display font-semibold text-white truncate">{creator.display_name}</p>
          <div className="flex items-center gap-1 text-xs text-white/70 mt-0.5">
            {creator.province && (
              <>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{creator.province}</span>
              </>
            )}
          </div>
        </div>
      </Link>

      <div className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {age !== null && <span className="stat-chip">{age}y</span>}
          {stats && <span className="stat-chip truncate">{stats}</span>}
        </div>
        <button
          onClick={() => onToggleFollow(creator)}
          className={
            isFollowing ? 'btn-secondary !px-3 !py-1.5 text-xs shrink-0' : 'btn-primary !px-3 !py-1.5 text-xs shrink-0'
          }
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );
}

export function CreatorCardAvatar({
  creator,
}: {
  creator: Pick<CreatorCardData, 'avatar_url' | 'display_name' | 'online'>;
}) {
  return <Avatar src={creator.avatar_url} name={creator.display_name} online={creator.online} ringed />;
}
