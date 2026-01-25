import React, { useEffect, useMemo, useState } from "react"
import { jsonFetch } from "../../api/http.js"
import { usePricing } from "../../context/PricingContext.jsx"

function toNum(v, fallback = 0) {
	const n = Number(v)
	if (Number.isFinite(n)) return n
	return fallback
}

export default function AdminPricingPage() {
	const { refreshPricing } = usePricing()
	const [pricing, setPricing] = useState(null)
	const [toppings, setToppings] = useState([])
	const [filter, setFilter] = useState("")
	const [msg, setMsg] = useState("")
	const [err, setErr] = useState("")

	useEffect(() => {
		; (async () => {
			try {
				setErr("")
				const [p, t] = await Promise.all([
					jsonFetch("/api/pricing"),
					jsonFetch("/api/toppings"),
				])
				setPricing(p || null)
				setToppings(Array.isArray(t) ? t : [])
			} catch (e) {
				setErr(String(e?.message || e))
			}
		})()
	}, [])

	const filteredTops = useMemo(() => {
		const q = String(filter || "").toLowerCase().trim()
		if (!q) return toppings
		return toppings.filter(t => {
			const name = String(t?.name || "").toLowerCase()
			return name.includes(q)
		})
	}, [toppings, filter])

	async function savePricing() {
		try {
			setErr("")
			setMsg("")
			const payload = {
				basePrice: toNum(pricing?.basePrice, 10.99),
				sizes: (pricing?.sizes || []).map(s => ({
					id: String(s.id || ""),
					label: String(s.label || ""),
					mult: toNum(s.mult, 1),
				})),
				crusts: (pricing?.crusts || []).map(c => ({
					id: String(c.id || ""),
					label: String(c.label || ""),
					image: String(c.image || ""),
					price: toNum(c.price, 0),
				})),
				sauces: (pricing?.sauces || []).map(s => ({
					id: String(s.id || ""),
					label: String(s.label || ""),
					image: String(s.image || ""),
					price: toNum(s.price, 0),
				})),

			}
			await jsonFetch("/api/pricing", {
				method: "PUT",
				body: JSON.stringify(payload),
			})

			await refreshPricing()
			setMsg("saved")
		} catch (e) {
			setErr(String(e?.message || e))
		}
	}

	async function redoToppingImage(id, file) {
		try {
			setErr("")
			setMsg("")
			const fd = new FormData()
			fd.append("image", file)
			await jsonFetch(`/api/toppings/${encodeURIComponent(id)}/image`, {
				method: "POST",
				body: fd,
			})
			await refreshPricing()

			//refresh toppings list so the UI stays in sync (same path, but safe)
			const t = await jsonFetch("/api/toppings")
			setToppings(Array.isArray(t) ? t : [])

			setMsg("image replaced")
		} catch (e) {
			setErr(String(e?.message || e))
		}
	}

	async function saveTopping(id, patch) {
		try {
			setErr("")
			setMsg("")
			await jsonFetch(`/api/toppings/${encodeURIComponent(id)}`, {
				method: "PATCH",
				body: JSON.stringify({
					...(patch.image !== undefined ? { image: String(patch.image || "") } : {}),
					...(patch.price !== undefined ? { price: toNum(patch.price, 0) } : {}),
				}),
			})
			await refreshPricing()
			setMsg("saved")
		} catch (e) {
			setErr(String(e?.message || e))
		}
	}


	if (!pricing) return (
		<div className="admin-pricing">
			<h1>Pricing</h1>
			{err ? <div className="error">{err}</div> : <div>loading...</div>}
		</div>
	)

	return (
		<div className="admin-pricing">
			<h1>Pricing</h1>

			{err && <div className="error">{err}</div>}
			{msg && <div className="ok">{msg}</div>}

			<div className="card">
				<div className="admin-grid baseprice">
					<div className="label">Base price</div>
					<input
						value={String(pricing.basePrice ?? "")}
						onChange={e => setPricing(p => ({ ...p, basePrice: e.target.value }))}
					/>
				</div>
				<h2>Sizes</h2>
				<div className="admin-grid head sizes">
					<div>Code</div>
					<div>Name</div>
					<div>Multiplier</div>
				</div>

				{(pricing.sizes || []).map((s, idx) => (
					<div className="admin-grid sizes" key={s.id || idx}>
						<input
							className="small"
							value={String(s.id || "")}
							onChange={e => {
								const v = e.target.value
								setPricing(p => {
									const next = [...(p.sizes || [])]
									next[idx] = { ...next[idx], id: v }
									return { ...p, sizes: next }
								})
							}}
						/>
						<input
							value={String(s.label || "")}
							onChange={e => {
								const v = e.target.value
								setPricing(p => {
									const next = [...(p.sizes || [])]
									next[idx] = { ...next[idx], label: v }
									return { ...p, sizes: next }
								})
							}}
						/>
						<input
							className="small"
							value={String(s.mult ?? "")}
							onChange={e => {
								const v = e.target.value
								setPricing(p => {
									const next = [...(p.sizes || [])]
									next[idx] = { ...next[idx], mult: v }
									return { ...p, sizes: next }
								})
							}}
						/>
					</div>
				))}
				<div className="admin-grid head crust">
					<div>Code</div>
					<div>Name</div>
					<div>Image path</div>
					<div>Price</div>
				</div>

				<h2>Crusts</h2>
				{(pricing.crusts || []).map((c, idx) => (
					<div className="admin-grid crust" key={c.id || idx}>
						<input value={String(c.id || "")} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.crusts || [])]
								next[idx] = { ...next[idx], id: v }
								return { ...p, crusts: next }
							})
						}} />

						<input value={String(c.label || "")} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.crusts || [])]
								next[idx] = { ...next[idx], label: v }
								return { ...p, crusts: next }
							})
						}} />

						<input value={String(c.image || "")} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.crusts || [])]
								next[idx] = { ...next[idx], image: v }
								return { ...p, crusts: next }
							})
						}} />

						<input value={String(c.price ?? 0)} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.crusts || [])]
								next[idx] = { ...next[idx], price: v }
								return { ...p, crusts: next }
							})
						}} />
					</div>
				))}

				<div className="admin-grid head sauce">
					<div>Code</div>
					<div>Name</div>
					<div>Image path</div>
					<div>Price</div>
				</div>

				<h2>Sauces</h2>
				{(pricing.sauces || []).map((s, idx) => (
					<div className="admin-grid sauce" key={s.id || idx}>
						<input value={String(s.id || "")} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.sauces || [])]
								next[idx] = { ...next[idx], id: v }
								return { ...p, sauces: next }
							})
						}} />

						<input value={String(s.label || "")} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.sauces || [])]
								next[idx] = { ...next[idx], label: v }
								return { ...p, sauces: next }
							})
						}} />

						<input value={String(s.image || "")} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.sauces || [])]
								next[idx] = { ...next[idx], image: v }
								return { ...p, sauces: next }
							})
						}} />

						<input value={String(s.price ?? 0)} onChange={e => {
							const v = e.target.value
							setPricing(p => {
								const next = [...(p.sauces || [])]
								next[idx] = { ...next[idx], price: v }
								return { ...p, sauces: next }
							})
						}} />
					</div>
				))}


				<button type="button" onClick={savePricing}>Save pricing</button>
			</div>

			<div className="search">

				<input
					placeholder="search toppings..."
					value={filter}
					onChange={e => setFilter(e.target.value)}
				/>
				<h2>Toppings</h2>

				<div className="admin-grid head toppings">
					<div>Name</div>
					<div>Image path</div>
					<div>Price</div>
					<div></div>
				</div>

				<div className="tops">
					{filteredTops.map(t => {
						const tid = String(t._id || t.id)

						return (
							<div className="admin-grid toppings" key={tid}>
								<div className="name">{t.name}</div>

								<input
									value={String(t.image || "")}
									onChange={e => {
										const v = e.target.value
										setToppings(prev => prev.map(x =>
											String(x._id || x.id) === tid ? { ...x, image: v } : x
										))
									}}
									onBlur={e => saveTopping(tid, { image: e.target.value })}
								/>

								<input
									className="small"
									value={String(t.price ?? 0)}
									onChange={e => {
										const v = e.target.value
										setToppings(prev => prev.map(x =>
											String(x._id || x.id) === tid ? { ...x, price: v } : x
										))
									}}
									onBlur={e => saveTopping(tid, { price: e.target.value })}
								/>

								<input
									type="file"
									accept="image/*"
									id={`redo-${tid}`}
									style={{ display: "none" }}
									onChange={e => {
										const file = e.target.files?.[0]
										if (!file) return
										redoToppingImage(tid, file)
										e.target.value = ""
									}}
								/>

								<button
									type="button"
									onClick={() => document.getElementById(`redo-${tid}`)?.click()}
								>
									Redo image
								</button>
							</div>
						)
					})}

				</div>

			</div>
		</div>
	)
}
