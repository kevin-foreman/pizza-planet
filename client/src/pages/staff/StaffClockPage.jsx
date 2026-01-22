import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_URL || ''

function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('pizzaPlanet.token') || ''
}
function msToHoursMins(ms) {
    const mins = Math.max(0, Math.floor(ms / 60000))
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
}

function msToHms(ms) {
    const secs = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    const pad = n => String(n).padStart(2, '0')
    return `${h}:${pad(m)}:${pad(s)}`
}

export default function StaffClockPage() {
    const { user, token } = useAuth()
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [status, setStatus] = useState({ isClockedIn: false, activeShift: null })
    const [tick, setTick] = useState(0)
    const [summary, setSummary] = useState(null)
    const [confirm, setConfirm] = useState(null)

    useEffect(() => {
        const t = setInterval(() => setTick(x => x + 1), 1000)
        return () => clearInterval(t)
    }, [])

    async function apiFetch(path, opts) {
        const r = await fetch(`${API}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            ...opts
        })
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.message || data?.error || 'Request failed')
        return data
    }

    async function fetchSummary() {
        try {
            const data = await apiFetch('/api/shifts/me/summary')
            setSummary(data)
        } catch (e) {
            // keep silent or show error if you want
        }
    }

    async function refresh() {
        setError('')
        setLoading(true)
        try {
            const data = await apiFetch('/api/shifts/status')
            setStatus(data || { isClockedIn: false, activeShift: null })
            await fetchSummary()
        } catch (e) {
            setError(e.message || 'Failed to load status')
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        refresh()
    }, [])

    async function clockIn() {
        setBusy(true)
        setError('')
        try {
            await apiFetch('/api/shifts/clock-in', { method: 'POST' })
            await refresh()
        } catch (e) {
            setError(e.message || 'Clock in failed')
        } finally {
            setBusy(false)
        }
    }

    async function clockOut() {
        setBusy(true)
        setError('')
        try {
            await apiFetch('/api/shifts/clock-out', { method: 'POST' })
            await refresh()
        } catch (e) {
            setError(e.message || 'Clock out failed')
        } finally {
            setBusy(false)
        }
    }

    const isIn = !!status?.isClockedIn
    const sinceMs = useMemo(() => {
        const s = status?.activeShift
        const t = s?.clockInAt || s?.clockInAt?.$date || null
        return t ? new Date(t).getTime() : 0
    }, [status])

    const elapsed = useMemo(() => {
        if (!isIn || !sinceMs) return ''
        return msToHms(Date.now() - sinceMs)
    }, [tick, isIn, sinceMs])

    return (
        <div className="page staff-clock">
            <div className="page-header center-title">
                <h1>Clock In / Out</h1>
                <p className="page-sub">Status for {user?.displayName || 'Staff'}.</p>
                {error && <div className="error">{error}</div>}
            </div>

            <div className="panel staff-clock-card">
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        <div className={`clock-status ${isIn ? 'in' : 'out'}`}>
                            {isIn ? 'CLOCKED IN' : 'CLOCKED OUT'}
                        </div>

                        {isIn && (
                            <div className="clock-meta">
                                <div>Started:{new Date(sinceMs).toLocaleString()}</div>
                                <div>Elapsed:{elapsed}</div>
                            </div>
                        )}

                        {summary && (
                            <div className="clock-summary">
                                <div>Total worked:{msToHoursMins(summary.totalMs || 0)}</div>
                                <div>Shifts:{summary.shiftCount || 0}</div>
                            </div>
                        )}

                        <div className="clock-actions">
                            {isIn ? (
                                <button className="btn-danger" type="button" disabled={busy} onClick={() => setConfirm('out')}>
                                    Clock Out
                                </button>
                            ) : (
                                <button className="btn-clock-in" type="button" disabled={busy} onClick={() => setConfirm('in')}>
                                    Clock In
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {confirm && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="modal-title">
                            {confirm === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
                        </h3>

                        <p className="modal-text">
                            {confirm === 'in'
                                ? 'You are about to clock in. Continue?'
                                : 'You are about to clock out. Continue?'}
                        </p>

                        <div className="modal-actions">
                            <button type="button" onClick={() => setConfirm(null)} className="btn-ghost">
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                    const action = confirm
                                    setConfirm(null)
                                    action === 'in' ? await clockIn() : await clockOut()
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )


}