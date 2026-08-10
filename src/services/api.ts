/**
 * Single seam between the UI and the backend.
 *
 * Every service module goes through `request()`. To move from mock data to a
 * real backend, replace the body of `request()` with a `fetch(BASE_URL + path)`
 * call — no component or hook needs to change.
 */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

const NETWORK_LATENCY_MS = 420;

export async function request<T>(_path: string, resolver: () => T | Promise<T>): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, NETWORK_LATENCY_MS));
  return resolver();
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
