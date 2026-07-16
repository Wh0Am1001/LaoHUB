import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerSchema, type RegisterFormValues } from '../../lib/schemas';
import { Input } from '../../components/ui/FormField';
import { signUpWithEmail } from '../../services/authService';
import { isUsernameTaken } from '../../services/profileService';
import { useToast } from '../../hooks/useToast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setSubmitting(true);
    try {
      const taken = await isUsernameTaken(values.username);
      if (taken) {
        setError('username', { message: 'This username is already taken' });
        setSubmitting(false);
        return;
      }
      await signUpWithEmail(values.email, values.password, values.username, values.displayName);
      showToast('Account created! Check your email to confirm, then log in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create account', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
      <p className="text-sm text-slate-400 mb-8">Join {`LaoHUB`} and start building your profile.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Display name"
          placeholder="Jane Doe"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <Input label="Username" placeholder="janedoe" error={errors.username?.message} {...register('username')} />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
