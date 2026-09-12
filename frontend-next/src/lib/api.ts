export const BACKEND_WAKING_MESSAGE =
  "The server is starting up (this can take ~30–60 seconds on the free plan). Wait a moment and try again.";

export function isBackendWakingError(error: unknown): boolean {
  return error instanceof Error && error.message === BACKEND_WAKING_MESSAGE;
}

function looksLikeWakePage(text: string): boolean {
  const sample = text.slice(0, 2000).toLowerCase();
  return (
    sample.includes("service waking up") ||
    sample.includes("application loading") ||
    sample.includes("welcome to render") ||
    sample.includes("incoming http request detected")
  );
}

/** Safe JSON body parsing for API responses that may be empty or HTML. */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "Empty response from server. The backend may have timed out or restarted — try again in a minute."
        : `Request failed (HTTP ${response.status}) with an empty body.`
    );
  }

  if (looksLikeWakePage(text)) {
    throw new Error(BACKEND_WAKING_MESSAGE);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      `Server returned non-JSON (HTTP ${response.status}): ${preview}`
    );
  }
}
