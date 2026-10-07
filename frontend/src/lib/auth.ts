// Helpers de autenticación
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant: { id: string; name: string; slug: string };
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
