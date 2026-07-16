import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { APP_NAME } from '../../constants';
import { useState } from 'react';

export function Navbar() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/home?search=${encodeURIComponent(search)}`);
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-16">
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:block">{APP_NAME}</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators..."
              className="input-base pl-10 py-2 text-sm"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Link to={`/profile/${profile?.username ?? ''}`}>
            <Avatar src={profile?.avatar_url} name={profile?.display_name ?? '?'} size="sm" ringed />
          </Link>
        </div>
      </div>
    </header>
  );
}
