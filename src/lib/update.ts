export const CURRENT_VERSION: string = __BUILD_ID__;

/** Version of the newest deployment, or null if it can't be read (offline, dev server). */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.v === 'string' ? json.v : null;
  } catch (_) {
    return null;
  }
}

export async function isUpdateAvailable(): Promise<boolean> {
  const latest = await fetchLatestVersion();
  return latest !== null && latest !== CURRENT_VERSION;
}

/** Drops the offline cache and reloads, so the newest deployment is fetched. Saved data is untouched. */
export async function applyUpdate(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (_) {}
  window.location.reload();
}
