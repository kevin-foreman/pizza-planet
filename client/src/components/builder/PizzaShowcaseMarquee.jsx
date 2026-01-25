import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { jsonFetch } from "../../api/http.js"
import { usePricing } from "../../context/PricingContext.jsx"
import PizzaVisualizer from "./PizzaVisualizer.jsx"

export default function PizzaShowcaseMarquee() {
    const [orders, setOrders] = useState([])
    const { pricing, toppings, refreshPricing } = usePricing()
    const scrollerRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        refreshPricing()
        jsonFetch("/api/archived_orders/random?limit=6")
            .then(d => setOrders(Array.isArray(d) ? d : []))
            .catch(() => { })
    }, [])

    const toppingById = useMemo(() => {
        const m = new Map()
        for (const t of toppings || []) {
            const id = String(t.id || t._id || "")
            if (id) m.set(id, t)
        }
        return m
    }, [toppings])

    const pizzas = useMemo(() => {
        const out = []
        for (const o of orders) {
            for (const it of o.items || []) {
                if (it.type !== "pizza") continue

                const sizeId = it?.config?.sizeId || "md"
                const crustId = it?.config?.crustId || "hand"
                const sauceId = it?.config?.sauceId || "red"
                const topIds = it?.config?.toppings || []

                const crustImg = (pricing?.crusts || []).find(c => c.id === crustId)?.image || ""
                const sauceImg = (pricing?.sauces || []).find(s => s.id === sauceId)?.image || ""

                const topImgs = []
                for (const id of topIds) {
                    const t = toppingById.get(String(id))
                    if (t?.image) topImgs.push(t.image)
                }

                out.push({ sizeId, crustId, sauceId, topIds, crustImg, sauceImg, topImgs })


            }
        }

        if (!out.length) {
            const sizes = pricing?.sizes || []
            const crusts = pricing?.crusts || []
            const sauces = pricing?.sauces || []
            const tops = toppings || []

            if (crusts.length && sauces.length) {
                // math for random number of toppings with weighted probabilities
                function randomToppingCount() {
                    const r = Math.random()
                    if (r < 0.15) return 0
                    if (r < 0.35) return 1
                    if (r < 0.55) return 2
                    if (r < 0.65) return 3
                    if (r < 0.75) return 4
                    return 5
                }
                // picks n random topping images (shuffles available toppings & no duplicates)
                function pick(n) {
                    const copy = [...tops].filter(t => t?.image)
                    for (let i = copy.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1))
                        const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp
                    }
                    return copy.slice(0, n).map(t => t.image)
                }

                function pickIds(n) {
                    const copy = [...tops].filter(t => t?.id && t?.image)
                    for (let i = copy.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1))
                        const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp
                    }
                    return copy.slice(0, n).map(t => String(t.id))
                }

                const presets = Array.from({ length: 7 }, () => ({
                    sizeId: sizes[Math.floor(Math.random() * sizes.length)]?.id || "md",
                    crustId: crusts[Math.floor(Math.random() * crusts.length)]?.id || crusts[0].id,
                    sauceId: sauces[Math.floor(Math.random() * sauces.length)]?.id || sauces[0].id,
                    topIds: pickIds(randomToppingCount()),
                }))


                for (const p of presets) {
                    const crustImg = crusts.find(c => c.id === p.crustId)?.image || ""
                    const sauceImg = sauces.find(s => s.id === p.sauceId)?.image || ""
                    const topImgs = p.topIds
                        .map(id => toppingById.get(String(id))?.image)
                        .filter(Boolean)

                    out.push({
                        sizeId: p.sizeId,
                        crustId: p.crustId,
                        sauceId: p.sauceId,
                        topIds: p.topIds,
                        crustImg,
                        sauceImg,
                        topImgs,
                    })
                }

            }
        }


        return out
    }, [orders, pricing, toppings, toppingById])


    const loopPizzas = useMemo(() => pizzas.length ? [...pizzas, ...pizzas] : [], [pizzas])
    useEffect(() => {
        const el = scrollerRef.current
        if (!el) return

        let raf = 0
        let last = performance.now()
        let paused = false
        let isHovered = false
        let resumeTimer = 0

        function setPaused(v) {
            paused = v
        }

        function pause(ms = 900) {
            setPaused(true)
            clearTimeout(resumeTimer)
            resumeTimer = setTimeout(() => {
                if (!isHovered) setPaused(false)
            }, ms)
        }

        const speedPxPerSec = 85

        function loop(now) {
            let dt = now - last
            last = now
            if (dt > 20) dt = 20

            if (!paused) {
                el.scrollLeft += (dt / 1000) * speedPxPerSec
                const half = el.scrollWidth / 2
                if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half
            }

            raf = requestAnimationFrame(loop)
        }



        const onEnter = () => {
            isHovered = true
            setPaused(true)
        }
        const onLeave = () => {
            isHovered = false
            setPaused(false)
        }
        const onWheel = () => pause(1200)
        const onDown = () => setPaused(true)
        const onUp = () => {
            if (!isHovered) setPaused(false)
        }

        el.addEventListener("mouseenter", onEnter)
        el.addEventListener("mouseleave", onLeave)
        el.addEventListener("wheel", onWheel, { passive: true })
        el.addEventListener("pointerdown", onDown)
        window.addEventListener("pointerup", onUp)

        raf = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(raf)
            clearTimeout(resumeTimer)
            el.removeEventListener("mouseenter", onEnter)
            el.removeEventListener("mouseleave", onLeave)
            el.removeEventListener("wheel", onWheel)
            el.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointerup", onUp)
        }
    }, [])


    return (
        <section className="pizza-showcase" ref={scrollerRef}>
            <div className="pizza-showcase-track">
                {loopPizzas.map((p, i) => (

                    <div
                        className="pizza-showcase-card"
                        key={i}
                        onClick={() => {
                            const tops = Array.isArray(p.topIds) ? p.topIds.join(",") : ""
                            navigate(`/builder/pizza?size=${encodeURIComponent(p.sizeId || "md")}&crust=${encodeURIComponent(p.crustId)}&sauce=${encodeURIComponent(p.sauceId)}&tops=${encodeURIComponent(tops)}`)
                        }}
                    >
                        <PizzaVisualizer
                            crustId={p.crustId}
                            crustImg={p.crustImg}
                            sauceImg={p.sauceImg}
                            toppingImgs={p.topImgs}
                            size={180}
                        />
                    </div>
                ))}
            </div>
        </section>
    )



}
