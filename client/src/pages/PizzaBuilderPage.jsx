import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useNavigate } from 'react-router-dom'

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

    const { addItem } = useCart()

    const [sizeId, setSizeId] = useState('md')
    const [crustId, setCrustId] = useState('hand')
    const [sauceId, setSauceId] = useState('red')
    const [selected, setSelected] = useState({})
    const [notes, setNotes] = useState('')
    const [notice, setNotice] = useState('')

    const size = useMemo(() => sizes.find(s => s.id === sizeId), [sizes, sizeId])

    const crustLabel = useMemo(
        () => crusts.find(c => c.id === crustId)?.label || '',
        [crusts, crustId]
    )

    const sauceLabel = useMemo(
        () => sauces.find(s => s.id === sauceId)?.label || '',
        [sauces, sauceId]
    )

    const toppingLabels = useMemo(
        () => toppings.filter(t => selected[t.id]).map(t => t.label),
        [toppings, selected]
    )

    const basePrice = 10.99

    const toppingsTotal = useMemo(() => {
        let sum = 0
        for (const t of toppings) {
            if (selected[t.id]) sum += t.price
        }
        return sum
    }, [toppings, selected])

    const total = useMemo(() => basePrice * size.mult + toppingsTotal, [basePrice, size, toppingsTotal])

    const navigate = useNavigate()
    const [showAddModal, setShowAddModal] = useState(false)

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

    return (

        <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h1>Build Your Pizza</h1>
                <div style={{ display: 'flex', gap: '10px' }}></div>
            </div>

            {notice ? (
                <div style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '10px' }}>
                    {notice}
                </div>
            ) : null}

            <div className="builder-grid">
                <section className="preview-panel">
                    <h2>Options</h2>

                    <div>
                        <div><b>Size</b></div>
                        {sizes.map(s => (
                            <label key={s.id} style={{ display: 'block' }}>
                                <input type="radio" name="size" checked={sizeId === s.id} onChange={() => setSizeId(s.id)} />
                                <span style={{ marginLeft: '8px' }}>{s.label}</span>
                            </label>
                        ))}
                    </div>

                    <div>
                        <div><b>Crust</b></div>
                        <select value={crustId} onChange={e => setCrustId(e.target.value)}>
                            {crusts.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div><b>Sauce</b></div>
                        <select value={sauceId} onChange={e => setSauceId(e.target.value)}>
                            {sauces.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div><b>Toppings</b></div>
                        {toppings.map(t => (
                            <label key={t.id} className="topping-row">

                                <span>
                                    <input type="checkbox" checked={!!selected[t.id]} onChange={() => toggleTopping(t.id)} />
                                    <span style={{ marginLeft: '8px' }}>{t.label}</span>
                                </span>
                                <span>${t.price.toFixed(2)}</span>
                            </label>
                        ))}
                    </div>

                    <div>
                        <div><b>Special Instructions</b></div>
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

                    <button
                        className="btn-add-cart"
                        onClick={addToCart}
                        style={{ marginTop: '12px', width: '100%' }}>Add to Cart</button>
                </aside>
            </div>
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Added to cart</h3>
                        <p className="modal-text">Order more, or go to your cart?</p>
                        <div className="modal-actions">
                            <button onClick={() => { setShowAddModal(false); reset() }}>

                                Order More
                            </button>

                            <button onClick={() => navigate('/cart')}>
                                Go To Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    )
}
