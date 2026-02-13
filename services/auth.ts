import { apiFetch, buildApiUrl } from './api';

interface AuthStatusResponse {
  authenticated: boolean;
}

interface ApiErrorResponse {
  error?: string;
  retry_after_seconds?: number;
}

async function getJson<T>(res: Response): Promise<T> {
  return await res.json() as T;
}

export const auth = {
  async status(): Promise<boolean> {
    const res = await fetch(buildApiUrl('auth_status'), {
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await getJson<AuthStatusResponse>(res);
    return data.authenticated === true;
  },

  async login(password: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const res = await fetch(buildApiUrl('login'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) return { ok: true };

    let message = 'Login failed';
    try {
      const body = await getJson<ApiErrorResponse>(res);
      if (body.error) message = body.error;
      if (res.status === 429 && body.retry_after_seconds) {
        message = `${message}. Retry in ${body.retry_after_seconds}s`;
      }
    } catch {
      // no-op
    }
    return { ok: false, message };
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('logout', {
        method: 'POST',
      });
    } finally {
      window.dispatchEvent(new Event('auth:required'));
    }
  },
};
