import { authFetch, clearAuth, isDevAuthBypass } from "@/lib/auth";
import { parseJsonResponse } from "@/lib/api";

/* ---------- Types ---------- */

export interface TrialLocation {
  facility?: string;
  city?: string;
  country?: string;
}

export interface Trial {
  nct_id: string;
  title: string;
  status?: string;
  matched_condition: string;
  score: number;
  eligibility_score: number;
  eligibility_status: string;
  condition_similarity: number;
  location_score: number;
  match_reasons: string[];
  unknown_information: string[];
  potential_conflicts: string[];
  eligibility_explanation: string;
  locations: TrialLocation[];
}

export type Sex = "MALE" | "FEMALE" | "OTHER";

export interface ProfileInput {
  full_name: string | null;
  date_of_birth: string | null;
  sex: Sex | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  conditions: string[];
  medications: string[];
  allergies: string[];
  medical_history: string[];
  lab_values: Record<string, number>;
  notes: string | null;
  contact_consent: boolean;
}

export interface Profile extends ProfileInput {
  age: number | null;
  completion: number;
  updated_at: string;
}

export interface Registration {
  id: number;
  nct_id: string;
  title: string | null;
  status: string;
  preferred_contact: "EMAIL" | "PHONE";
  message: string | null;
  created_at: string;
}

export interface SavedTrial {
  id: number;
  nct_id: string;
  title: string | null;
  created_at: string;
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  result_count: number | null;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSessionSummary {
  id: number;
  title: string;
  query: string | null;
  trial_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatContext {
  query?: string | null;
  patient_profile?: Record<string, unknown> | null;
  trials?: Partial<Trial>[];
}

export interface ChatSessionDetail extends ChatSessionSummary {
  context: ChatContext | null;
  messages: ChatMessage[];
}

/* ---------- Core request helper ---------- */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

function detailMessage(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg).replace(/^Value error, /, "");
  }
  return fallback;
}

type RequestOptions = RequestInit & { json?: unknown };

async function send(path: string, { json, ...init }: RequestOptions = {}) {
  const headers = new Headers(init.headers);
  if (json !== undefined) headers.set("Content-Type", "application/json");

  const response = await authFetch(`/api${path}`, {
    ...init,
    headers,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });

  if (response.status === 401) {
    if (isDevAuthBypass()) {
      throw new ApiError(401, "API needs a real backend login. UI preview is still available.");
    }
    clearAuth();
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    let message = `Request failed (HTTP ${response.status})`;
    try {
      message = detailMessage(await parseJsonResponse(response), message);
    } catch {
      // keep the generic message
    }
    throw new ApiError(response.status, message);
  }

  return response;
}

export async function apiRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  return parseJsonResponse<T>(await send(path, options));
}

/* ---------- Profile ---------- */

export async function getProfile(): Promise<Profile | null> {
  try {
    return await apiRequest<Profile>("/users/me/profile");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const PROFILE_EVENT = "trialmatch-profile-changed";

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const profile = await apiRequest<Profile>("/users/me/profile", { method: "PUT", json: input });
  window.dispatchEvent(new Event(PROFILE_EVENT));
  return profile;
}

export async function deleteProfile() {
  const result = await apiRequest<{ message: string }>("/users/me/profile", { method: "DELETE" });
  window.dispatchEvent(new Event(PROFILE_EVENT));
  return result;
}

/** Turns a saved profile into a natural-language search query. */
export function profileToQuery(profile: Profile): string {
  const parts: string[] = [];
  const who = [
    profile.age != null ? `${profile.age} year old` : null,
    profile.sex && profile.sex !== "OTHER" ? profile.sex.toLowerCase() : null,
  ]
    .filter(Boolean)
    .join(" ");

  parts.push(who || "Patient");
  if (profile.conditions.length) parts.push(`with ${profile.conditions.join(", ")}`);
  if (profile.medications.length) parts.push(`taking ${profile.medications.join(", ")}`);

  const labs = Object.entries(profile.lab_values).map(([k, v]) => `${k} ${v}`);
  if (labs.length) parts.push(labs.join(", "));

  const place = [profile.city, profile.country].filter(Boolean).join(", ");
  if (place) parts.push(`living in ${place}`);

  return parts.join(", ").replace(/^(\S.*?), with/, "$1 with");
}

/* ---------- Trial registrations & saved trials ---------- */

export const listRegistrations = () =>
  apiRequest<Registration[]>("/users/me/registrations");

export const registerForTrial = (
  nctId: string,
  body: { title?: string; preferred_contact: "EMAIL" | "PHONE"; message?: string }
) =>
  apiRequest<Registration>(`/trials/${encodeURIComponent(nctId)}/register`, {
    method: "POST",
    json: body,
  });

export const withdrawRegistration = (nctId: string) =>
  apiRequest<{ message: string }>(`/trials/${encodeURIComponent(nctId)}/register`, {
    method: "DELETE",
  });

export const listSavedTrials = () => apiRequest<SavedTrial[]>("/users/me/saved-trials");

export const saveTrial = (nctId: string, title?: string) =>
  apiRequest<SavedTrial>("/saved-trials", { method: "POST", json: { nct_id: nctId, title } });

export const unsaveTrial = (nctId: string) =>
  apiRequest<{ message: string }>(`/saved-trials/${encodeURIComponent(nctId)}`, {
    method: "DELETE",
  });

export const listSearchHistory = () =>
  apiRequest<SearchHistoryItem[]>("/users/me/search-history");

/* ---------- Chat ---------- */

export const listChatSessions = () => apiRequest<ChatSessionSummary[]>("/chat/sessions");

export const createChatSession = (body: { title?: string; context?: ChatContext }) =>
  apiRequest<ChatSessionDetail>("/chat/sessions", { method: "POST", json: body });

export const getChatSession = (id: number) =>
  apiRequest<ChatSessionDetail>(`/chat/sessions/${id}`);

export const deleteChatSession = (id: number) =>
  apiRequest<{ message: string }>(`/chat/sessions/${id}`, { method: "DELETE" });

/** Sends a message and calls onDelta for each streamed chunk. Resolves with the full reply. */
export async function streamChatMessage(
  sessionId: number,
  content: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await send(`/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    json: { content },
    signal,
  });

  if (!response.body) {
    const text = await response.text();
    onDelta(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onDelta(chunk);
    }
  }

  return full;
}
