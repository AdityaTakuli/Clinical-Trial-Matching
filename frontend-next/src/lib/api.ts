/** Safe JSON body parsing for API responses that may be empty or HTML. */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "Empty response from server. The backend may have timed out or restarted while loading models — try again in a minute."
        : `Request failed (HTTP ${response.status}) with an empty body.`
    );
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
