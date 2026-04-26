async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`/internal/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { message?: string }).message || `Erro ${res.status}`);
  }

  return data;
}

export const api = {
  get: (path: string) => apiCall(path),
  post: (path: string, data: unknown) =>
    apiCall(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path: string, data: unknown) =>
    apiCall(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (path: string, data: unknown) =>
    apiCall(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path: string) => apiCall(path, { method: 'DELETE' }),
};
