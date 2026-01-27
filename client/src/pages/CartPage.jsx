import React, { useEffect, useMemo, useRef, useState } from "react"

import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext.jsx"
import { usePricing } from "../context/PricingContext.jsx"

export default function CartPage() {
	const { items, removeItem, setQty, clearCart, subtotal, tipAmount, setTipAmount } = useCart()
	const { pricing } = usePricing()
	const navigate = useNavigate()

	const taxRate = Number(pricing?.taxRate || 0)
	const tax = useMemo(() => +(Number(subtotal || 0) * taxRate).toFixed(2), [subtotal, taxRate])
	const total = useMemo(() => +(Number(subtotal || 0) + Number(tipAmount || 0) + tax).toFixed(2), [subtotal, tipAmount, tax])

	const holdRef = useRef(null)
	const [tipText, setTipText] = useState(String(tipAmount ?? "0.00"))
	const tipTextRef = useRef("0.00")

	useEffect(() => {
		tipTextRef.current = tipText
	}, [tipText])

	useEffect(() => {
		setTipText(String(Number(tipAmount || 0).toFixed(2)))
	}, [tipAmount])

	function stopHold() {
		if (holdRef.current) {
			clearInterval(holdRef.current)
			holdRef.current = null
		}
	}

	useEffect(() => () => stopHold(), [])

	function startHold(fn) {
		stopHold()
		fn()
		holdRef.current = setInterval(() => {
			fn()
		}, 120)
	}


	function parseTip(v) {
		const n = Number(v)
		return Number.isFinite(n) && n >= 0 ? n : 0
	}

	function setTip(value) {
		let s = String(value ?? "")
		s = s.replace(/[^\d.]/g, "")
		const p = s.split(".")
		if (p.length > 2) s = p[0] + "." + p.slice(1).join("")
		if (p[1]) s = p[0] + "." + p[1].slice(0, 2)
		if (s === "") s = "0"
		setTipText(s)
		const n = Number(s)
		setTipAmount(Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0)
	}

	function inc() {
		const n = parseTip(tipTextRef.current)
		setTip((n + 0.01).toFixed(2))
	}

	function dec() {
		const n = parseTip(tipTextRef.current)
		setTip(Math.max(0, n - 0.01).toFixed(2))
	}


	function tipFromPct(pct) {
		const base = Number(subtotal || 0)
		const tip = +(base * Number(pct || 0)).toFixed(2)
		setTip(tip.toFixed(2))
	}

	function goCheckout() {
		navigate("/checkout")
	}
	return (
		<div className="page">
			<div className="page-header">
				<h1 className="page-title center-title">Cart</h1>
				<p className="page-sub center-title">Review items, adjust quantities, add a tip, then checkout.</p>
			</div>

			{items.length === 0 ? (
				<div className="panel" style={{ textAlign: "center" }}>
					<p style={{ opacity: .85 }}>Your cart is empty.</p>
					<div style={{ marginTop: "12px" }}>
						<Link to="/menu" className="primary-btn">Browse Menu</Link>
					</div>
				</div>
			) : (
				<div className="cart-page">
					<div className="cart-grid">
						<section className="panel">
							<h2>Items</h2>

							<div className="order-list">
								{items.map(i => (
									<div key={i.id} className="order-card hover-box">
										<div className="order-top">
											<div>
												<div className="order-id">{i.name || "Item"}</div>

												<div className="order-meta">
													<span className="pill pill-RECEIVED">{(i.type || "item").toUpperCase()}</span>
													{i.display?.size ? (<><span className="dot">•</span><span>{i.display.size}</span></>) : null}
													{i.display?.crust ? (<><span className="dot">•</span><span>{i.display.crust}</span></>) : null}
													{i.display?.sauce ? (<><span className="dot">•</span><span>{i.display.sauce}</span></>) : null}
												</div>
											</div>

											<div className="order-total">${Number(i.unitPrice || 0).toFixed(2)}</div>
										</div>

										{i.display?.toppings && i.display.toppings.length > 0 ? (
											<div style={{ marginTop: "10px", opacity: .9 }}>
												<b>Toppings:</b> {i.display.toppings.join(", ")}
											</div>
										) : null}

										{i.notes ? (
											<div className="order-notes">
												<b>Notes:</b> {i.notes}
											</div>
										) : null}

										<div className="order-actions">
											<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
												<span style={{ opacity: .85 }}>Qty</span>
												<input type="number" min="1" value={i.qty || 1} onChange={e => setQty(i.id, e.target.value)} style={{ maxWidth: "90px" }} />
											</div>

											<div className="order-actions-split" />

											<button type="button" className="btn-danger" onClick={() => removeItem(i.id)}>Remove</button>
										</div>
									</div>
								))}
							</div>

							<div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
								<button type="button" className="btn-tip" onClick={clearCart}>Clear Cart</button>
								<Link to="/builder/pizza">Build Another Pizza</Link>
								<Link to="/menu">Menu</Link>
							</div>
						</section>

						<aside className="panel">
							<h2>Summary</h2>

							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span>Subtotal</span>
								<span>${Number(subtotal || 0).toFixed(2)}</span>
							</div>

							<div style={{ marginTop: "12px" }}>
								<div style={{ fontWeight: 700, marginBottom: "8px" }}>Tip</div>

								<div className="tip-presets">
									<button type="button" className="btn-tip" onClick={() => setTip("0.00")}>No tip</button>
									<button type="button" className="btn-tip" onClick={() => tipFromPct(.10)}>10%</button>
									<button type="button" className="btn-tip" onClick={() => tipFromPct(.15)}>15%</button>
									<button type="button" className="btn-tip" onClick={() => tipFromPct(.20)}>20%</button>
								</div>

								<div className="tip-input">
									<input
										type="text"
										inputMode="decimal"
										value={tipText}
										onChange={e => setTip(e.target.value)}
										onBlur={() => {
											const n = parseTip(tipText)
											setTip(n.toFixed(2))
										}}
									/>

									<div className="tip-arrows">

										<button
											type="button"
											style={{ touchAction: "none" }}
											onPointerDown={e => {
												e.preventDefault()
												e.currentTarget.setPointerCapture(e.pointerId)
												startHold(inc)
											}}
											onPointerUp={stopHold}
											onPointerCancel={stopHold}
											onLostPointerCapture={stopHold}
										>
											▲
										</button>

										<button
											type="button"
											style={{ touchAction: "none" }}
											onPointerDown={e => {
												e.preventDefault()
												e.currentTarget.setPointerCapture(e.pointerId)
												startHold(dec)
											}}
											onPointerUp={stopHold}
											onPointerCancel={stopHold}
											onLostPointerCapture={stopHold}
										>
											▼
										</button>

									</div>

								</div>
							</div>

							<div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", opacity: .95 }}>
								<span>Tip amount</span>
								<span>${Number(tipAmount || 0).toFixed(2)}</span>
							</div>

							<div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", opacity: .95 }}>
								<span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
								<span>${tax.toFixed(2)}</span>
							</div>

							<hr style={{ margin: "12px 0" }} />

							<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "18px" }}>
								<span>Total</span>
								<span>{"$" + total.toFixed(2)}</span>

							</div>

							<button
								type="button"
								onClick={goCheckout}
								style={{
									width: "100%",
									marginTop: "12px",
									padding: "10px",
									background: "#FFF2CC",
								}}
							>
								Checkout
							</button>
						</aside>
					</div >
				</div >
			)
			}
		</div >
	)
}
