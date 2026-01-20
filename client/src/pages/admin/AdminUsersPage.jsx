import React, { useEffect, useMemo, useState } from "react"
import { adminApi } from "../../api/admin.js"
import { useAuth } from "../../context/AuthContext.jsx"

export default function AdminUsersPage() {
    const { user } = useAuth()
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [users, setUsers] = useState([])
    const [q, setQ] = useState("")

    /*Custom Confirm box because the default confirm() was UGLY*/
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")
    const [confirmYes, setConfirmYes] = useState(() => () => { })

    async function load() {
        setBusy(true)
        setError("")
        try {
            const data = await adminApi.listUsers()
            setUsers(data.users || [])
        } catch (e) {
            setError(e.message || "Failed")
        } finally {
            setBusy(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    function askConfirm(text, onYes) {
        setConfirmText(text)
        setConfirmYes(() => onYes)
        setConfirmOpen(true)
    }

    function closeConfirm() {
        setConfirmOpen(false)
        setConfirmText("")
        setConfirmYes(() => () => { })
    }


    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase()
        if (!s) return users
        return users.filter(u =>
            (u.email || "").toLowerCase().includes(s) ||
            (u.displayName || "").toLowerCase().includes(s)
        )
    }, [q, users])

    async function setRole(id, role) {
        setBusy(true)
        setError("")
        try {
            const data = await adminApi.setUserRole(id, role)
            setUsers(prev => prev.map(u => u._id === id ? data.user : u))
        } catch (e) {
            setError(e.message || "Failed")
        } finally {
            setBusy(false)
        }
    }



    async function setActive(id, isActive) {
        setBusy(true)
        setError("")
        try {
            const data = await adminApi.setUserActive(id, isActive)
            setUsers(prev => prev.map(u => u._id === id ? data.user : u))
        } catch (e) {
            setError(e.message || "Failed")
        } finally {
            setBusy(false)
        }
    }

    if (!user || user.role !== "admin") {
        return (
            <div className="container page">
                <h1 className="center-title">Users</h1>
                <p className="page-sub center-title">Admin only.</p>
            </div>
        )
    }

    return (
        <div className="container page users-admin">
            <div className="users-head">
                <h1>Users</h1>
                <p className="page-sub">Manage roles and access. Passwords are never visible.</p>

                <div className="meta">
                    <input
                        value={q}
                        maxLength={50}
                        placeholder="Search users..."
                        onChange={e => {
                            const raw = e.target.value
                            const cleaned = raw.replace(/[^a-zA-Z0-9@._-]/g, "")
                            setQ(cleaned)
                        }}
                    />

                    <button className="btn" onClick={load} disabled={busy}>Refresh</button>
                </div>

                {error && <div className="error" style={{ width: "100%", maxWidth: 720 }}>{error}</div>}
            </div>

            <section className="panel">
                <div className="list">
                    {filtered.map(u => (
                        <div key={u._id} className="card">
                            <div className="user-row">
                                <div className="user-info">
                                    <div className="title"><strong>Email:</strong> {u.email}</div>
                                    <div className="username"><strong>Username:</strong> {u.displayName || "(none)"}</div>

                                    <div className="user-pills">
                                        <span className={`pill role-${u.role || "customer"}`}>{u.role || "customer"}</span>
                                        <span className="pill">ACTIVE</span>
                                    </div>
                                </div>

                                <div className="user-actions">
                                    <select
                                        value={u.role || "customer"}
                                        onChange={e => {
                                            const nextRole = e.target.value
                                            askConfirm(`Set ${u.email} to ${nextRole}?`, () => setRole(u._id, nextRole))
                                        }}
                                        disabled={busy}
                                    >
                                        <option value="customer">customer</option>
                                        <option value="staff">staff</option>
                                        <option value="admin">admin</option>
                                    </select>

                                    <button
                                        className="btn delete"
                                        onClick={() => {
                                            askConfirm(
                                                `Delete ${u.email}? This cannot be undone.`,
                                                async () => {
                                                    setBusy(true)
                                                    setError("")
                                                    try {
                                                        await adminApi.deleteUser(u._id)
                                                        setUsers(prev => prev.filter(x => x._id !== u._id))
                                                    } catch (e) {
                                                        setError(e.message || "Failed")
                                                    } finally {
                                                        setBusy(false)
                                                    }
                                                }
                                            )
                                        }}
                                        disabled={busy}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>

                    ))}

                    {!busy && filtered.length === 0 && (
                        <div style={{ opacity: .8 }}>No users found.</div>
                    )}
                </div>
            </section>
            {confirmOpen && (
                <div className="modal-overlay" onClick={closeConfirm}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Are you sure?</h2>
                        <p className="modal-text">{confirmText}</p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    closeConfirm()
                                    confirmYes()
                                }}
                                disabled={busy}
                            >
                                Yes
                            </button>

                            <button
                                type="button"
                                onClick={closeConfirm}
                                disabled={busy}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
