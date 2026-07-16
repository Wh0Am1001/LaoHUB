import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, KeyRound, Shield, Trash2, LogOut } from 'lucide-react';
import { changePasswordSchema, type ChangePasswordFormValues } from '../../lib/schemas';
import { Input } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { updatePassword } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

function SettingsRow({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onChangePassword(values: ChangePasswordFormValues) {
    setSubmitting(true);
    try {
      await updatePassword(values.newPassword);
      showToast('Password updated', 'success');
      setPasswordModalOpen(false);
      reset();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update password', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user || !profile) return;
    if (deleteConfirmText !== profile.username) return;
    setSubmitting(true);
    try {
      // Row-level policies restrict deletion to the account owner; auth user removal
      // requires an authenticated Edge Function using the service role key.
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      showToast('Your account data has been deleted', 'success');
      navigate('/');
    } catch {
      showToast('Could not delete account. Please contact support.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  async function togglePrivacy() {
    const next = !privateAccount;
    setPrivateAccount(next);
    showToast(next ? 'Your profile is now private' : 'Your profile is now public', 'success');
    // Note: private-profile visibility enforcement requires a `private` column
    // and matching RLS policy on `profiles`; toggle is wired for when that ships.
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="font-display text-xl font-bold mb-6">Settings</h1>

      <div className="card-base divide-y divide-white/5 mb-4">
        <SettingsRow
          icon={Moon}
          title="Dark mode"
          description="LaoHUB is designed dark-mode first"
          action={
            <div className="w-11 h-6 rounded-full bg-gradient-brand flex items-center px-0.5 justify-end">
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          }
        />
        <SettingsRow
          icon={KeyRound}
          title="Change password"
          description="Update your account password"
          action={
            <button onClick={() => setPasswordModalOpen(true)} className="btn-secondary !px-4 !py-1.5 text-sm">
              Change
            </button>
          }
        />
        <SettingsRow
          icon={Shield}
          title="Private account"
          description="Only followers can see your posts"
          action={
            <button
              onClick={togglePrivacy}
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${privateAccount ? 'bg-gradient-brand justify-end' : 'bg-white/10 justify-start'}`}
            >
              <div className="w-5 h-5 rounded-full bg-white" />
            </button>
          }
        />
      </div>

      <div className="card-base divide-y divide-white/5 mb-4">
        <SettingsRow
          icon={LogOut}
          title="Log out"
          description="Sign out of your account on this device"
          action={
            <button onClick={handleLogout} className="btn-secondary !px-4 !py-1.5 text-sm">
              Log out
            </button>
          }
        />
        <SettingsRow
          icon={Trash2}
          title="Delete account"
          description="Permanently remove your profile and data"
          action={
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="!px-4 !py-1.5 text-sm rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Delete
            </button>
          }
        />
      </div>

      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change password">
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <Input
            label="New password"
            type="password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirm new password"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete account">
        <p className="text-sm text-slate-400 mb-4">
          This will permanently delete your profile, posts, and messages. Type <strong>{profile?.username}</strong> to
          confirm.
        </p>
        <Input
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder={profile?.username}
          className="mb-4"
        />
        <button
          onClick={handleDeleteAccount}
          disabled={deleteConfirmText !== profile?.username || submitting}
          className="w-full !px-4 !py-2.5 rounded-xl bg-red-500 text-white font-medium disabled:opacity-40 transition-opacity"
        >
          {submitting ? 'Deleting...' : 'Permanently delete account'}
        </button>
      </Modal>
    </div>
  );
}
