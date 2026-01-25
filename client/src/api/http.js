const API = import.meta.env.VITE_API_URL || "http://localhost:4000"


export async function http(path, { token, method = 'GET', body } = {}) {
    const r = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    })
    const data = await r.json().catch(() => null)
    if (!r.ok) throw new Error(data?.error || 'Request failed')
    return data
}

export async function jsonFetch(path, options = {}) {
    const token = localStorage.getItem("pp_token")
    const isForm = options?.body instanceof FormData

    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            ...(isForm ? {} : { "Content-Type": "application/json" }),
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