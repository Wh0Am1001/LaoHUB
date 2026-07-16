import { Link, Navigate } from 'react-router-dom';
import { Sparkles, Users, ImageIcon, MessageCircle, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '../constants';
import { useAuth } from '../hooks/useAuth';

const FEATURES = [
  {
    icon: Users,
    title: 'Build your following',
    desc: 'Create a rich creator profile and grow a community that follows your journey.',
  },
  {
    icon: ImageIcon,
    title: 'Share your world',
    desc: 'Post photos to your gallery and feed with an Instagram-style experience.',
  },
  {
    icon: MessageCircle,
    title: 'Real-time chat',
    desc: 'Message your followers instantly with live typing indicators and read receipts.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified & safe',
    desc: 'Verification badges and privacy controls keep the community trustworthy.',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-bg">
        <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-svh bg-bg text-slate-100">
      <header className="max-w-7xl mx-auto flex items-center justify-between px-6 h-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary !px-5">
            Log in
          </Link>
          <Link to="/register" className="btn-primary !px-5 hidden sm:inline-flex">
            Sign up
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <span className="stat-chip mb-6 inline-block">a social platform for creators</span>
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-brand bg-clip-text text-transparent">
          Where creators and communities meet
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
          Build a standout profile, share your photos, follow the creators you love, and chat in real time — all in one
          place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="btn-primary !px-8 !py-3 text-base">
            Get started free
          </Link>
          <Link to="/login" className="btn-secondary !px-8 !py-3 text-base">
            I have an account
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card-base p-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-brand flex items-center justify-center mb-4">
              <Icon className="w-5.5 h-5.5 text-white" />
            </div>
            <h3 className="font-display font-semibold mb-2">{title}</h3>
            <p className="text-sm text-slate-400">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
