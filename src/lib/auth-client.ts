import { GoTrueClient, type Session, type User } from '@supabase/auth-js';
import type { UserProfile } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL ?? `${API_BASE_URL}/auth/v1`;

let authClient: GoTrueClient | null = null;

export function getAuthClient() {
  if (!authClient) {
    authClient = new GoTrueClient({
      url: AUTH_BASE_URL,
      storageKey: 'uptime-monitor-auth',
      autoRefreshToken: true,
      persistSession: true,
    });
  }
  return authClient;
}

function fallbackName(email?: string | null) {
  return email?.split('@')[0] ?? 'User';
}

export function toUserProfile(user: User): UserProfile {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const username = typeof metadata.username === 'string' && metadata.username.trim()
    ? metadata.username.trim()
    : fallbackName(user.email);
  const name = typeof metadata.name === 'string' && metadata.name.trim()
    ? metadata.name.trim()
    : typeof metadata.full_name === 'string' && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : username;

  return {
    id: user.id,
    email: user.email ?? '',
    username,
    name,
  };
}

export function sessionToUser(session: Session | null): UserProfile | null {
  return session?.user ? toUserProfile(session.user) : null;
}
