import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const PricingContext = createContext(null)

export function PricingProvider({ children }) {
    const [pricing, setPricing] = useState(null)
    const [error, setError] = useState('')
    const [toppings, setToppings] = useState([])

    async function refreshPricing() {
        try {
            setError('')

            const [pricingRes, toppingsRes] = await Promise.all([
                fetch('/api/pricing', { cache: 'no-store' }),
                fetch('/api/toppings', { cache: 'no-store' }),
            ])

            if (!pricingRes.ok) {
                throw new Error(`pricing bad status ${pricingRes.status}`)
            }
            if (!toppingsRes.ok) {
                throw new Error(`No toppings in DB, Creating default toppings. ${toppingsRes.status}`)
            }

            const pricingData = await pricingRes.json()
            const allToppings = await toppingsRes.json()

            // map pricing by id → price
            const pricedMap = new Map(
                (pricingData.toppings || []).map(t => [t.id, t.price])
            )

            // merge: missing price = 0 (free)
            const mergedToppings = allToppings.map(t => ({
                id: String(t._id),
                label: t.name,
                price: Number(t.price || 0),
                image: t.image || "",
            }))

            setPricing(pricingData)
            setToppings(mergedToppings)

            return pricingData
        } catch (e) {
            console.error(e)
            setError(String(e.message || 'Pricing unavailable'))
            return null
        }
    }


    useEffect(() => {
        let alive = true
            ; (async () => {
                const data = await refreshPricing()
                if (!alive) return
                // refreshPricing already sets state; no-op
            })()
        return () => { alive = false }
    }, [])

    const value = useMemo(
        () => ({ pricing, toppings, error, refreshPricing }),
        [pricing, toppings, error]
    )


    return (
        <PricingContext.Provider value={value}>
            {children}
        </PricingContext.Provider>
    )
}

export function usePricing() {
    const ctx = useContext(PricingContext)
    if (!ctx) throw new Error('usePricing must be used inside PricingProvider')
    return ctx
}
