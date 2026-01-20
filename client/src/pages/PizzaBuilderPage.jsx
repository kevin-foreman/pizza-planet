import React, { useEffect, useMemo, useState } from "react"
import { useCart } from "../context/CartContext.jsx"
import { useNavigate, useLocation } from "react-router-dom"
import { usePricing } from "../context/PricingContext.jsx"

export default function PizzaBuilderPage() {
	const { addItem } = useCart()
	const { pricing, toppings, error, refreshPricing } = usePricing()

	const navigate = useNavigate()
	const location = useLocation()

	useEffect(() => {
		refreshPricing()
	}, [location.pathname])

	const [showAddModal, setShowAddModal] = useState(false)
	const [sizeId, setSizeId] = useState("md")
	const [crustId, setCrustId] = useState("hand")
	const [sauceId, setSauceId] = useState("red")
	const [selected, setSelected] = useState({})
	const [notes, setNotes] = useState("")
	const [notice, setNotice] = useState("")

	const sizes = pricing?.sizes || []
	const crusts = pricing?.crusts || []
	const sauces = pricing?.sauces || []
	const basePrice = pricing?.basePrice ?? 10.99

	const size = useMemo(() => sizes.find(s => s.id === sizeId) || sizes[0] || { id: "md", label: "Medium", mult: 1 }, [sizes, sizeId])
	const crustLabel = useMemo(() => crusts.find(c => c.id === crustId)?.label || "", [crusts, crustId])
	const sauceLabel = useMemo(() => sauces.find(s => s.id === sauceId)?.label || "", [sauces, sauceId])

	const toppingLabels = useMemo(() => toppings.filter(t => selected[t.id]).map(t => t.label), [toppings, selected])

	const toppingsTotal = useMemo(() => {
		let sum = 0
		for (const t of toppings) {
			if (selected[t.id]) sum += Number(t.price || 0)
		}
		return sum
	}, [toppings, selected])

	const total = useMemo(() => Number(basePrice) * Number(size.mult || 1) + toppingsTotal, [basePrice, size, toppingsTotal])

	function toggleTopping(id) {
		setSelected(prev => {
			const next = { ...prev }
			next[id] = !next[id]
			return next
		})
	}

	function reset() {
		setSizeId('md')
		setCrustId('hand')
		setSauceId('red')
		setSelected({})
		setNotes('')
		setNotice('')
	}

	function addToCart() {
		if (!pricing) return
		addItem({
			id: crypto.randomUUID(),
			type: 'pizza',
			name: 'Custom Pizza',
			qty: 1,
			display: {
				size: size.label,
				crust: crustLabel,
				sauce: sauceLabel,
				toppings: toppingLabels,
			},
			config: {
				sizeId,
				crustId,
				sauceId,
				toppings: Object.keys(selected).filter(k => selected[k]),
			},
			unitPrice: Number(total.toFixed(2)),
			notes: notes.trim(),
		})

		setNotes('')
		setShowAddModal(true)
		setTimeout(() => setNotice(''), 1200)
	}

	if (!pricing) {
		return <div style={{ padding: '16px' }}>Loading…</div>
	}

	return (
		<div style={{ padding: '16px' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
				<h1>Build Your Pizza</h1>
				<div style={{ display: 'flex', gap: '10px' }}></div>
			</div>

			{error ? (
				<div style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '10px' }}>
					{error}
				</div>
			) : null}

			{notice ? (
				<div style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '10px' }}>
					{notice}
				</div>
			) : null}

			<div className="builder-grid">
				<section className="preview-panel">
					<h2>Options</h2>

					<div>
						<div className="option-title">Size</div>
						{sizes.map(s => (
							<label key={s.id} style={{ display: 'block' }}>
								<input type="radio" name="size" checked={sizeId === s.id} onChange={() => setSizeId(s.id)} />
								<span style={{ marginLeft: '8px' }}>{s.label}</span>
							</label>
						))}
					</div>

					<div>
						<div className="option-title">Crust</div>
						<select value={crustId} onChange={e => setCrustId(e.target.value)}>
							{crusts.map(c => (
								<option key={c.id} value={c.id}>{c.label}</option>
							))}
						</select>
					</div>

					<div>
						<div className="option-title">Sauce</div>
						<select value={sauceId} onChange={e => setSauceId(e.target.value)}>
							{sauces.map(s => (
								<option key={s.id} value={s.id}>{s.label}</option>
							))}
						</select>
					</div>

					<div className="toppings-block">
						<div className="option-title">Toppings</div>
						{toppings.map(t => {
							const id = `topping-${t.id}`
							return (
								<div key={t.id} className="topping-row">
									<input
										id={id}
										type="checkbox"
										checked={!!selected[t.id]}
										onChange={() => toggleTopping(t.id)}
									/>
									<label htmlFor={id} className="topping-label">{t.label}</label>
									<span className="topping-price">
										{t.price === 0 ? 'Free' : `$${t.price.toFixed(2)}`}
									</span>
								</div>
							)
						})}
					</div>

					<div>
						<div className="option-title">Special Instructions</div>
						<textarea
							placeholder="e.g. extra cheese, no onions, well done"
							value={notes}
							onChange={e => setNotes(e.target.value)}
							rows={3}
						/>
					</div>

					<button onClick={reset}>Reset</button>
				</section>

				<section className="preview-panel">
					<h2>Preview</h2>
					<div className="preview-details">
						<div><b>Size:</b> {size.label}</div>
						<div><b>Crust:</b> {crustLabel}</div>
						<div><b>Sauce:</b> {sauceLabel}</div>
						<div><b>Toppings:</b> {toppingLabels.length ? toppingLabels.join(', ') : 'None'}</div>
					</div>
				</section>

				<aside className="preview-panel">
					<h2>Summary</h2>

					<div>
						<span>Base × {size.label}</span>
						<span> ${(basePrice * size.mult).toFixed(2)}</span>
					</div>

					<div>
						<span>Toppings</span>
						<span> ${toppingsTotal.toFixed(2)}</span>
					</div>

					<hr />

					<div style={{ fontWeight: 800 }}>
						<span>Total </span>
						<span>${total.toFixed(2)}</span>
					</div>

					<button className="btn-add-cart" onClick={addToCart} style={{ marginTop: '12px', width: '100%' }}>
						Add to Cart
					</button>
				</aside>
			</div>

			{showAddModal && (
				<div className="modal-overlay" onClick={() => setShowAddModal(false)}>
					<div className="modal-card" onClick={e => e.stopPropagation()}>
						<h3 className="modal-title">Added to cart</h3>
						<p className="modal-text">Order more, or go to your cart?</p>
						<div className="modal-actions">
							<button onClick={() => { setShowAddModal(false); reset() }}>Order More</button>
							<button onClick={() => navigate('/cart')}>Go To Cart</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
