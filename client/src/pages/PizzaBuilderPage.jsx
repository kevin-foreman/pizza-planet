import React, { useEffect, useMemo, useState } from "react"
import { useCart } from "../context/CartContext.jsx"
import { useNavigate, useLocation } from "react-router-dom"
import { usePricing } from "../context/PricingContext.jsx"
import { useSearchParams } from "react-router-dom"

export default function PizzaBuilderPage() {
	const { addItem } = useCart()
	const { pricing, toppings, error, refreshPricing } = usePricing()
	const { items } = useCart()
	const itemCount = useMemo(() => items?.reduce((a, i) => a + (i.qty || 1), 0) || 0, [items])
	const navigate = useNavigate()
	const location = useLocation()
	const [sp] = useSearchParams()

	useEffect(() => {
		const size = sp.get("size")
		const crust = sp.get("crust")
		const sauce = sp.get("sauce")
		const tops = sp.get("tops")

		if (size) setSizeId(size)
		if (crust) setCrustId(crust)
		if (sauce) setSauceId(sauce)

		if (tops != null) {
			const next = {}
			for (const id of decodeURIComponent(tops).split(",").filter(Boolean)) {
				next[id] = true
			}
			setSelected(next)
		}
	}, [sp])




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

	const crustImg = useMemo(() => {
		const c = (pricing?.crusts || []).find(x => String(x.id) === String(crustId))
		return c?.image || ""
	}, [pricing, crustId])

	const sauceImg = useMemo(() => {
		const s = (pricing?.sauces || []).find(x => x.id === sauceId)
		return s?.image || ""
	}, [pricing, sauceId])

	const toppingPieces = useMemo(() => {
		const seed = hashStr(`${crustId}|${sauceId}|${Object.keys(selected).filter(k => selected[k]).sort().join(",")}`)
		const rng = mulberry32(seed)

		const piece = 12


		const spread = 47.5
		const gap = 1.05
		const minDist = (piece * gap) / spread

		const nodes = []
		for (const t of toppings) {
			if (!selected[t.id] || !t.image) continue

			const tid = String(t.id || "").toLowerCase()
			const tname = String(t.name || t.label || "").toLowerCase()
			const isPep = tid.includes("pep") || tname.includes("pep")

			let min = t.minPieces ?? 50
			let max = t.maxPieces ?? 80

			if (isPep) {
				min = 50
				max = 80
			}

			const count = min + Math.floor(rng() * (max - min + 1))

			const ringBias = 0.45
			let ringCount = Math.round(count * ringBias)
			let centerCount = count - ringCount

			const minCenter = Math.min(24, Math.floor(count * 0.55))
			if (centerCount < minCenter) {
				centerCount = minCenter
				ringCount = count - centerCount
			}

			const API = import.meta.env.VITE_API_URL || "http://localhost:4000"

			function imgUrl(p) {
				if (!p) return ""
				if (p.startsWith("http")) return p

				// only API-hosted assets
				if (p.startsWith("/uploads/")) return `${API}${p}`

				// everything else (like /Sprites/...) is frontend public
				return p
			}

			const ringSpots = genSpotsSeparated(ringCount, 0.72, 0.95, minDist, rng)
			const centerSpots = genSpotsSeparated(centerCount, 0.05, 0.75, minDist * 0.9, rng)
			const spots = [...ringSpots, ...centerSpots]

			for (const p of spots) {
				const r = Math.hypot(p.x, p.y)
				const a = Math.atan2(p.y, p.x)
				const aj = (rng() * 2 - 1) * 0.08
				const rj = (rng() * 2 - 1) * 0.04
				const rr = Math.min(1.06, Math.max(0.05, r + rj))
				const aa = a + aj
				p.x = Math.cos(aa) * rr
				p.y = Math.sin(aa) * rr
			}

			for (let i = 0; i < spots.length; i++) {
				const p = spots[i]
				nodes.push(
					<img
						key={`${t.id}-${i}`}
						className={`topping-piece topping-${t.id} ${isPep ? "topping-pep" : ""}`}
						src={imgUrl(t.image)}
						alt=""
						style={{
							left: `calc(50% + ${p.x * 37.5}%)`,
							top: `calc(50% + ${p.y * 37.5}%)`,
							width: `${piece}%`,
							height: `${piece}%`,
							transform: `translate(-50%,-50%)rotate(${p.rot}deg)scale(${p.sc})`,
						}}

					/>
				)
			}
		}
		return nodes
	}, [toppings, selected, crustId, sauceId])






	const total = useMemo(() => Number(basePrice) * Number(size.mult || 1) + toppingsTotal, [basePrice, size, toppingsTotal])
	function mulberry32(a) {
		return function () {
			let t = a += 0x6D2B79F5
			t = Math.imul(t ^ t >>> 15, t | 1)
			t ^= t + Math.imul(t ^ t >>> 7, t | 61)
			return ((t ^ t >>> 14) >>> 0) / 4294967296
		}
	}

	function hashStr(s) {
		let h = 2166136261
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i)
			h = Math.imul(h, 16777619)
		}
		return h >>> 0
	}

	//zone is a ring
	function genSpotsSeparated(n, inner, outer, minDist, rng) {
		const out = []
		const maxAttempts = n * 120
		let attempts = 0
		let d = minDist

		while (out.length < n && attempts < maxAttempts) {
			attempts++

			const idx = out.length
			const slice = (Math.PI * 2) / n
			const a = idx * slice + (rng() * 2 - 1) * slice * 0.35

			const u = rng()
			const r = Math.sqrt(inner * inner + (outer * outer - inner * inner) * u)

			const x = Math.cos(a) * r
			const y = Math.sin(a) * r

			let ok = true
			for (let i = 0; i < out.length; i++) {
				const dx = x - out[i].x
				const dy = y - out[i].y
				const s = (out[i].sc + 1) * 0.5
				if (dx * dx + dy * dy < (d * s) * (d * s)) { ok = false; break }
			}

			if (ok) {
				out.push({
					x,
					y,
					rot: (rng() * 2 - 1) * 35,
					sc: 0.92 + rng() * 0.22,
				})
			}

			if (attempts % 120 === 0 && out.length < n) {
				d *= 0.97
			}

		}
		let minR = 999, maxR = 0
		for (const p of out) {
			const rr = Math.hypot(p.x, p.y)
			if (rr < minR) minR = rr
			if (rr > maxR) maxR = rr
		}


		return out
	}



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
		<div style={{ padding: '0px' }}>
			<div className="hero">
				<h1>Build Your Pizza</h1>
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

					<button className="btn-reset" onClick={reset}>Reset</button>
				</section>

				<section className="preview-panel">
					<h2>Preview</h2>

					<div className="pizza-stage">
						<div className={`pizza-visualizer crust-${crustId}`}>
							{!!crustImg && <img className="pizza-layer base" src={crustImg} alt="" />}
							{!!sauceImg && <img className="pizza-layer sauce" src={sauceImg} alt="" />}
							{toppingPieces}
						</div>

					</div>

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

			{
				showAddModal && (
					<div className="modal-overlay" onClick={() => setShowAddModal(false)}>
						<div className="modal-card" onClick={e => e.stopPropagation()}>
							<h3 className="modal-title">Added to cart</h3>
							<p className="modal-text">Order more, or go to your cart?</p>
							<div className="modal-actions">
								<button onClick={() => { setShowAddModal(false); reset() }}>Order More</button>
								<button className="btn-go-cart" onClick={() => navigate('/cart')}>
									<span className="cart-badge">({itemCount})</span>
									<span className="cart-emoji">🛒</span>
									Go To Cart
								</button>
							</div>
						</div>
					</div>
				)
			}
		</div >
	)
}
