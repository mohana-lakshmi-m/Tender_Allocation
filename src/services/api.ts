/**
 * Single seam between the UI and the backend server.
 *
 * Dispatches real HTTP requests to VITE_API_BASE_URL (http://localhost:5000/api).
 */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:5000/api";

export async function request<T>(
  path: string,
  fallbackResolver?: () => T | Promise<T>,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`API Request failed with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data as T;
  } catch (error) {
    console.warn(`[API] Remote call to ${url} failed or unreachable, using fallback resolver:`, error);
    if (fallbackResolver) {
      return fallbackResolver();
    }
    throw error;
  }
}

export function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

export function shortHash(value: string, lead = 6, tail = 4): string {
  if (value.length <= lead + tail + 2) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
