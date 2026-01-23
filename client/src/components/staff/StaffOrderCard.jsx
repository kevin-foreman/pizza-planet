import React, { useEffect, useMemo, useState } from "react"

function ConfirmModal({ open, title, text, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }) {
    if (!open) return null
    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
                <div className="modal-title">{title}</div>
                <div className="modal-text" style={{ whiteSpace: "pre-line" }}>{text}</div>
                <div className="modal-actions">
                    <button type="button" onClick={onCancel}>{cancelLabel}</button>
                    <button type="button" onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}

function uiStatus(s) {
    const v = String(s || "").toUpperCase()
    if (v === "RECEIVED") return "RECEIVED"
    if (v === "IN_PROGRESS") return "IN_PROGRESS"
    if (v === "COMPLETED") return "DONE"
    if (v === "CANCELED") return "CANCELED"
    return String(s || "")
}


function flattenToppings(order, toppingNameById) {
    const out = []
    for (const it of (order.items || [])) {
        const tops =
            (Array.isArray(it?.display?.toppings) && it.display.toppings) ||
            (Array.isArray(it?.toppings) && it.toppings) ||
            (Array.isArray(it?.config?.toppings) && it.config.toppings) ||
            []
        for (const t of tops) {
            const key = String(t)
            const nice = toppingNameById?.get(key) || key
            out.push({ label: nice, source: it.type || it.name || "Item" })
        }
    }
    return out
}



function fmt(ms) {
    if (!Number.isFinite(ms) || ms < 0) return "00:00"
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
}

