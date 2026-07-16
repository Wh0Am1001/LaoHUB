import { supabase } from '../lib/supabase';
import { STORAGE_BUCKETS } from '../constants';

type BucketName = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export async function uploadImage(bucket: BucketName, userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
