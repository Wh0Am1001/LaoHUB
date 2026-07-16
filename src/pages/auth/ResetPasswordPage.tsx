import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../lib/schemas';
import { Input } from '../../components/ui/FormField';
import { updatePassword } from '../../services/authService';
import { useToast } from '../../hooks/useToast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    setSubmitting(true);
    try {
      await updatePassword(values.password);
      showToast('Password updated. Please log in again.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update password', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="font-display text-2xl font-bold mb-1">Set a new password</h1>
      <p className="text-sm text-slate-400 mb-8">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
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
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
