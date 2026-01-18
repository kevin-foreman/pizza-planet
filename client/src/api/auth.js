async function jsonFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  // Always read text first, then parse (prevents "empty response" weirdness)
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export const authApi = {
  signup: (payload) =>
    jsonFetch("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    jsonFetch("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
};
