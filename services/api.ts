export const API_URL: string = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000/api.php';

if ((import.meta as any).env?.PROD && !(import.meta as any).env?.VITE_API_URL) {
  console.warn('VITE_API_URL is not set; frontend will try localhost and likely fail.');
}

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export function buildApiUrl(action: string, params: Record<string, string | number> = {}): string {
  const url = new URL(API_URL, window.location.origin);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function apiFetch(
  action: string,
  init: RequestInit = {},
  params: Record<string, string | number> = {}
): Promise<Response> {
  const response = await fetch(buildApiUrl(action, params), {
    credentials: 'include',
    ...init,
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:required'));
    throw new AuthRequiredError();
  }

  return response;
}
