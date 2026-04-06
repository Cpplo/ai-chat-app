import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  avatarUrl: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
}

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Reader",
    emailVerified: Boolean(user.email_confirmed_at),
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };
}

export async function signup(payload: SignupPayload) {
  const { error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.name,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return {
    message: "Account created. Check your email and confirm your address before signing in.",
  };
}

export async function login(payload: LoginPayload) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("No user returned from Supabase.");
  }

  return { user: mapUser(data.user) };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }

  return { message: "Logged out" };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    return null;
  }

  return mapUser(data.user);
}

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return { message: "Verification email sent. Check your inbox." };
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });

  if (error) {
    throw error;
  }

  return { message: "Password reset email sent. Check your inbox." };
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  return { message: "Password updated successfully." };
}

export async function startGoogleLogin() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }
}

export function userFromSupabase(user: User | null) {
  return user ? mapUser(user) : null;
}
