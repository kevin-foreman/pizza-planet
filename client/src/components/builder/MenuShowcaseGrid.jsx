import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { usePricing } from "../../context/PricingContext.jsx"

import PizzaVisualizer from "./PizzaVisualizer.jsx"

function norm(s) {
    return String(s || "").toLowerCase()
}

function hasAny(name, words) {
    const n = norm(name)
    for (const w of words) if (n.includes(w)) return true
    return false
}

function pickIdsFromPool(pool, n) {
    const copy = [...pool]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp
    }
    return copy.slice(0, Math.max(0, n)).map(t => String(t.id))
}

function makePizza({ sizes, crusts, sauces, toppingById, tops, pickSizeId, pickCrustId, pickSauceId, topPool, count }) {
    const sizeId = pickSizeId?.() || sizes[0]?.id || "md"
    const crustId = pickCrustId?.() || crusts[0]?.id || "hand"
    const sauceId = pickSauceId?.() || sauces[0]?.id || "red"
    const topIds = pickIdsFromPool(topPool, count)

    const crustImg = crusts.find(c => c.id === crustId)?.image || ""
    const sauceImg = sauces.find(s => s.id === sauceId)?.image || ""
    const topImgs = topIds.map(id => toppingById.get(String(id))?.image).filter(Boolean)

    return { sizeId, crustId, sauceId, topIds, crustImg, sauceImg, topImgs }
}

export default function MenuShowcaseGrid() {
    const navigate = useNavigate()
    const { pricing, toppings, refreshPricing } = usePricing()

    useEffect(() => {
        refreshPricing()
    }, [])

    const sizes = pricing?.sizes || []
    const crusts = pricing?.crusts || []
    const sauces = pricing?.sauces || []
    const tops = toppings || []

    const toppingById = useMemo(() => {
        const m = new Map()
        for (const t of tops) {
            const id = String(t.id || t._id || "")
            if (id) m.set(id, { ...t, id })
        }
        return m
    }, [tops])

    const groups = useMemo(() => {
        if (!crusts.length || !sauces.length || !tops.length) return null

        const meatWords = ["pepperoni", "sausage", "bacon", "ham", "chicken", "beef", "meatball", "salami", "steak"]
        const vegWords = ["mushroom", "onion", "olive", "pepper", "jalapeno", "spinach", "tomato", "pineapple", "basil", "garlic", "banana pepper"]

        const meatPool = tops.filter(t => t?.id && t?.image && hasAny(t.label || t.name, meatWords))
        const vegPool = tops.filter(t => t?.id && t?.image && hasAny(t.label || t.name, vegWords))
        const anyPool = tops.filter(t => t?.id && t?.image)

        function rSize() {
            if (!sizes.length) return "md"
            const r = Math.random()
            if (r < 0.15) return sizes.find(s => s.id === "sm")?.id || sizes[0].id
            if (r < 0.80) return sizes.find(s => s.id === "md")?.id || sizes[0].id
            return sizes.find(s => s.id === "lg")?.id || sizes[sizes.length - 1].id
        }
        function rCrust() {
            return crusts[Math.floor(Math.random() * crusts.length)]?.id || crusts[0].id
        }
        function rSauce() {
            const r = Math.random()
            const red = sauces.find(s => s.id === "red")?.id
            if (red && r < 0.65) return red
            return sauces[Math.floor(Math.random() * sauces.length)]?.id || sauces[0].id
        }

        const common = { sizes, crusts, sauces, toppingById, tops, pickSizeId: rSize, pickCrustId: rCrust, pickSauceId: rSauce }

        const popular = [
            makePizza({ ...common, topPool: anyPool, count: 2 }),
            makePizza({ ...common, topPool: anyPool, count: 3 }),
            makePizza({ ...common, topPool: anyPool, count: 4 }),
            makePizza({ ...common, topPool: meatPool.length ? meatPool : anyPool, count: 3 }),
            makePizza({ ...common, topPool: vegPool.length ? vegPool : anyPool, count: 3 }),
            makePizza({ ...common, topPool: anyPool, count: 1 }),
        ]

        const meatLovers = [
            makePizza({ ...common, topPool: meatPool.length ? meatPool : anyPool, count: 3 }),
            makePizza({ ...common, topPool: meatPool.length ? meatPool : anyPool, count: 4 }),
            makePizza({ ...common, topPool: meatPool.length ? meatPool : anyPool, count: 5 }),
            makePizza({ ...common, topPool: [...meatPool, ...anyPool], count: 4 }),
        ]

        const veggieLovers = [
            makePizza({ ...common, topPool: vegPool.length ? vegPool : anyPool, count: 3 }),
            makePizza({ ...common, topPool: vegPool.length ? vegPool : anyPool, count: 4 }),
            makePizza({ ...common, topPool: vegPool.length ? vegPool : anyPool, count: 5 }),
            makePizza({ ...common, topPool: [...vegPool, ...anyPool], count: 4 }),
        ]

        return { popular, meatLovers, veggieLovers }
    }, [sizes, crusts, sauces, tops, toppingById])

    if (!groups) return null

    function go(p) {
        const topsStr = Array.isArray(p.topIds) ? p.topIds.join(",") : ""
        navigate(`/builder/pizza?size=${encodeURIComponent(p.sizeId || "md")}&crust=${encodeURIComponent(p.crustId)}&sauce=${encodeURIComponent(p.sauceId)}&tops=${encodeURIComponent(topsStr)}`)
    }

    function Section({ title, list }) {
        return (
            <section className="menu-showcase-section">
                <h2 className="menu-showcase-title">{title}</h2>
                <div className="menu-showcase-grid">
                    {list.map((p, i) => (
                        <button className="menu-showcase-card" key={i} type="button" onClick={() => go(p)}>
                            <div className="pv-mini">
                                <PizzaVisualizer
                                    crustId={p.crustId}
                                    crustImg={p.crustImg}
                                    sauceImg={p.sauceImg}
                                    toppingImgs={p.topImgs}
                                    size={180}
                                />
                            </div>
                            <div className="menu-showcase-meta">
                                <div className="pill">{String(p.sizeId || "md").toUpperCase()}</div>
                                <div className="pill">{p.crustId}</div>
                                <div className="pill">{p.sauceId}</div>
                                <div className="pill">{(p.topIds || []).length} tops</div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        )
    }

    return (
        <div className="menu-showcase">
            <Section title="Popular" list={groups.popular} />
            <Section title="Meat Lovers" list={groups.meatLovers} />
            <Section title="Veggie Lovers" list={groups.veggieLovers} />
        </div>
    )
}
