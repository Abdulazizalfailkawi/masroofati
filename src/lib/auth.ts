// Legacy key: older versions cached the logged-in user (including an
// "isAdmin" flag) in localStorage. The session now comes from Supabase only.
const LEGACY_AUTH_STORAGE_KEY = 'masroofati:auth_user';

export function clearLegacyAuthStorage(): void {
  try {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  } catch (_) {}
}
