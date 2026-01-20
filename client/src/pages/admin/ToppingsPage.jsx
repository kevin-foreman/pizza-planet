import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

const API = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function ToppingsPage() {
    const [toppings, setToppings] = useState([])
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({ name: "", type: "other", price: "", isPremium: false, isAvailable: true })
    const [confirmDelete, setConfirmDelete] = useState(null)

    const location = useLocation()

    useEffect(() => {
        load()
    }, [location.pathname])

    async function load() {
        try {
            setError("")
            const r = await fetch(`${API}/api/toppings?ts=${Date.now()}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
            })
            if (!r.ok) {
                const text = await r.text().catch(() => "")
                throw new Error(text || `Failed to load toppings (${r.status})`)
            }
            const data = await r.json()
            setToppings(Array.isArray(data) ? data : (data.toppings || []))
        } catch (e) {
            setError(String(e.message || "Failed to load toppings"))
        }
    }

    function onChange(e) {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    }

    function onPriceChange(e) {
        let v = e.target.value
        if (v === "") { setForm(p => ({ ...p, price: "" })); return }
        if (!/^\d*(\.\d{0,2})?$/.test(v)) return
        const n = Number(v)
        if (n > 1000) return
        setForm(p => ({ ...p, price: v }))
    }

    async function addTopping(e) {
        e.preventDefault()
        setBusy(true)
        setError("")
        try {
            const payload = { name: form.name.trim(), type: form.type, price: Number(form.price) || 0, isPremium: !!form.isPremium, isAvailable: !!form.isAvailable }
            const r = await fetch(`${API}/api/toppings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
            if (!r.ok) {
                const text = await r.text().catch(() => "")
                throw new Error(text || `Failed to add topping (${r.status})`)
            }
            setForm({ name: "", type: "other", price: "", isPremium: false, isAvailable: true })
            await load()
        } catch (e) {
            setError(String(e.message || "Failed to add topping"))
        } finally {
            setBusy(false)
        }
    }

    async function setAvailable(id, isAvailable) {
        setBusy(true)
        setError("")
        try {
            const r = await fetch(`${API}/api/toppings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable }) })
            if (!r.ok) {
                const text = await r.text().catch(() => "")
                throw new Error(text || `Failed to update topping (${r.status})`)
            }
            await load()
        } catch (e) {
            setError(String(e.message || "Failed to update topping"))
        } finally {
            setBusy(false)
        }
    }

    async function deleteOne(id) {
        setBusy(true); setError("")
        try {
            const r = await fetch(`${API}/api/toppings/${id}`, { method: "DELETE" })
            const text = await r.text().catch(() => "")
            if (!r.ok) throw new Error(text || `Failed to delete (${r.status})`)
            setToppings(prev => prev.filter(t => t._id !== id))
        } catch (e) {
            setError(String(e.message || "Failed to delete topping"))
        } finally {
            setBusy(false)
        }
    }


    return (
        <div className="toppings-admin">
            <div className="toppings-head">
                <h1>Toppings</h1>
                <p>Add toppings, or disable them (instead of deleting).</p>
                {error && <div className="error">{error}</div>}
            </div>

            <div className="toppings-grid">
                <section className="panel">
                    <h2>Add topping</h2>
                    <form onSubmit={addTopping} className="form">
                        <div className="row">
                            <label>Name</label>
                            <input name="name" value={form.name} onChange={onChange} required />
                        </div>

                        <div className="row">
                            <label>Type</label>
                            <select name="type" value={form.type} onChange={onChange}>
                                <option value="meat">meat</option>
                                <option value="veggie">veggie</option>
                                <option value="cheese">cheese</option>
                                <option value="sauce">sauce</option>
                                <option value="other">other</option>
                            </select>
                        </div>

                        <div className="row">
                            <label>Price</label>
                            <div className="money">
                                <span className="prefix">$</span>
                                <input name="price" type="text" inputMode="decimal" placeholder="0.00" value={form.price} onChange={onPriceChange} />
                            </div>
                        </div>

                        <div className="row premium-row">
                            <label className="premium-toggle">
                                <input type="checkbox" checked={form.isPremium} onChange={e => setForm(p => ({ ...p, isPremium: e.target.checked }))} />
                                <span className="premium-label">Premium topping</span>
                            </label>
                        </div>

                        <button type="submit" className="btn" disabled={busy}>Add topping</button>
                    </form>
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h2>Current toppings</h2>
                        <div className="muted">{toppings.length} total</div>
                    </div>

                    <div className="list">
                        {toppings.map(t => (
                            <div key={t._id} className="card">
                                <div className="card-main">
                                    <div className="title">{t.name}</div>
                                    <div className="meta">
                                        <span className="pill">{t.type || "other"}</span>
                                        <span className="price">{Number(t.price) === 0 ? " free" : `$${Number(t.price).toFixed(2)}`}</span>
                                        {t.isPremium && <span className="pill premium">premium</span>}
                                        {t.isAvailable === false && <span className="pill">disabled</span>}
                                    </div>
                                </div>

                                <div className="actions">
                                    {t.isAvailable === false ? (
                                        <button type="button" className="btn" disabled={busy} onClick={() => setAvailable(t._id, true)}>Enable</button>
                                    ) : (
                                        <button type="button" className="btn danger" disabled={busy} onClick={() => setAvailable(t._id, false)}>Disable</button>
                                    )}
                                    <button type="button" className="btn delete" disabled={busy} onClick={() => setConfirmDelete(t._id)}>Delete</button>
                                </div>

                                {confirmDelete === t._id && (
                                    <div className="confirm-pop">
                                        <p>Delete "{t.name}"?</p>
                                        <div className="confirm-actions">
                                            <button className="btn delete" disabled={busy} onClick={async () => { try { await deleteOne(t._id) } finally { setConfirmDelete(null) } }}>Delete</button>
                                            <button className="btn" disabled={busy} onClick={() => setConfirmDelete(null)}>Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {toppings.length === 0 && <div className="muted">No toppings yet.</div>}
                    </div>
                </section>
            </div>
        </div>
    )
}
