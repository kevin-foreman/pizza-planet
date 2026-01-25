import { useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { usePricing } from "../../context/PricingContext.jsx"
import PizzaVisualizer from "./PizzaVisualizer.jsx"

function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
}

function norm(s) {
    return String(s || "").toLowerCase()
}

function hasAny(name, words) {
    const n = norm(name)
    for (const w of words) if (n.includes(w)) return true
    return false
}

function pickIdsFromPool(pool, n, rng) {
    const copy = [...pool]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp
    }
    return copy.slice(0, Math.max(0, n)).map(t => String(t.id))
}

function makePizza({ sizes, crusts, sauces, toppingById, pickSizeId, pickCrustId, pickSauceId, topPool, count, rng }) {
    const sizeId = pickSizeId?.() || sizes[0]?.id || "md"
    const crustId = pickCrustId?.() || crusts[0]?.id || "hand"
    const sauceId = pickSauceId?.() || sauces[0]?.id || "red"
    const topIds = pickIdsFromPool(topPool, count, rng)

    const crustImg = crusts.find(c => c.id === crustId)?.image || ""
    const sauceImg = sauces.find(s => s.id === sauceId)?.image || ""
    const topImgs = topIds.map(id => toppingById.get(String(id))?.image).filter(Boolean)

    return { sizeId, crustId, sauceId, topIds, crustImg, sauceImg, topImgs }
}

function describePizza(p, pricing) {
    const size = pricing?.sizes?.find(s => s.id === p.sizeId)?.label || p.sizeId
    const crust = pricing?.crusts?.find(c => c.id === p.crustId)?.label || p.crustId
    const sauce = pricing?.sauces?.find(s => s.id === p.sauceId)?.label || p.sauceId
    const tops = p.topIds?.length || 0
    return `${size} ${crust} pizza with ${sauce} sauce and ${tops} topping${tops === 1 ? "" : "s"}`
}

function calcPizzaPrice(p, pricing) {
    const base = pricing?.basePrice ?? 10.99
    const mult = pricing?.sizes?.find(s => s.id === p.sizeId)?.mult ?? 1
    return (base * mult).toFixed(2)
}

function Section({ title, list, pricing, onPick }) {
    return (
        <section className="menu-showcase-section">
            <h2 className="menu-showcase-title">{title}</h2>
            <div className="menu-showcase-grid">
                {list.map((p, i) => (
                    <button key={`${title}-${i}`} type="button" className="menu-showcase-card" onClick={() => onPick(p)}>
                        <div className="menu-pizza-meta">
                            <div className="menu-pizza-desc">{describePizza(p, pricing)}</div>
                            <div className="menu-pizza-price">${calcPizzaPrice(p, pricing)}</div>
                        </div>

                        <PizzaVisualizer
                            crustId={p.crustId}
                            crustImg={p.crustImg}
                            sauceImg={p.sauceImg}
                            toppingImgs={p.topImgs}
                            size={160}
                        />

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


export default function MenuShowcaseGrid() {
    const navigate = useNavigate()
    const { pricing, toppings, refreshPricing } = usePricing()

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

    const seedRef = useRef((Date.now() ^ ((Math.random() * 1e9) | 0)) >>> 0)
    const rng = useMemo(() => mulberry32(seedRef.current), [])

    const groups = useMemo(() => {
        if (!crusts.length || !sauces.length || !tops.length) return null

        const meatWords = ["pepperoni", "sausage", "bacon", "ham", "chicken", "beef", "meatball", "salami", "steak"]
        const vegWords = ["mushroom", "onion", "olive", "pepper", "jalapeno", "spinach", "tomato", "pineapple", "basil", "garlic", "banana pepper"]

        const meatPool = tops.filter(t => t?.id && t?.image && hasAny(t.label || t.name, meatWords))
        const vegPool = tops.filter(t => t?.id && t?.image && hasAny(t.label || t.name, vegWords))
        const anyPool = tops.filter(t => t?.id && t?.image)

        function rSize() {
            if (!sizes.length) return "md"
            const r = rng()
            if (r < 0.15) return sizes.find(s => s.id === "sm")?.id || sizes[0].id
            if (r < 0.80) return sizes.find(s => s.id === "md")?.id || sizes[0].id
            return sizes.find(s => s.id === "lg")?.id || sizes[sizes.length - 1].id
        }
        function rCrust() {
            return crusts[Math.floor(rng() * crusts.length)]?.id || crusts[0].id
        }
        function rSauce() {
            const r = rng()
            const red = sauces.find(s => s.id === "red")?.id
            if (red && r < 0.65) return red
            return sauces[Math.floor(rng() * sauces.length)]?.id || sauces[0].id
        }

        const common = { sizes, crusts, sauces, toppingById, pickSizeId: rSize, pickCrustId: rCrust, pickSauceId: rSauce, rng }

        const popular = [
            makePizza({ ...common, topPool: anyPool, count: 2 }),
            makePizza({ ...common, topPool: anyPool, count: 3 }),
            makePizza({ ...common, topPool: anyPool, count: 4 }),
            makePizza({ ...common, topPool: (meatPool.length ? meatPool : anyPool), count: 3 }),
            makePizza({ ...common, topPool: (vegPool.length ? vegPool : anyPool), count: 3 }),
            makePizza({ ...common, topPool: anyPool, count: 1 }),
        ]

        const meatLovers = [
            makePizza({ ...common, topPool: (meatPool.length ? meatPool : anyPool), count: 3 }),
            makePizza({ ...common, topPool: (meatPool.length ? meatPool : anyPool), count: 4 }),
            makePizza({ ...common, topPool: (meatPool.length ? meatPool : anyPool), count: 5 }),
            makePizza({ ...common, topPool: [...meatPool, ...anyPool], count: 4 }),
        ]

        const MEAT_WORDS = ["ham", "pepperoni", "sausage", "bacon", "beef", "chicken"]
        const vegOnlyPool = vegPool.filter(t => !MEAT_WORDS.some(w => String(t.label || t.name || "").toLowerCase().includes(w)))

        const veggieLovers = [
            makePizza({ ...common, topPool: vegOnlyPool, count: 3 }),
            makePizza({ ...common, topPool: vegOnlyPool, count: 4 }),
            makePizza({ ...common, topPool: vegOnlyPool, count: 5 }),
            makePizza({ ...common, topPool: [...vegOnlyPool], count: 4 }),
        ]

        return { popular, meatLovers, veggieLovers }
    }, [sizes, crusts, sauces, tops, toppingById, rng])

    if (!groups) return null

    function go(p) {
        const topsStr = Array.isArray(p.topIds) ? p.topIds.join(",") : ""
        navigate(`/builder/pizza?size=${encodeURIComponent(p.sizeId || "md")}&crust=${encodeURIComponent(p.crustId || "hand")}&sauce=${encodeURIComponent(p.sauceId || "red")}&tops=${encodeURIComponent(topsStr)}`)
    }

    return (
        <div className="menu-showcase">
            <Section title="Popular" list={groups.popular} pricing={pricing} onPick={go} />
            <Section title="Meat Lovers" list={groups.meatLovers} pricing={pricing} onPick={go} />
            <Section title="Veggie Lovers" list={groups.veggieLovers} pricing={pricing} onPick={go} />
        </div>
    )
}
