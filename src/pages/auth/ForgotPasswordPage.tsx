import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../lib/schemas';
import { Input } from '../../components/ui/FormField';
import { sendPasswordReset } from '../../services/authService';
import { useToast } from '../../hooks/useToast';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitting(true);
    try {
      await sendPasswordReset(values.email);
      setSent(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send reset email', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display text-xl font-bold mb-2">Check your email</h1>
        <p className="text-sm text-slate-400 mb-8">We've sent a password reset link to your inbox.</p>
        <Link to="/login" className="btn-secondary inline-flex">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="font-display text-2xl font-bold mb-1">Reset your password</h1>
      <p className="text-sm text-slate-400 mb-8">Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-8">
        Remembered it?{' '}
        <Link to="/login" className="text-primary-400 hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
