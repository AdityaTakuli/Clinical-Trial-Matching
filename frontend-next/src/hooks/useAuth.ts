"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AUTH_EVENT, getEmail, getToken } from "@/lib/auth";

function subscribe(onChange: () => void) {
  window.addEventListener(AUTH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** `undefined` while unknown (server render / hydration), `null` when logged out. */
export function useAuthToken(): string | null | undefined {
  return useSyncExternalStore(subscribe, getToken, () => undefined);
}

export function useAuthEmail(): string | null {
  return useSyncExternalStore(subscribe, getEmail, () => null);
}

/** Redirects to login when logged out. Returns true once a token is present. */
export function useRequireAuth(nextPath: string): boolean {
  const token = useAuthToken();
  const router = useRouter();

  useEffect(() => {
    if (token === null) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [token, router, nextPath]);

  return typeof token === "string";
}
