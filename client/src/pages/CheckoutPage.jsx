import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { jsonFetch } from "../api/http.js"

function onlyDigits(s) {
	return (s || '').replace(/\D/g, '')
}

function isValidCardNumber(num) {
	// Luhn check (optional but nice)
	const s = onlyDigits(num)
	if (s.length < 13 || s.length > 19) return false
	let sum = 0
	let alt = false
	for (let i = s.length - 1; i >= 0; i--) {
		let n = s.charCodeAt(i) - 48
		if (alt) {
			n *= 2
			if (n > 9) n -= 9
		}
		sum += n
		alt = !alt
	}
	return (sum % 10) === 0
}

function parseExp(mm, yy) {
	const m = parseInt(mm, 10)
	let y = parseInt(yy, 10)
	if (!Number.isFinite(m) || !Number.isFinite(y)) return { ok: false }
	if (m < 1 || m > 12) return { ok: false }
	// allow YY or YYYY
	if (yy.length === 2) y = 2000 + y
	if (yy.length !== 2 && yy.length !== 4) return { ok: false }

	const now = new Date()
	const exp = new Date(y, m, 1) // first day of next month
	return { ok: exp > now, month: m, year: y }
}

export default function CheckoutPage() {
	const navigate = useNavigate()
	const { items, subtotal, total, tipAmount, clearCart } = useCart()

	const [cardNumber, setCardNumber] = useState('')
	const [expMonth, setExpMonth] = useState('')
	const [expYear, setExpYear] = useState('')
	const [cvc, setCvc] = useState('')
	const [zip, setZip] = useState('')
	const [name, setName] = useState('')
	const [busy, setBusy] = useState(false)
	const [err, setErr] = useState('')

	const itemCount = useMemo(() => items?.reduce((a, i) => a + (i.qty || 1), 0) || 0, [items])

	function validate() {
		const cn = onlyDigits(cardNumber)
		const cv = onlyDigits(cvc)
		const zp = onlyDigits(zip)

		if (!items || items.length === 0) return 'Cart is empty'
		if (!name.trim()) return 'Name is required'
		if (!cn || cn.length < 13 || cn.length > 19) return 'Card number must be 13-19 digits'
		// if you want "any digits of the right amount" only, comment out the next line
		if (!isValidCardNumber(cn)) return 'Card number looks invalid'
		const ex = parseExp(expMonth, expYear)
		if (!ex.ok) return 'Expiration date is invalid or expired'
		if (cv.length !== 3 && cv.length !== 4) return 'CVC must be 3 or 4 digits'
		if (zp.length !== 5 && zp.length !== 9) return 'ZIP must be 5 or 9 digits'
		return ''
	}

	async function onSubmit(e) {
		e.preventDefault()
		setErr('')
		const msg = validate()


		if (msg) { setErr(msg); return }

		setBusy(true)
		try {
			const cn = onlyDigits(cardNumber)
			const firstPizza = items.find(i => i.type === 'pizza')

			const payload = {
				customer: {
					name: name.trim(),
					zip: onlyDigits(zip),
				},
				payment: {
					last4: cn.slice(-4),
					expMonth: expMonth.trim(),
					expYear: expYear.trim(),
				},
				order: {
					items: items.map(i => ({
						name: i.name,
						qty: Number(i.qty || 1),
						unitPrice: Number(i.unitPrice || 0),
						type: i.type || 'item',
						display: i.display || null,
						config: i.config || null,
						notes: i.notes || '',
						deliveryNotes: i.deliveryNotes || "",

					})),
					size: firstPizza?.display?.size || 'Medium',
					crust: firstPizza?.display?.crust || 'Hand Tossed',
					sauce: firstPizza?.display?.sauce || 'Tomato',
					notes: firstPizza?.notes || "",
					deliveryNotes: firstPizza?.deliveryNotes || "",

					subtotal: Number(subtotal || 0),
					tip: Number(tipAmount || 0),
					tax: 0,
					total: Number(total || subtotal || 0),
				},


			}



			const res = await jsonFetch("/api/checkout", {
				method: "POST",
				body: JSON.stringify(payload),
			})


			if (!res.ok) {
				const j = await res.json().catch(() => null)
				throw new Error(j?.error || 'Checkout failed')
			}

			clearCart && clearCart()
			navigate(`/order-confirmation/${res.orderId}`)

		} catch (ex) {
			setErr(ex.message || 'Checkout failed')
		} finally {
			setBusy(false)
		}
	}


	return (
		<div className="page checkout-page">
			<div className="checkout-grid">
				<aside className="panel checkout-">
					<h2>Cart</h2>

					{items.length === 0 ? (
						<div style={{ opacity: .85 }}>Your cart is empty.</div>
					) : (
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

									{i.deliveryNotes ? (
										<div className="order-notes">
											<b>Delivery Notes:</b> {i.deliveryNotes}
										</div>
									) : null}


									<div style={{ marginTop: "10px", opacity: .85 }}>
										Qty: <b>{i.qty || 1}</b>
									</div>
								</div>
							))}
						</div>
					)}

					<hr style={{ margin: "12px 0" }} />

					<div style={{ display: "flex", justifyContent: "space-between" }}>
						<span>Subtotal</span>
						<span>${Number(subtotal || 0).toFixed(2)}</span>
					</div>

					<div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
						<span>Tip</span>
						<span>${Number(tipAmount || 0).toFixed(2)}</span>
					</div>

					<div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontWeight: 800, fontSize: "18px" }}>
						<span>Total</span>
						<span>${Number(total || subtotal || 0).toFixed(2)}</span>
					</div>
				</aside>

				<section className="panel checkout-pay">
					<h2>Payment</h2>

					<form onSubmit={onSubmit}>
						<div className="checkout-details">
							Name on card
							<input
								placeholder="Name on card"
								value={name}
								onChange={e => {
									let v = e.target.value
									if (!/^[a-zA-Z .'-]*$/.test(v)) return
									setName(v)
								}}
							/>
						</div>

						<div className="checkout-details">
							Card number
							<input
								inputMode="numeric"
								placeholder="1234 1234 1234 1234"
								value={cardNumber}
								onChange={e => {
									let d = (e.target.value || "").replace(/\D/g, "")
									if (d.length > 19) return
									setCardNumber(d)
								}}
							/>
						</div>

						<div className="checkout-details">
							<div className="checkout-row">
								<div className="checkout-field">
									<div className="checkout-label">MM</div>
									<input
										inputMode="numeric"
										placeholder="01"
										value={expMonth}
										onChange={e => {
											let v = (e.target.value || "").replace(/\D/g, "")
											if (v.length > 2) return
											if (v.length === 2) {
												const n = Number(v)
												if (n < 1 || n > 12) return
											}
											setExpMonth(v)
										}}
									/>
								</div>

								<div className="checkout-field">
									<div className="checkout-label">YY or YYYY</div>
									<input
										inputMode="numeric"
										placeholder="27"
										value={expYear}
										onChange={e => {
											let v = (e.target.value || "").replace(/\D/g, "")
											if (v.length > 4) return
											if (v.length === 4) {
												const y = Number(v)
												if (y < 2026) return
											}
											setExpYear(v)
										}}
									/>
								</div>
							</div>
						</div>

						<div className="checkout-details">
							<div className="checkout-row">
								<div className="checkout-field">
									<div className="checkout-label">CVC</div>
									<input
										inputMode="numeric"
										placeholder="123"
										value={cvc}
										onChange={e => {
											let v = (e.target.value || "").replace(/\D/g, "")
											if (v.length > 4) return
											setCvc(v)
										}}
									/>
								</div>

								<div className="checkout-field">
									<div className="checkout-label">ZIP</div>
									<input
										inputMode="numeric"
										placeholder="12345 or 12345-6789"
										value={zip}
										onChange={e => {
											let d = (e.target.value || "").replace(/\D/g, "")
											if (d.length > 9) d = d.slice(0, 9)
											let v = d.length <= 5 ? d : (d.slice(0, 5) + "-" + d.slice(5))
											setZip(v)
										}}
									/>
								</div>
							</div>
						</div>

						{err ? (
							<div style={{ marginBottom: "10px", padding: "10px", border: "1px solid #c33", borderRadius: "10px" }}>
								{err}
							</div>
						) : null}

						<button type="submit" disabled={busy} className="btn btn-primary">
							{busy ? "Processing..." : "Place Order"}
						</button>

						<div className="checkout-demo">
							This is a demo checkout. Do not use real card details.
						</div>
					</form>
				</section>
			</div>
		</div>
	)
}
