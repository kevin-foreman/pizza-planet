import React, { useMemo, useState } from 'react'

const STATUS_FLOW = ['RECEIVED', 'IN_PROGRESS', 'READY', 'COMPLETED']

function nextStatus(current) {
    const i = STATUS_FLOW.indexOf(current)
    if (i === -1) return 'RECEIVED'
    return STATUS_FLOW[Math.min(i + 1, STATUS_FLOW.length - 1)]
}

function prevStatus(current) {
    const i = STATUS_FLOW.indexOf(current)
    if (i <= 0) return STATUS_FLOW[0]
    return STATUS_FLOW[i - 1]
}

export default function StaffOrdersPage() {
    const seed = useMemo(() => [
        {
            id: 'PP-1042',
            customer: 'Benji',
            createdAt: '12:14 PM',
            status: 'RECEIVED',
            total: 13.74,
            items: [
                { type: 'Pizza', desc: 'Medium, Thin, Tomato, Pepperoni' },
            ],
            notes: 'No onions pls',
        },
        {
            id: 'PP-1041',
            customer: 'Matt',
            createdAt: '12:08 PM',
            status: 'IN_PROGRESS',
            total: 22.15,
            items: [
                { type: 'Pizza', desc: 'Large, Hand Tossed, BBQ, Ham + Green Peppers' },
                { type: 'Salad', desc: 'Caesar, Add Chicken' },
            ],
            notes: '',
        },
    ], [])

    const [orders, setOrders] = useState(seed)

    function updateStatus(id, newStatus) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    }

    function bumpForward(id) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus(o.status) } : o))
    }

    function bumpBack(id) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: prevStatus(o.status) } : o))
    }

    function cancelOrder(id) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o))
    }

    const sorted = useMemo(() => {
        const rank = s => (
            s === 'RECEIVED' ? 0 :
                s === 'IN_PROGRESS' ? 1 :
                    s === 'READY' ? 2 :
                        s === 'COMPLETED' ? 3 :
                            s === 'CANCELLED' ? 99 :
                                50
        )
        return [...orders].sort((a, b) => rank(a.status) - rank(b.status))
    }, [orders])

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Staff Orders</h1>
                <div className="page-sub">View incoming orders and update progress.</div>
            </div>

            <div className="staff-grid">
                <section className="panel">
                    <h2>Queue</h2>

                    <div className="order-list">
                        {sorted.map(o => (
                            <div key={o.id} className="order-card">
                                <div className="order-top">
                                    <div>
                                        <div className="order-id">{o.id}</div>
                                        <div className="order-meta">
                                            <span>{o.customer}</span>
                                            <span className="dot">•</span>
                                            <span>{o.createdAt}</span>
                                            <span className="dot">•</span>
                                            <span className={`pill pill-${o.status}`}>{o.status.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    <div className="order-total">${o.total.toFixed(2)}</div>
                                </div>

                                <div className="order-items">
                                    {o.items.map((it, idx) => (
                                        <div key={idx} className="order-item">
                                            <span className="order-item-type">{it.type}</span>
                                            <span className="order-item-desc">{it.desc}</span>
                                        </div>
                                    ))}
                                </div>

                                {o.notes ? (
                                    <div className="order-notes">
                                        <b>Notes:</b> {o.notes}
                                    </div>
                                ) : null}

                                <div className="order-actions">
                                    <button type="button" onClick={() => bumpBack(o.id)} disabled={o.status === 'RECEIVED' || o.status === 'CANCELLED'}>Back</button>
                                    <button type="button" onClick={() => bumpForward(o.id)} disabled={o.status === 'COMPLETED' || o.status === 'CANCELLED'}>Next</button>

                                    <div className="order-actions-split" />

                                    <button type="button" className="btn-ghost" onClick={() => updateStatus(o.id, 'READY')} disabled={o.status === 'CANCELLED'}>Mark Ready</button>
                                    <button type="button" className="btn-danger" onClick={() => cancelOrder(o.id)} disabled={o.status === 'CANCELLED' || o.status === 'COMPLETED'}>Cancel</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <aside className="panel">
                    <h2>Status Guide</h2>
                    <div className="helper">
                        <div className="helper-row"><span className="pill pill-RECEIVED">RECEIVED</span><span>New order came in</span></div>
                        <div className="helper-row"><span className="pill pill-IN_PROGRESS">IN PROGRESS</span><span>Making it</span></div>
                        <div className="helper-row"><span className="pill pill-READY">READY</span><span>Ready for pickup/delivery</span></div>
                        <div className="helper-row"><span className="pill pill-COMPLETED">COMPLETED</span><span>Handed off</span></div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
