import { AuthUser } from '../types.ts';

export const ADMIN_EMAIL = 'alfailkaw33@gmail.com';
export const ADMIN_PASSCODE = 'admin7788';
export const AUTH_STORAGE_KEY = 'masroofati:auth_user';

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email) {
      return {
        ...parsed,
        isAdmin: isUserAdmin(parsed.email) || parsed.isAdmin === true,
      };
    }
  } catch (err) {
    console.error('Failed to load auth user:', err);
  }
  return null;
}

export function saveStoredAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      const sanitized: AuthUser = {
        ...user,
        isAdmin: isUserAdmin(user.email) || user.isAdmin === true,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitized));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save auth user:', err);
  }
}
