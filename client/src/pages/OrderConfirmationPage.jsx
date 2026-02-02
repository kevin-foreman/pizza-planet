import React, { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { jsonFetch } from "../api/http.js"
import { buildReceiptText, downloadTextFile } from "../utils/receipt.js"
function money(n) {
	const x = Number(n || 0)
	return x.toFixed(2)
}
function norm(s) {
	return String(s || "").trim()
}

function getItemType(it) {
	const t = norm(it?.type || it?.kind || "")
	if (t) return t
	const n = norm(it?.name || "")
	if (n.toLowerCase().includes("pizza")) return "Pizza"
	return n || "Item"
}

function getItemDisplay(it) {
	const d = it?.display || {}
	const cfg = it?.config || it?.options || {}
	const pizza = it?.pizza || {}
	const sel = it?.selected || {}

	// human-readable display labels first
	const size = norm(d.size || it?.sizeLabel || cfg.sizeLabel || pizza.sizeLabel || it?.size)
	const crust = norm(d.crust || it?.crustLabel || cfg.crustLabel || pizza.crustLabel || it?.crust)
	const sauce = norm(d.sauce || it?.sauceLabel || cfg.sauceLabel || pizza.sauceLabel || it?.sauce)

	// Base/name
	const base = norm(d.base || it?.baseName || it?.presetName || it?.name || pizza.name || "Pizza")

	// Toppings (names)
	const topsRaw =
		Array.isArray(d.toppings) ? d.toppings :
			Array.isArray(it?.toppings) ? it.toppings :
				Array.isArray(cfg.toppings) ? cfg.toppings :
					Array.isArray(pizza.toppings) ? pizza.toppings :
						Array.isArray(sel.toppings) ? sel.toppings :
							[]

	const toppings = topsRaw.map(norm).filter(Boolean)

	return { base, size, crust, sauce, toppings }
}



function itemKey(it) {
	const d = getItemDisplay(it)

	const base = d.base || "Pizza"
	const size = d.size || ""
	const crust = d.crust || ""
	const sauce = d.sauce || ""

	const tops = [...(d.toppings || [])].sort().join("|")
	const notes = norm(it?.notes)
	const deliveryNotes = norm(it?.deliveryNotes)
	return [
		base,
		size,
		crust,
		sauce,
		tops,
		notes,
		deliveryNotes
	].join("::")
}


function groupItems(items) {
	const m = new Map()
	for (const it of (items || [])) {
		const k = itemKey(it)
		const prev = m.get(k)
		if (prev) prev.qty += Number(it?.qty || 1)
		else m.set(k, { it, qty: Number(it?.qty || 1) })
	}
	return Array.from(m.values())
}


function TrackOrderCard({ orderId }) {
	if (!orderId) return null
	return (
		<div className="pp-card track-card">
			<div className="track-card-head">
				<div className="track-card-title">Track your order</div>
				<div className="track-card-sub">Live kitchen progress</div>
			</div>

			<div className="track-card-row">
				<div className="muted">Order ID: </div>
				<div className="mono">{orderId}</div>
			</div>

			<div className="track-card-actions">
				<Link className="primary-btn" to={`/order/${orderId}`}>Open tracker</Link>
			</div>
		</div>
	)
}
function buildShareMessage({ orderId, track }) {
	const status = String(track?.status || "").toUpperCase()
	const total = money(track?.total)

	// Keep it short. Most platforms will truncate long text.
	const items = Array.isArray(track?.items) ? track.items : []
	const grouped = groupItems(items)
	const topLine = grouped
		.slice(0, 3)
		.map(g => {
			const d = getItemDisplay(g.it)
			return `${g.qty}x ${d.base}${d.size ? ` (${d.size})` : ""}`
		})
		.join(", ")

	const more = grouped.length > 3 ? ` +${grouped.length - 3} more` : ""

	return `Pizza Planet 🍕 Order ${orderId} ${status ? `(${status}) ` : ""}- ${topLine}${more}. Total: $${total}`
}

function ShareButtons({ orderId, track }) {
	if (!orderId) return null

	const pageUrl = window.location.href
	const title = "Pizza Planet Order"
	const text = buildShareMessage({ orderId, track })

	const encodedUrl = encodeURIComponent(pageUrl)
	const encodedText = encodeURIComponent(text)
	const encodedTitle = encodeURIComponent(title)

	const shareLinks = {
		x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
		facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
		linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
		reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
		email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
	}

	async function handleNativeShare() {
		try {
			if (!navigator.share) return
			await navigator.share({ title, text, url: pageUrl })
		} catch {
			// user canceled or share failed; ignore
		}
	}

	return (
		<div className="pp-card share-card">
			<div className="share-card-title">Share your order</div>
			<div className="share-copy">Show off your Pizza Planet haul 🍕</div>

			<div className="share-actions">
				{navigator.share ? (
					<button type="button" className="primary-btn" onClick={handleNativeShare}>
						Share
					</button>
				) : null}

				<a className="share-btn" href={shareLinks.x} target="_blank" rel="noreferrer">X </a>
				<a className="share-btn" href={shareLinks.facebook} target="_blank" rel="noreferrer">Facebook </a>
				<a className="share-btn" href={shareLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn </a>
				<a className="share-btn" href={shareLinks.reddit} target="_blank" rel="noreferrer">Reddit </a>
				<a className="share-btn" href={shareLinks.email}>Email </a>
			</div>

			<div className="share-copy">
				<input className="share-input" readOnly value={pageUrl} />
				<button
					type="button"
					className="primary-btn"
					onClick={() => navigator.clipboard?.writeText(pageUrl)}
				>
					Copy link
				</button>
			</div>
		</div>
	)
}

export default function OrderConfirmationPage() {
	const { id } = useParams()
	const orderId = String(id || "")

	const [track, setTrack] = useState(null)
	const [err, setErr] = useState("")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let alive = true
			; (async () => {
				try {
					setErr("")
					setLoading(true)
					const d = await jsonFetch(`/api/orders/${orderId}/track`)
					if (!alive) return
					setTrack(d || null)
				} catch (e) {
					if (!alive) return
					setErr(String(e?.message || e))
				} finally {
					if (!alive) return
					setLoading(false)
				}
			})()
		return () => { alive = false }
	}, [orderId])

	const receiptText = useMemo(() => {
		return buildReceiptText({ orderId, track, now: Date.now() })
	}, [orderId, track])

	return (
		<div className="page order-confirm">
			<div className="receipt-panel">
				<h1>Order Confirmed</h1>
				<p className="share-copy">Thanks! Your order has been placed.</p>

				{err && (
					<div className="pp-card">
						<div className="muted">Error</div>
						<div>{err}</div>
					</div>
				)}

				<TrackOrderCard orderId={orderId} />

				<ShareButtons orderId={orderId} track={track} />

				<div style={{ height: 14 }} />

				{loading && (
					<div className="pp-card">
						<div className="muted">Loading receipt...</div>
					</div>
				)}

				{track && !loading && (
					<div className="pp-card receipt-card">

						<div className="receipt-title">Receipt</div>

						<div className="receipt-meta-left">
							<div className="muted">Status: {String(track.status || "").toUpperCase()}</div>
							<div className="muted">Placed: {new Date(track.createdAt || track.placedAt || track.updatedAt || Date.now()).toLocaleString()}</div>
							{track?.customerName ? <div className="muted">Name: {track.customerName}</div> : null}
							{track?.email ? <div className="muted">Email: {track.email}</div> : null}
						</div>

						<div className="receipt-items">
							<div className="receipt-items-title">Items</div>
							<div className="receipt-line" />
							{groupItems(Array.isArray(track?.items) ? track.items : []).map((g, idx) => {
								const it = g.it
								const qty = g.qty
								if (idx === 0) {
									console.log("TRACK ITEM", it)
								}
								const d = it?.display || {}
								const base = String(it?.baseName || it?.presetName || it?.name || d.base || "Pizza")

								const tops = Array.isArray(d.toppings) ? d.toppings : (Array.isArray(it?.toppings) ? it.toppings : [])
								const toppings = tops.map(t => String(t || "").trim()).filter(Boolean)

								return (
									<div className="receipt-item" key={idx}>
										<div className="receipt-item-name">{qty}x {base}</div>

										<div className="receipt-item-meta">
											<div>Size: {d.size || "—"}, Crust: {d.crust || "—"}, Sauce: {d.sauce || "—"}</div>

										</div>

										{toppings.length ? (
											<div className="receipt-item-tops">
												Toppings: {toppings.join(", ")}
											</div>
										) : null}

										{it?.notes ? (
											<div className="receipt-item-notes">
												<strong>Notes:</strong>
												<div className="receipt-notes-box">
													{it.notes}
												</div>
											</div>
										) : null}

										{it?.deliveryNotes ? (
											<div className="receipt-item-notes">
												<strong>Notes:</strong>
												<div className="receipt-notes-box">
													{it.deliveryNotes}
												</div>
											</div>
										) : null}
									</div>
								)
							})}

						</div>

						<div className="receipt-line" />


						<div className="receipt-grid">
							<div className="muted">Subtotal</div>
							<div>${money(track?.subtotal)}</div>

							<div className="muted">Tax</div>
							<div>${money(track?.tax)}</div>

							<div className="muted">Tip</div>
							<div>${money(track?.tip)}</div>
						</div>

						<div className="receipt-foot">
							<div className="receipt-total-row">
								<div className="muted"><strong>Total</strong></div>
								<div className="mono"><strong>${money(track?.total)}</strong></div>
							</div>

							<button
								type="button"
								className="primary-btn download"
								disabled={!track || loading}
								onClick={() => downloadTextFile(
									`pizza-planet-receipt-${orderId}.txt`,
									receiptText
								)}
							>
								Download
							</button>
						</div>
					</div>
				)}

			</div>
		</div>
	)
}
