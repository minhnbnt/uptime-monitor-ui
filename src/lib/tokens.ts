import type { UserProfile } from '../types/api';

function getItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function setItem(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function removeItem(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function getAccessToken(): string | null {
  return getItem('access_token');
}

export function setAccessToken(access: string) {
  setItem('access_token', access);
}

export function clearTokens() {
  removeItem('access_token');
  removeItem('user');
}

export function getStoredUser(): UserProfile | null {
  const raw = getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw) as UserProfile; } catch { return null; }
}

export function setStoredUser(user: UserProfile) {
  setItem('user', JSON.stringify(user));
}
