import { supabase } from './supabase';

export async function signUpWithEmail(
  email,
  password
) {
  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          window.location.origin,
      },
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail(
  email,
  password
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function sendPasswordResetEmail(
  email
) {
  const { data, error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      }
    );

  if (error) {
    throw error;
  }

  return data;
}

export async function verifyCurrentPassword(
  email,
  currentPassword
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePassword(
  newPassword
) {
  const { data, error } =
    await supabase.auth.updateUser({
      password: newPassword,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}