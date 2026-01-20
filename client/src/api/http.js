const API = import.meta.env.VITE_API_URL || ''

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