export default function StaffOrderCard({ order, onPatch, toppingNameById }) {
    if (!order) return null

    const toppings = useMemo(() => flattenToppings(order, toppingNameById), [order, toppingNameById])
    const itemIndex = Number.isFinite(order.itemIndex) ? order.itemIndex : 0
    const k = (order.kitchen?.items && order.kitchen.items[itemIndex]) ? order.kitchen.items[itemIndex] : {}
    const isSubDone = !!k.doneAt
    const isSubCanceled = !!k.canceledAt

    const isItemDone = !!k.doneAt
    const isItemCanceled = !!k.canceledAt
    const isFinished = isItemDone || isItemCanceled

    const toppingIndex = Number.isFinite(k.toppingIndex) ? k.toppingIndex : 0
    const toppingDone = Array.isArray(k.toppingDone) ? k.toppingDone : []
    const next = toppings[toppingIndex] || null
    const allDone = toppings.length === 0 ? true : toppingIndex >= toppings.length

    // status can be API-ui ("RECEIVED") or db ("pending")
    const st = String(order.status || "")
    const isPending = st === "RECEIVED" || st === "pending"
    const isInProgress = st === "IN_PROGRESS" || st === "in_progress"
    const isCompleted = st === "READY" || st === "completed"
    const isCanceled = st === "CANCELED" || st === "canceled"

    const ovenConfirmed = !!k.ovenConfirmedAt
    const cookedConfirmed = !!k.cookedConfirmedAt

    // cooked confirmed -> ONLY Mark Ready (until clicked)
    const showMarkReadyOnly = isInProgress && allDone && ovenConfirmed && cookedConfirmed && !isSubDone && !isSubCanceled

    const [confirm, setConfirm] = useState({ open: false, kind: "", title: "", text: "" })
    function openConfirm(kind, title, text) { setConfirm({ open: true, kind, title, text }) }
    function closeConfirm() { setConfirm(s => ({ ...s, open: false })) }

    async function patch(patchObj) {
        const idx = Number.isFinite(order.itemIndex) ? order.itemIndex : 0
        if (typeof onPatch === "function") return await onPatch(order.orderId || order._id, { ...patchObj, itemIndex: idx })
    }


    function canGoBack() {
        if (!isInProgress) return false
        const idx = Number(k.toppingIndex || 0)
        if (idx <= 0) return false
        // one back per index (per “step”)
        if (Number(k.lastBackAtIndex || -1) === idx) return false
        return true
    }


    function canConfirmTopping() {
        if (!isInProgress || ovenConfirmed || allDone || !next) return false
        if (order.notes && !instructionsConfirmed) return false
        return true
    }

    function canConfirmInOven() {
        return isInProgress && !ovenConfirmed && allDone
    }
    function canConfirmCooked() {
        return isInProgress && ovenConfirmed && !cookedConfirmed
    }

    // elapsed timer (since createdAt)
    // elapsed timer (since createdAt). cap at 1 hour
    const createdMs = order?.createdAt ? new Date(order.createdAt).getTime() : NaN
    const [elapsedSec, setElapsedSec] = useState(0)
    const [expired, setExpired] = useState(false)
    const [instructionsConfirmed, setInstructionsConfirmed] = useState(false)

    useEffect(() => {
        setInstructionsConfirmed(false)
    }, [order._id])

    useEffect(() => {
        if (!Number.isFinite(createdMs)) return
        setExpired(false)

        function tick() {
            const sec = Math.floor((Date.now() - createdMs) / 1000)
            if (sec >= 3600) {
                setElapsedSec(3600)
                setExpired(true)
                return true // tell caller to stop
            }
            setElapsedSec(Math.max(0, sec))
            return false
        }

        // run once immediately
        if (tick()) return

        const id = setInterval(() => {
            const stop = tick()
            if (stop) clearInterval(id)
        }, 1000)

        return () => clearInterval(id)
    }, [createdMs])

    function fmtElapsed(sec) {
        if (expired) return "EXPIRED"
        if (!Number.isFinite(sec) || sec < 0) return "00s"
        if (sec < 60) return `${String(sec).padStart(2, "0")}s`
        const m = Math.floor(sec / 60)
        const r = sec % 60
        return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    }

    const elapsedLabel = fmtElapsed(elapsedSec)

    const pill = isSubCanceled ? "CANCELED" : isSubDone ? "DONE" : uiStatus(order.status)

    function onStart() {
        openConfirm("start", "Start this order?")
    }
    function onCancel() {
        openConfirm("cancel", "Cancel this order?", "This will delete the order. Did you mean to Restart?")
    }
    function onRestart() {
        openConfirm("restart", "Restart this order?", "This will restart the order from before the oven step.")
    }
    function onGoBackOne() {
        openConfirm("back", "Go back one step?", "You can only go back ONE topping.")
    }
    function onConfirmTopping() {
        if (!next) return
        openConfirm("topping", `Confirm topping: ${next.label} ON the item.`)
    }
    function onConfirmInstructions() {
        if (!order.notes) return
        openConfirm(
            "instructions",
            "Special instructions",
            `Notes:\n\n${order.notes}\n\nDo you confirm you read the special instructions?`
        )
    }

    function onConfirmInOven() {
        const note = order.notes ? `Special notes:\n\n${order.notes}\n\nConfirm you read these before placing in oven.` : "Confirm this item is in the oven."
        openConfirm("oven", "Confirm in oven?", note)
    }
    function onConfirmCooked() {
        openConfirm("cooked", "Confirm cooked?", "Confirm this item is fully cooked.")
    }
    function onMarkDone() {
        openConfirm("done", "Mark item done?", "Marks this order done.")
    }


    async function handleConfirm() {
        const kind = confirm.kind
        closeConfirm()
        if (kind === "instructions") {
            setInstructionsConfirmed(true)
            return
        }

        if (kind === "start") {
            await patch({
                status: "IN_PROGRESS",
                kitchen: {
                    startedAt: new Date().toISOString(),
                    toppingIndex: 0,
                    toppingDone: [],
                    restartCount: k.restartCount || 0,
                    ovenConfirmedAt: null,
                    cookedConfirmedAt: null,
                    backUsed: false,
                },
            })
            return
        }

        if (kind === "cancel") {
            await patch({ status: "CANCELED", kitchen: { ...k } })
            return
        }

        if (kind === "restart") {
            await patch({
                status: "RECEIVED",
                kitchen: {
                    startedAt: null,
                    startedBy: null,
                    toppingIndex: 0,
                    toppingDone: [],
                    lastBackAtIndex: -1,
                    restartCount: (k.restartCount || 0) + 1,
                    ovenConfirmedAt: null,
                    cookedConfirmedAt: null,
                    backUsed: false,
                },
            })
            return
        }


        if (kind === "back") {
            const nextK = { ...k }

            const cur = Number(nextK.toppingIndex || 0)
            if (cur <= 0) return

            // allow 1 back per current index
            if (Number(nextK.lastBackAtIndex || -1) === cur) return

            nextK.lastBackAtIndex = cur

            const idx = Math.max(0, cur - 1)
            const done = Array.isArray(nextK.toppingDone) ? nextK.toppingDone.slice() : []
            done[idx] = false
            nextK.toppingIndex = idx
            nextK.toppingDone = done

            delete nextK.backUsed

            await patch({ kitchen: nextK })
            return
        }


        if (kind === "topping") {
            const idx = toppingIndex
            const done = Array.isArray(toppingDone) ? toppingDone.slice() : []
            done[idx] = true
            await patch({
                kitchen: {
                    ...k,
                    toppingDone: done,
                    toppingIndex: idx + 1,
                    lastBackAtIndex: k.lastBackAtIndex,
                },
            })
            return
        }


        if (kind === "oven") {
            await patch({ kitchen: { ...k, ovenConfirmedAt: new Date().toISOString() } })
            return
        }

        if (kind === "cooked") {
            await patch({ kitchen: { ...k, cookedConfirmedAt: new Date().toISOString() } })
            return
        }
        if (kind === "done") {
            await patch({ status: "COMPLETED", kitchen: { ...k } })
            return
        }

    }

    return (
        <div className="order-card">
            <div className="order-top">
                <div className="order-left">
                    <div className="order-id">Order #{order.displayNumber || "?"}{order.subLabel || ""}</div>
                    <div className="order-name">Customer name: {order.customerName || "Guest"}</div>
                    <div className="order-time">
                        <span>Time ordered: {order.timeLabel || ""}</span>
                        <span className="dot">•</span>
                        <span className="order-elapsed">{elapsedLabel}</span>
                        <span className="dot">•</span>
                        <span className={`pill pill-${pill}`}>{pill}</span>
                        {cookedConfirmed && (
                            <>
                                <span className="dot">•</span>
                                <span className="pill pill-COOKED">COOKED</span>
                            </>
                        )}

                    </div>
                </div>

                <div className="order-right">
                    <div className="order-subid">Order ID: {order.number || order._id}</div>
                    <div className="order-total">${Number(order.total || 0).toFixed(2)}</div>
                </div>
            </div>

            <div className="order-items">
                {(order.items || []).map((it, i) => (
                    <div className="order-item" key={i}>
                        <div className="order-item-type">
                            {it.type || it.name || "Item"}
                            <span style={{ marginLeft: 10, opacity: .85, fontWeight: 800 }}>
                                (Qty {Number(it.qty || 1)})
                            </span>
                        </div>
                        <div className="order-item-desc">
                            {it?.size ? `${it.size}, ` : ""}
                            {it?.crust ? `${it.crust}, ` : ""}
                            {it?.sauce ? `${it.sauce}` : ""}
                        </div>
                    </div>
                ))}

            </div>

            {order.notes ? (<div className="order-notes">Notes: {order.notes}</div>) : null}

            <div className="order-notes" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Toppings</div>

                {toppings.length === 0 ? (<div>No toppings to confirm.</div>) : (
                    <>
                        <div className="order-items">
                            {toppings.map((t, idx) => (
                                <div className="order-item" key={idx}>
                                    <div className="order-item-desc">
                                        {toppingDone[idx] ? "✅ " : "⬜ "}{t.label}{idx === toppingIndex && !toppingDone[idx] ? " (NEXT)" : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="order-actions">
                {/* Start */}
                {isPending && (
                    <div className="order-actions-right">
                        <button type="button" className="btn btn-primary" onClick={onStart}>
                            Start Order
                        </button>
                    </div>
                )}

                {/* Mark done */}
                {isInProgress && showMarkReadyOnly && (
                    <div className="order-actions-right">
                        <button type="button" className="btn btn-primary" onClick={onMarkDone}>
                            Mark Done
                        </button>
                    </div>
                )}

                {/* workflow buttons */}
                {isInProgress && !showMarkReadyOnly && (
                    <div className="order-actions-left">
                        {isInProgress && order.notes && !instructionsConfirmed && (
                            <button className="btn btn-success" onClick={onConfirmInstructions}>
                                Confirm Instructions Read
                            </button>
                        )}

                        {canConfirmTopping() && (
                            <button className="btn btn-success" onClick={onConfirmTopping}>
                                Confirm Next Topping
                            </button>
                        )}

                        {canConfirmInOven() && (
                            <button className="btn btn-success" onClick={onConfirmInOven}>
                                Confirm In Oven
                            </button>
                        )}

                        {canConfirmCooked() && (
                            <button className="btn btn-success" onClick={onConfirmCooked}>
                                Confirm Cooked
                            </button>
                        )}

                        {canGoBack() && (
                            <button className="btn" onClick={onGoBackOne}>
                                Go Back One Step
                            </button>
                        )}

                        <button className="btn btn-ghost" onClick={onRestart}>
                            Restart
                        </button>

                        <button className="btn btn-danger" onClick={onCancel}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal open={confirm.open} title={confirm.title} text={confirm.text} onCancel={closeConfirm} onConfirm={handleConfirm} />
        </div>
    )
}
