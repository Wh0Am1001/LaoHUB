import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { APP_NAME } from '../constants';

export function AuthLayout() {
  return (
    <div className="min-h-svh flex bg-bg">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-brand p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <Link to="/" className="relative flex items-center gap-2 z-10">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">{APP_NAME}</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-3xl font-bold text-white leading-tight mb-3">
            Where creators and communities meet.
          </h2>
          <p className="text-white/80">
            Build your profile, share your world, and connect with people who follow your journey.
          </p>
        </div>
        <div />
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
