import { parseJsonResponse } from "@/lib/api";

const TOKEN_KEY = "trialmatch_token";
const EMAIL_KEY = "trialmatch_email";

export const AUTH_EVENT = "trialmatch-auth-changed";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function setAuth(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  notifyAuthChange();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  notifyAuthChange();
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await parseJsonResponse<{ detail?: string | { msg?: string }[] }>(
      response.clone()
    );
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg ?? fallback;
    }
  } catch {
    // ignore JSON parse errors
  }
  return fallback;
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Login failed"));
  }

  const data = await parseJsonResponse<{ access_token?: string }>(response);
  if (!data?.access_token) {
    throw new Error("Login succeeded but no access token was returned.");
  }
  setAuth(data.access_token, email);
}

export async function register(email: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Registration failed"));
  }
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
