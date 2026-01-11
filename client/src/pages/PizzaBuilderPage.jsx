import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function PizzaBuilderPage() {
    const sizes = useMemo(() => [
        { id: 'sm', label: 'Small', mult: 1 },
        { id: 'md', label: 'Medium', mult: 1.25 },
        { id: 'lg', label: 'Large', mult: 1.5 },
    ], [])
    const crusts = useMemo(() => [
        { id: 'thin', label: 'Thin' },
        { id: 'hand', label: 'Hand Tossed' },
        { id: 'pan', label: 'Pan' },
    ], [])
    const sauces = useMemo(() => [
        { id: 'red', label: 'Tomato' },
        { id: 'white', label: 'White Sauce' },
        { id: 'bbq', label: 'BBQ' },
    ], [])
    const toppings = useMemo(() => [
        { id: 'pep', label: 'Pepperoni', price: 1.25 },
        { id: 'msh', label: 'Mushrooms', price: 0.85 },
        { id: 'olv', label: 'Olives', price: 0.85 },
        { id: 'on', label: 'Onions', price: 0.65 },
        { id: 'gp', label: 'Green Peppers', price: 0.75 },
        { id: 'ham', label: 'Ham', price: 1.35 },
    ], [])

    const [sizeId, setSizeId] = useState('md')
    const [crustId, setCrustId] = useState('hand')
    const [sauceId, setSauceId] = useState('red')
    const [selected, setSelected] = useState({})//{toppingId:true}

    const basePrice = 10.99
    const size = useMemo(() => sizes.find(s => s.id === sizeId), [sizes, sizeId])

    const toppingsTotal = useMemo(() => {
        let sum = 0
        for (const t of toppings) {
            if (selected[t.id]) sum += t.price
        }
        return sum
    }, [toppings, selected])

    const total = useMemo(() => {
        return (basePrice * size.mult) + toppingsTotal
    }, [basePrice, size, toppingsTotal])

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
    }

    function addToCart() {
        //placeholder for now
        const order = {
            size: sizeId,
            crust: crustId,
            sauce: sauceId,
            toppings: Object.keys(selected).filter(k => selected[k]),
            total: Math.round(total * 100) / 100,
        }
        console.log('ADD TO CART', order)
        alert('Added to cart (placeholder). Check console.')
    }

    return (
        <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h1 style={{ margin: 0 }}>Build Your Pizza</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/">Back to Home</Link>
                    <Link to="/menu">Menu</Link>
                </div>
            </div>

            <div className="builder-grid">

                {/* Left: options */}
                <section className="preview-panel">
                    <h2 style={{ marginTop: 0 }}>Options</h2>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Size</div>
                        {sizes.map(s => (
                            <label key={s.id} style={{ display: 'block', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="size"
                                    checked={sizeId === s.id}
                                    onChange={() => setSizeId(s.id)}
                                />
                                <span style={{ marginLeft: '8px' }}>{s.label}</span>
                            </label>
                        ))}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Crust</div>
                        <select value={crustId} onChange={e => setCrustId(e.target.value)} style={{ width: '100%' }}>
                            {crusts.map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Sauce</div>
                        <select value={sauceId} onChange={e => setSauceId(e.target.value)} style={{ width: '100%' }}>
                            {sauces.map(s => (<option key={s.id} value={s.id}>{s.label}</option>))}
                        </select>
                    </div>

                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Toppings</div>
                        {toppings.map(t => (
                            <label key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', cursor: 'pointer', padding: '6px 0' }}>
                                <span>
                                    <input
                                        type="checkbox"
                                        checked={!!selected[t.id]}
                                        onChange={() => toggleTopping(t.id)}
                                    />
                                    <span style={{ marginLeft: '8px' }}>{t.label}</span>
                                </span>
                                <span>${t.price.toFixed(2)}</span>
                            </label>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button onClick={reset} type="button">Reset</button>
                    </div>
                </section>

                {/* Middle: visual preview placeholder */}
                <section className="preview-panel" style={{ minHeight: '520px' }}>
                    <h2 style={{ marginTop: 0 }}>Preview</h2>

                    <div className="pizza-preview">
                        <div className="pizza-circle">
                            <div className="pizza-circle-inner">
                                <div className="pizza-circle-title">Pizza Preview Placeholder</div>
                                <div className="pizza-circle-sub">
                                    pictures here eventually
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="preview-details">
                        <div><b>Size:</b> {size.label}</div>
                        <div><b>Crust:</b> {crustLabel}</div>
                        <div><b>Sauce:</b> {sauceLabel}</div>
                        <div><b>Toppings:</b> {Object.keys(selected).filter(k => selected[k]).length === 0 ? 'None' : Object.keys(selected).filter(k => selected[k]).map(id => toppings.find(t => t.id === id)?.label).join(', ')}</div>
                    </div>
                </section>

                {/* Right: summary */}
                <aside style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px' }}>
                    <h2 style={{ marginTop: 0 }}>Summary</h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Base (${basePrice.toFixed(2)}) × {size.label}</span>
                        <span>${(basePrice * size.mult).toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span>Toppings</span>
                        <span>${toppingsTotal.toFixed(2)}</span>
                    </div>

                    <hr style={{ margin: '12px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px' }}>
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <button onClick={addToCart} type="button" style={{ width: '100%', marginTop: '12px', padding: '10px' }}>
                        Add to Cart
                    </button>

                    <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '10px' }}>
                        Cart is a placeholder right now. Next we can store this in context/localStorage.
                    </p>
                </aside>
            </div>
        </div>
    )
}
