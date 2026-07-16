import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loginSchema, type LoginFormValues } from '../../lib/schemas';
import { Input } from '../../components/ui/FormField';
import { signInWithEmail, signInWithGoogle } from '../../services/authService';
import { useToast } from '../../hooks/useToast';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      await signInWithEmail(values.email, values.password);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/home';
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not sign in', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-sm text-slate-400 mb-8">Log in to continue to your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Link to="/forgot-password" className="text-xs text-primary-400 hover:underline mt-1.5 inline-block">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>

      <button
        onClick={() => signInWithGoogle()}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.67-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09A6.6 6.6 0 015.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.93z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-slate-400 mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
