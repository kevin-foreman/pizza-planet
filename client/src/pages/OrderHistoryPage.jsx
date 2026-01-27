import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { jsonFetch } from "../api/http.js"

export default function OrderHistoryPage() {
	const [data, setData] = useState({ active: [], archived: [] })
	const [err, setErr] = useState("")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let alive = true
			; (async () => {
				try {
					setErr("")
					setLoading(true)
					const d = await jsonFetch("/api/orders/mine")
					if (!alive) return
					setData(d || { active: [], archived: [] })
				} catch (e) {
					if (!alive) return
					setErr(String(e?.message || e))
				} finally {
					if (!alive) return
					setLoading(false)
				}
			})()
		return () => { alive = false }
	}, [])

	return (
		<div className="page orders-history">
			<div className="panel">
				<div className="panel-head">
					<h2>Your Orders</h2>
					<Link to="/" className="link-btn">Home</Link>
				</div>

				{loading && <div className="muted">Loading...</div>}
				{!!err && <div className="error">{err}</div>}

				{!!data?.active?.length && (
					<>
						<h3 style={{ marginTop: 10 }}>Active</h3>

						<div className="active-wrap">
							{data.active.map(o => {
								const qty = o.qty || 1
								const size = o.size || "md"
								const crust = o.crust || ""
								const sauce = o.sauce || ""
								const tops = Array.isArray(o.toppings) ? o.toppings : []
								const topText = tops.length ? tops.join(",") : "none"

								return (
									<div className="track-card active-card" key={o.orderId}>
										<div className="active-top">
											<div className="mono">Order#{String(o.orderId || "").slice(-6).toUpperCase()}</div>
											<div className={`status ${String(o.status || "")}`}>{String(o.status || "")}</div>
										</div>

										<div className="active-mid">
											<div className="active-lines">
												<div className="line mono">
													qty:{qty} {size} {crust} {sauce}
												</div>
												<div className="line muted">
													toppings:{topText}
												</div>
											</div>

											<div className="active-price">
												${Number(o.total || 0).toFixed(2)}
											</div>
										</div>

										<div className="active-actions">
											<Link className="primary-btn" to={`/order/${o.orderId}`}>Track</Link>
										</div>
									</div>
								)
							})}

						</div>
					</>
				)}


				{!!data?.archived?.length && (
					<>
						<h3 style={{ marginTop: 18 }}>Past Orders</h3>
						<div className="track-list">
							{data.archived.map(o => {
								const shortId = String(o.orderId || "").slice(-6).toUpperCase()
								return (
									<div
										className="track-card clickable"
										key={`${o.orderId}-${o.archivedAt || ""}`}
										onClick={() => navigate(`/order/${o.orderId}`)}
									>
										<div className="track-title">
											<div className="mono">Order#{shortId}</div>
											<div className={`status ${o.status}`}>{o.status}</div>
										</div>
										<div className="track-meta">
											<div className="muted">Placed</div>
											<div className="mono">
												{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</>
				)}


				{!loading && !err && !data.active.length && !data.archived.length && (
					<div className="muted">No orders yet.</div>
				)}
			</div>
		</div>
	)
}
