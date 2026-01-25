import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function AdminPricingPage() {
	const [menu, setMenu] = useState({ toppings: [], sizes: [], crusts: [], sauces: [], basePrice: 0, taxRate: 0 })
	const [savedMsg, setSavedMsg] = useState('')
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		let dead = false
		async function load() {
			try {
				const res = await fetch('/api/pricing')
				const text = await res.text()



				if (!res.ok || !text) {
					console.error('Menu load failed', res.status, text)
					return
				}


				setMenu(JSON.parse(text))
			} catch (err) {
				console.error('Menu load error', err)
			}
		}

		load()
		return () => { dead = true }
	}, [])

	useEffect(() => {
		if (!savedMsg) return
		const t = setTimeout(() => setSavedMsg(''), 1500)
		return () => clearTimeout(t)
	}, [savedMsg])

	function setLocalPrice(group, id, value) {
		setMenu(prev => {
			const next = { ...prev }
			next[group] = (next[group] || []).map(x => x.id === id ? ({ ...x, price: value }) : x)
			return next
		})
	}

	async function savePrice(item) {
		setBusy(true)
		try {
			let body = {}
			if (item.entreeType) {
				// no entrees in pricing doc, so skip or handle basePrice separately
				throw new Error('Entrees not supported in pricing doc yet')
			} else {
				const nextToppings = (menu.toppings || []).map(x => x.id === item.id ? item : x)
				body = { toppings: nextToppings }
			}

			const res = await fetch('/api/pricing', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			if (!res.ok) throw new Error(await res.text())
			const updated = await res.json()
			setMenu(updated)
			setSavedMsg('Saved.')
		} catch (e) {
			setSavedMsg(e.message || 'Save failed')
		} finally {
			setBusy(false)
		}
	}


	return (
		<div className="container">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
				<h1 style={{ margin: 0 }}>Admin Pricing</h1>
				<div style={{ display: 'flex', gap: '10px' }}>
					<Link to="/">Home</Link>
					<Link to="/menu">Menu</Link>
				</div>
			</div>

			<p style={{ opacity: 0.85, marginTop: 0 }}>
				Update topping and entree prices.
			</p>

			<section style={{ border: '1px solid #3a3a3a', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
				<h2 style={{ marginTop: 0 }}>Toppings</h2>

				<div style={{ display: 'grid', gap: '10px' }}>
					{(menu.toppings || []).map(t => (
						<div key={t._id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', gap: '12px', alignItems: 'center' }}>
							<div style={{ fontWeight: 600 }}>{t.name || t.label || t.id || t._id}</div>
							<input
								type="number"
								step="0.01"
								min="0"
								value={t.price ?? 0}
								onChange={e => setLocalPrice('toppings', t.id, Number(e.target.value))}
							/>
							<button type="button" disabled={busy} onClick={() => savePrice(t)}>Save</button>
						</div>
					))}
				</div>

				<hr style={{ margin: '16px 0' }} />

				<h2 style={{ marginTop: 0 }}>Entrees</h2>

				<div style={{ display: 'grid', gap: '10px' }}>
					{(menu.entrees || []).map(e => (
						<div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', gap: '12px', alignItems: 'center' }}>
							<div style={{ fontWeight: 600 }}>{e.name}</div>
							<input
								type="number"
								step="0.01"
								min="0"
								value={e.price ?? 0}
								onChange={ev => setLocalPrice('pizzas', e._id, Number(ev.target.value))}
							/>
							<button type="button" disabled={busy} onClick={() => savePrice(e)}>Save</button>
						</div>
					))}
				</div>


				<div style={{ marginTop: '16px', opacity: 0.85 }}>
					{savedMsg ? savedMsg : null}
				</div>
			</section>
		</div>
	)
}
