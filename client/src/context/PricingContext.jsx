import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const PricingContext = createContext(null)

export function PricingProvider({ children }) {
    const [pricing, setPricing] = useState(null)
    const [error, setError] = useState('')

    async function refreshPricing() {
        try {
            setError('')
            const res = await fetch('/api/pricing', { cache: 'no-store' })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`pricing bad status ${res.status}: ${txt}`)
            }
            const data = await res.json()
            setPricing(data)
            return data
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

    const value = useMemo(() => ({ pricing, error, refreshPricing }), [pricing, error])

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
