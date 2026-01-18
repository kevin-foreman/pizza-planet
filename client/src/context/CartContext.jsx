import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const KEY = 'pizzaPlanet.cart.v1'

function safeParse(raw, fallback) {
	try {
		return raw ? JSON.parse(raw) : fallback
	} catch (e) {
		return fallback
	}
}

export function CartProvider({ children }) {
	const [items, setItems] = useState(() => {
		const saved = safeParse(localStorage.getItem(KEY), null)
		return saved?.items || []
	})

	const [tipAmount, setTipAmount] = useState(() => {
		const saved = safeParse(localStorage.getItem(KEY), null)
		return saved?.tipAmount || 0
	})

	useEffect(() => {
		localStorage.setItem(KEY, JSON.stringify({ items, tipAmount }))
	}, [items, tipAmount])

	function addItem(item) {
		setItems(prev => [...prev, item])
	}

	function removeItem(itemId) {
		setItems(prev => prev.filter(i => i.id !== itemId))
	}

	function clearCart() {
		setItems([])
		setTipAmount(0)
	}

	function setQty(itemId, qty) {
		const q = Math.max(1, Number(qty) || 1)
		setItems(prev => prev.map(i => i.id === itemId ? { ...i, qty: q } : i))
	}
	const subtotal = useMemo(() => {
		let sum = 0
		for (const i of items) {
			sum += ((i.unitPrice || 0) * (i.qty || 1))
		}
		return Math.round(sum * 100) / 100
	}, [items])

	const total = useMemo(() => {
		const t = subtotal + (Number(tipAmount) || 0)
		return Math.round(t * 100) / 100
	}, [subtotal, tipAmount])

	const itemCount = useMemo(() => {
		let c = 0
		for (const i of items) {
			c += (i.qty || 1)
		}
		return c
	}, [items])

	const value = useMemo(() => ({
		items,
		addItem,
		removeItem,
		clearCart,
		setQty,
		tipAmount,
		setTipAmount,
		subtotal,
		total,
		itemCount,
	}), [items, tipAmount, subtotal, total, itemCount])


	return (
		<CartContext.Provider value={value}>
			{children}
		</CartContext.Provider>
	)
}

export function useCart() {
	return useContext(CartContext)
}
