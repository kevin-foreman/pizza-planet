export async function jsonFetch(path, options = {}) {
  const token = localStorage.getItem("pp_token")

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const text = await res.text()

  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (res.status === 401) {
    localStorage.removeItem("pp_token")
    localStorage.removeItem("pp_user")
  }

  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`)
  return data
}


export const authApi = {
  login: (payload) =>
    jsonFetch("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  signup: (payload) =>
    jsonFetch("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
}
