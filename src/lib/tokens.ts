import type { UserProfile } from '../types/api';

const REFRESH_COOKIE = 'refresh_token';

function getItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function setItem(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function removeItem(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

function setCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Strict; Secure; max-age=${90 * 24 * 60 * 60}`;
  } catch { /* ignore */ }
}

function removeCookie(name: string) {
  try {
    document.cookie = `${name}=; Path=/; SameSite=Strict; Secure; max-age=0`;
  } catch { /* ignore */ }
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(`(?:^|;\\s*)${name}=([^;]*)`);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

export function getAccessToken(): string | null {
  return getItem('access_token');
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_COOKIE);
}

export function setTokens(access: string, refresh: string) {
  setItem('access_token', access);
  setCookie(REFRESH_COOKIE, refresh);
}

export function clearTokens() {
  removeItem('access_token');
  removeCookie(REFRESH_COOKIE);
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
