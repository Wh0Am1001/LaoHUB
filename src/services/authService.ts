import { supabase } from '../lib/supabase';

export async function signUpWithEmail(email: string, password: string, username: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: displayName } },
  });
  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      display_name: displayName,
    });
    if (profileError) throw profileError;
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/home` },
  });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
