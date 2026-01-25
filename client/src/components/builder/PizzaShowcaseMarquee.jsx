import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { jsonFetch } from "../../api/http.js"
import { usePricing } from "../../context/PricingContext.jsx"
import PizzaVisualizer from "./PizzaVisualizer.jsx"

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:4000"
function fixImg(u) {
    u = String(u || "")
    if (!u) return ""
    if (u.startsWith("http://") || u.startsWith("https://")) return u

    // uploaded (common forms)
    if (u.startsWith("/uploads/")) return API_ORIGIN + u
    if (u.startsWith("uploads/")) return API_ORIGIN + "/" + u

    // if your DB stores just "toppings/shrimp.webp"
    if (u.startsWith("toppings/")) return API_ORIGIN + "/uploads/" + u

    // leave Vite/local stuff alone (/assets, imported urls, etc.)
    return u
}

export default function PizzaShowcaseMarquee() {
    const { pricing, toppings, refreshPricing } = usePricing()
    const scrollerRef = useRef(null)
    const navigate = useNavigate()

    const [allToppings, setAllToppings] = useState([])

    useEffect(() => {
        refreshPricing()
        jsonFetch("/api/toppings").then(d => setAllToppings(Array.isArray(d) ? d : [])).catch(() => setAllToppings([]))
    }, [])

    const toppingById = useMemo(() => {
        const m = new Map()
        for (const t of toppings || []) {
            const keys = [
                t.id,
                t._id,
                t.code,
                t.slug,
            ].filter(Boolean).map(v => String(v))
            for (const k of keys) m.set(k, t)
        }
        return m
    }, [toppings])


    function pickRandom(arr, n) {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp
        }
        return copy.slice(0, n)
    }

    function randomToppingCount(total) {
        if (total <= 0) return 0
        const max = Math.min(8, total)
        return Math.floor(Math.random() * (max + 1))	//0..max
    }

    const pizzas = useMemo(() => {
        const sizes = pricing?.sizes || []
        const crusts = pricing?.crusts || []
        const sauces = pricing?.sauces || []
        const tops = (toppings || []).filter(t => (t?.image || t?.img || t?.url || t?.imageUrl))


        if (!sizes.length || !crusts.length || !sauces.length || !tops.length) return []

        const out = []
        const count = 7

        for (let i = 0; i < count; i++) {
            const size = sizes[Math.floor(Math.random() * sizes.length)]?.id || "md"
            const crust = crusts[Math.floor(Math.random() * crusts.length)] || crusts[0]
            const sauce = sauces[Math.floor(Math.random() * sauces.length)] || sauces[0]

            const picked = pickRandom(tops, randomToppingCount(tops.length))

            out.push({
                sizeId: size,
                crustId: crust.id,
                sauceId: sauce.id,
                topIds: picked.map(t => String(t.id || t._id || t.code || t.slug)),
                crustImg: fixImg(crust.image),
                sauceImg: fixImg(sauce.image),
                topImgs: picked.map(t => fixImg(t.image || t.img || t.url || t.imageUrl)).filter(Boolean),

            })
        }

        return out
    }, [pricing, toppings])



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
                            console.log("toppings count", toppings?.length, "tops with images", tops.length)

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
