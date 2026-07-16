import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-bg text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5">
        <Compass className="w-8 h-8 text-white" />
      </div>
      <h1 className="font-display text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-slate-400 mb-8">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary">
        Go home
      </Link>
    </div>
  );
}
