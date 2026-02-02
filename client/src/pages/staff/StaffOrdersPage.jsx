import React, { useEffect, useMemo, useState } from "react"
import StaffOrderCard from "../../components/staff/StaffOrderCard.jsx"
import { jsonFetch } from "../../api/http.js"

export default function StaffOrdersPage() {
	const [orders, setOrders] = useState([])
	const [error, setError] = useState("")
	const [allToppings, setAllToppings] = useState([])

	const toppingNameById = useMemo(() => {
		const m = new Map()
		for (const t of (allToppings || [])) {
			const name = String(t.name || t.label || t.title || "").trim()

			const k1 = String(t._id || "")
			const k2 = String(t.id || "")
			const k3 = String(t.code || "")
			const k4 = String(t.slug || "")

			if (k1) m.set(k1, name || k1)
			if (k2) m.set(k2, name || k2)
			if (k3) m.set(k3, name || k3)
			if (k4) m.set(k4, name || k4)
		}
		return m
	}, [allToppings])

	function idxToLetter(i) {
		return String.fromCharCode(97 + i)
	}

	function explodeOrders(list) {
		const out = []
		for (const o of (list || [])) {
			const items = Array.isArray(o.items) ? o.items : []
			if (items.length <= 1) {
				out.push({
					...o,
					orderId: o._id,
					subLabel: "",
					itemIndex: 0,
					subKey: `${o._id}:0`,
					_key: `${o._id}:0`,
				})
				continue
			}
			for (let i = 0; i < items.length; i++) {
				const letter = idxToLetter(i)
				out.push({
					...o,
					orderId: o._id,
					subLabel: letter,
					itemIndex: i,
					subKey: `${o._id}:${i}`,
					_key: `${o._id}:${letter}`,
					items: [items[i]],
				})
			}
		}
		return out
	}

	async function load() {
		try {
			setError("")
			const [data, tops] = await Promise.all([
				jsonFetch("/api/staff/orders"),
				jsonFetch("/api/toppings?all=1"),
			])
			const list = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : [])
			const withNums = list.map((o, i) => ({ ...o, displayNumber: i + 1 }))
			setOrders(explodeOrders(withNums))
			setAllToppings(Array.isArray(tops) ? tops : [])
		} catch (e) {
			setError(e?.message || "Failed to load orders")
			setOrders([])
		}
	}

	useEffect(() => { load() }, [])

	async function onPatch(id, patchObj) {
		const realId = String(id).split(":")[0]
		const updated = await jsonFetch(`/api/staff/orders/${realId}`, {
			method: "PATCH",
			body: JSON.stringify(patchObj),
		})

		if (updated?.moved) {
			setOrders(prev => prev.filter(o => String(o.orderId || o._id).split(":")[0] !== realId))
			return
		}

		setOrders(prev => {
			const idx = Number.isFinite(patchObj?.itemIndex) ? patchObj.itemIndex : 0
			const sub = updated?.kitchen?.items?.[idx] || {}
			const finished = !!sub.doneAt || !!sub.canceledAt

			if (finished) {
				return prev.filter(o => !(String(o.orderId || "") === realId && Number(o.itemIndex) === idx))
			}

			return prev.map(o => {
				if (String(o.orderId || "") !== realId) return o
				if (Number(o.itemIndex) !== idx) return o
				return {
					...updated,
					displayNumber: o.displayNumber,
					orderId: o.orderId,
					subLabel: o.subLabel,
					itemIndex: o.itemIndex,
					items: o.items,
					subKey: o.subKey,
					_key: o._key || o.subKey,
				}
			})
		})
	}

	function getDeliveryNotes(o) {
		const a = String(o?.deliveryNotes || "").trim()
		if (a) return a
		const it = Array.isArray(o?.items) ? o.items[0] : null
		const b = String(it?.deliveryNotes || "").trim()
		if (b) return b
		return ""
	}

	return (
		<div className="page staff-page">
			<h1 className="page-title">Orders</h1>
			{error && <div className="error">{error}</div>}
			<div className="orders-scroll">
				{orders.length === 0 ? (
					<div className="no-orders">No orders at the moment.</div>
				) : (
					orders.map(o => (
						<StaffOrderCard
							key={o._key || o.subKey}
							order={o}
							onPatch={onPatch}
							toppingNameById={toppingNameById}
							deliveryNotes={getDeliveryNotes(o)}
						/>
					))
				)}
			</div>
		</div>
	)
}
