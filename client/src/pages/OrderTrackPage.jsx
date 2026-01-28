import React, { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { jsonFetch } from "../api/http.js"
import { buildReceiptText, downloadTextFile } from "../utils/receipt.js"

function statusIdx(s) {
    const st = String(s || "").toUpperCase()
    if (st === "RECEIVED") return 0
    if (st === "IN_PROGRESS" || st === "PREP") return 1
    if (st === "BAKE") return 2
    if (st === "BOX") return 3
    if (st === "DONE" || st === "READY" || st === "COMPLETED") return 4
    return 0
}

function statusPct(s) {
    return (statusIdx(s) / 4) * 100
}

export default function OrderTrackPage() {
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [err, setErr] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let alive = true
        let t = null

        async function tick() {
            try {
                setErr("")
                const d = await jsonFetch(`/api/orders/${id}/track`)
                if (!alive) return
                setData(d || null)
                setLoading(false)
            } catch (e) {
                if (!alive) return
                setErr(String(e?.message || e))
                setLoading(false)
            }
        }

        tick()
        t = setInterval(tick, 1500)

        return () => {
            alive = false
            if (t) clearInterval(t)
        }
    }, [id])

    const receiptText = useMemo(() => {
        return buildReceiptText({ orderId: id, track: data, now: Date.now() })
    }, [id, data])
    const st = String(data?.status || "").toUpperCase()
    const showKitchen = st !== "COMPLETED" && st !== "DONE" && st !== "READY" && st !== "CANCELED"


    return (
        <div className="page order-track">
            <div className="panel-order">
                {loading && <div className="muted">Loading...</div>}
                {!!err && <div className="error">{err}</div>}

                {data && (
                    <div className="tracker">
                        <div className="tracker-top">
                            <div className="tracker-title">PIZZA TRACKER</div>
                            <div className="tracker-sub">
                                Order <span className="mono">{id}</span> • Status <strong className={`track-status ${st}`}>{st}</strong>
                            </div>
                        </div>

                        <div className="tracker-rail">
                            <div className="tracker-steps">
                                {["RECEIVED", "PREP", "BAKE", "BOX", "DONE"].map((s, idx) => (
                                    <div key={s} className={"tracker-step " + (idx <= statusIdx(data.status) ? "on" : "")}>
                                        <div className="tracker-step-dot">{idx + 1}</div>
                                        <div className="tracker-step-label">{s}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="tracker-bar">
                                <div className="tracker-bar-fill" style={{ width: `${statusPct(data.status)}%` }} />
                            </div>
                        </div>
                        {showKitchen && (
                            <div className="tracker-kitchen">
                                <div className="tracker-panel-title">KITCHEN PROGRESS</div>

                                <div className="track-list">
                                    {(data.items || []).map((it, i) => {
                                        const k = it?.kitchen || null
                                        const tops = Array.isArray(it?.toppings) ? it.toppings : []
                                        const doneArr = Array.isArray(k?.toppingDone) ? k.toppingDone : []
                                        const completed = Math.min(doneArr.length, tops.length)
                                        const total = tops.length
                                        const nextId = tops[completed] || ""

                                        return (
                                            <div className="track-card" key={i}>
                                                <div className="track-title">
                                                    <div>{it?.name || `Item ${i + 1}`}</div>
                                                    <div className="panel-kitchen-qty">Qty:{Number(it?.qty || 1)}</div>
                                                </div>

                                                <div className="track-meta">
                                                    <div className="muted">Toppings progress</div>
                                                    <div className="mono">{completed}/{total} toppings added</div>
                                                </div>

                                                {nextId ? (
                                                    <div className="track-meta">
                                                        <div className="muted">Up next:{nextId}</div>
                                                    </div>
                                                ) : (
                                                    <div className="track-meta">
                                                        <div className="mono">All toppings added waiting to go in the oven.</div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="tracker-panels">
                            <div className="tracker-panel">
                                <div className="tracker-panel-title">YOUR ORDER</div>
                                <div className="tracker-items">
                                    {(data.items || []).map((it, i) => (
                                        <div key={i} className="tracker-item">
                                            <div><strong>{it?.name || `Item ${i + 1}`}</strong></div>
                                            <div className="panel-kitchen-qty">Qty: {Number(it?.qty || 1)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="tracker-panel">
                                <div className="tracker-panel-title">ACTIONS</div>
                                <button
                                    type="button"
                                    className="primary-btn"
                                    onClick={() => downloadTextFile(`pizza-planet-receipt-${id}.txt`, receiptText)}
                                >
                                    Download receipt
                                </button>

                                <div style={{ height: 10 }} />

                                <Link to="/" className="primary-btn">Dispute Order</Link>
                            </div>
                        </div>


                    </div>
                )}

            </div>
        </div>
    )
}
