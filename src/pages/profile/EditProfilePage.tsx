import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { editProfileSchema, type EditProfileFormValues } from '../../lib/schemas';
import type { Gender, RelationshipStatus } from '../../types';
import { Input, Select, TextArea } from '../../components/ui/FormField';
import { Avatar } from '../../components/ui/Avatar';
import { updateProfile } from '../../services/profileService';
import { uploadImage } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { STORAGE_BUCKETS, PROVINCES, GENDERS, RELATIONSHIP_STATUSES } from '../../constants';

export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
      birth_date: profile?.birth_date ?? '',
      height: profile?.height != null ? String(profile.height) : '',
      weight: profile?.weight != null ? String(profile.weight) : '',
      province: profile?.province ?? '',
      occupation: profile?.occupation ?? '',
      relationship_status: profile?.relationship_status ?? '',
      gender: profile?.gender ?? '',
    },
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(STORAGE_BUCKETS.avatars, user.id, file);
      setAvatarUrl(url);
    } catch {
      showToast('Could not upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(STORAGE_BUCKETS.covers, user.id, file);
      setCoverUrl(url);
    } catch {
      showToast('Could not upload cover', 'error');
    } finally {
      setUploadingCover(false);
    }
  }

  async function onSubmit(values: EditProfileFormValues) {
    if (!user) return;
    setSubmitting(true);
    try {
      await updateProfile(user.id, {
        ...values,
        height: values.height ? Number(values.height) : null,
        weight: values.weight ? Number(values.weight) : null,
        birth_date: values.birth_date || null,
        province: values.province || null,
        occupation: values.occupation || null,
        relationship_status: (values.relationship_status || null) as RelationshipStatus | null,
        gender: (values.gender || null) as Gender | null,
        bio: values.bio || null,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      });
      await refreshProfile();
      showToast('Profile updated', 'success');
      navigate(`/profile/${profile?.username}`);
    } catch {
      showToast('Could not update profile', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="font-display text-xl font-bold mb-6">Edit profile</h1>

      <div className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500/30 to-secondary-500/30 mb-4">
        {coverUrl && <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
        >
          <span className="flex items-center gap-2 text-sm text-white btn-secondary !bg-black/40">
            <Camera className="w-4 h-4" /> {uploadingCover ? 'Uploading...' : 'Change cover'}
          </span>
        </button>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </div>

      <div className="flex items-center gap-4 mb-8 -mt-14 ml-2">
        <div className="relative">
          <Avatar
            src={avatarUrl}
            name={profile?.display_name ?? '?'}
            size="xl"
            ringed
            className="border-4 border-bg rounded-full"
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center border-2 border-bg"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        {uploadingAvatar && <span className="text-xs text-slate-400">Uploading...</span>}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Display name" error={errors.display_name?.message} {...register('display_name')} />
        <TextArea label="Bio" rows={3} maxLength={300} error={errors.bio?.message} {...register('bio')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Birth date" type="date" error={errors.birth_date?.message} {...register('birth_date')} />
          <Select
            label="Gender"
            placeholder="Select gender"
            options={GENDERS}
            error={errors.gender?.message}
            {...register('gender')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Height (cm)" type="number" error={errors.height?.message} {...register('height')} />
          <Input label="Weight (kg)" type="number" error={errors.weight?.message} {...register('weight')} />
        </div>
        <Select
          label="Province"
          placeholder="Select province"
          options={PROVINCES.map((p) => ({ value: p, label: p }))}
          error={errors.province?.message}
          {...register('province')}
        />
        <Input label="Occupation" error={errors.occupation?.message} {...register('occupation')} />
        <Select
          label="Relationship status"
          placeholder="Select status"
          options={RELATIONSHIP_STATUSES}
          error={errors.relationship_status?.message}
          {...register('relationship_status')}
        />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
