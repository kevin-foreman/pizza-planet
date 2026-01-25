import { useMemo } from "react"

export default function PizzaVisualizer({ crustId = "", crustImg = "", sauceImg = "", toppingImgs = [], size = 160 }) {
    function hashStr(s) {
        let h = 2166136261
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i)
            h = Math.imul(h, 16777619)
        }
        return h >>> 0
    }
    const seed = useMemo(() => hashStr(`${crustId}|${sauceImg}|${(toppingImgs || []).join("|")}`), [crustId, sauceImg, toppingImgs])

    function mulberry32(a) {
        return function () {
            let t = a += 0x6D2B79F5
            t = Math.imul(t ^ t >>> 15, t | 1)
            t ^= t + Math.imul(t ^ t >>> 7, t | 61)
            return ((t ^ t >>> 14) >>> 0) / 4294967296
        }
    }
    function genSpotsSeparated(n, inner, outer, minDist, rng) {
        const out = []
        const maxAttempts = n * 120
        let attempts = 0
        let d = minDist
        while (out.length < n && attempts < maxAttempts) {
            attempts++
            const idx = out.length
            const slice = (Math.PI * 2) / n
            const a = idx * slice + (rng() * 2 - 1) * slice * 0.35
            const u = rng()
            const r = Math.sqrt(inner * inner + (outer * outer - inner * inner) * u)
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            let ok = true
            for (let i = 0; i < out.length; i++) {
                const dx = x - out[i].x
                const dy = y - out[i].y
                const s = (out[i].sc + 1) * 0.5
                if (dx * dx + dy * dy < (d * s) * (d * s)) { ok = false; break }
            }
            if (ok) {
                out.push({ x, y, rot: (rng() * 2 - 1) * 35, sc: 0.92 + rng() * 0.22 })
            }
            if (attempts % 120 === 0 && out.length < n) d *= 0.97
        }
        return out
    }

    const pieces = useMemo(() => {
        const rng = mulberry32(seed)
        const nodes = []
        const piece = 12
        const spread = 47.5
        const gap = 1.05
        const minDist = (piece * gap) / spread

        for (let i = 0; i < (toppingImgs || []).length; i++) {
            const img = toppingImgs[i]
            const count = 50 + Math.floor(rng() * (80 - 50 + 1))

            const ringBias = 0.45
            let ringCount = Math.round(count * ringBias)
            let centerCount = count - ringCount

            const minCenter = Math.min(24, Math.floor(count * 0.55))
            if (centerCount < minCenter) {
                centerCount = minCenter
                ringCount = count - centerCount
            }

            const ringSpots = genSpotsSeparated(ringCount, 0.72, 0.95, minDist, rng)
            const centerSpots = genSpotsSeparated(centerCount, 0.05, 0.75, minDist * 0.9, rng)
            const spots = [...ringSpots, ...centerSpots]

            for (let k = 0; k < spots.length; k++) {
                const p = spots[k]
                nodes.push(
                    <img
                        key={`${i}-${k}`}
                        className="topping-piece"
                        src={img}
                        alt=""
                        style={{
                            left: `calc(50% + ${p.x * 37.5}%)`,
                            top: `calc(50% + ${p.y * 37.5}%)`,
                            width: `${piece}%`,
                            height: `${piece}%`,
                            transform: `translate(-50%,-50%)rotate(${p.rot}deg)scale(${p.sc})`,
                        }}
                    />
                )
            }
        }

        return nodes
    }, [toppingImgs, seed])

    return (
        <div className="pizza-stage" style={{ width: size, height: size }}>
            <div className={`pizza-visualizer crust-${crustId}`}>
                {!!crustImg && <img className="pizza-layer base" src={crustImg} alt="" />}
                {!!sauceImg && <img className="pizza-layer sauce" src={sauceImg} alt="" />}
                {pieces}
            </div>
        </div>
    )
}
