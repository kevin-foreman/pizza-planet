import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

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
	const { items, subtotal, clearCart } = useCart()

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
		console.log('VALIDATE MSG:', msg)
		console.log('CARD DIGITS:', onlyDigits(cardNumber), onlyDigits(cardNumber).length)

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
					items,
					size: firstPizza?.display?.size || 'Medium',
					crust: firstPizza?.display?.crust || 'Hand Tossed',
					sauce: firstPizza?.display?.sauce || 'Tomato',
					notes: firstPizza?.notes || '',
					subtotal: Number(subtotal || 0),
					tax: 0,
					total: Number(subtotal || 0),
				},
			}

			console.log('CHECKOUT payload:', payload)

			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			if (!res.ok) {
				const j = await res.json().catch(() => null)
				throw new Error(j?.error || 'Checkout failed')
			}

			clearCart && clearCart()
			navigate('/order-confirmation')
		} catch (ex) {
			setErr(ex.message || 'Checkout failed')
		} finally {
			setBusy(false)
		}
	}


	return (
		<div style={{ padding: '16px', maxWidth: '520px', margin: '0 auto' }}>
			<h1>Checkout</h1>

			<div style={{ marginBottom: '12px' }}>
				<div>Items:{itemCount}</div>
				<div>Total: ${Number(subtotal || 0).toFixed(2)}</div>
			</div>

			<form onSubmit={onSubmit}>
				<label style={{ display: 'block', marginBottom: '10px' }}>
					Name on card
					<input value={name} onChange={e => setName(e.target.value)} />
				</label>

				<label style={{ display: 'block', marginBottom: '10px' }}>
					Card number
					<input
						inputMode="numeric"
						placeholder="1234123412341234"
						value={cardNumber}
						onChange={e => setCardNumber(e.target.value)}
					/>
				</label>

				<div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
					<label style={{ flex: 1 }}>
						MM
						<input
							inputMode="numeric"
							placeholder="01"
							value={expMonth}
							onChange={e => setExpMonth(e.target.value)}
						/>
					</label>

					<label style={{ flex: 1 }}>
						YY or YYYY
						<input
							inputMode="numeric"
							placeholder="27"
							value={expYear}
							onChange={e => setExpYear(e.target.value)}
						/>
					</label>
				</div>

				<div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
					<label style={{ flex: 1 }}>
						CVC
						<input
							inputMode="numeric"
							placeholder="123"
							value={cvc}
							onChange={e => setCvc(e.target.value)}
						/>
					</label>

					<label style={{ flex: 1 }}>
						ZIP
						<input
							inputMode="numeric"
							placeholder="809xx"
							value={zip}
							onChange={e => setZip(e.target.value)}
						/>
					</label>
				</div>

				{err ? (
					<div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #c33', borderRadius: '10px' }}>
						{err}
					</div>
				) : null}

				<button disabled={busy} type="submit" style={{ width: '100%' }}>
					{busy ? 'Processing...' : 'Place Order'}
				</button>

				<div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
					This is a demo checkout. Do not use real card details.
				</div>
			</form>
		</div>
	)
}
