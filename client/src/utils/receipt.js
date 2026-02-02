function money(n) {
    const x = Number(n || 0)
    return x.toFixed(2)
}

export function buildReceiptText({ orderId, track, now, groupItems }) {
    const lines = []
    const date = new Date(track?.createdAt || track?.placedAt || track?.updatedAt || now).toLocaleString()

    lines.push("PIZZA PLANET")
    lines.push("RECEIPT")
    lines.push("")
    lines.push(`Order ID : ${orderId}`)
    lines.push(`Status   : ${String(track?.status || "").toUpperCase()}`)
    lines.push(`Date     : ${date}`)
    lines.push("")
    lines.push("========================================")
    lines.push("ITEMS")
    lines.push("========================================")

    const items = Array.isArray(track?.items) ? track.items : []
    const grouped = typeof groupItems === "function" ? groupItems(items) : items.map(it => ({ it, qty: Number(it?.qty || 1) }))

    for (const g of grouped) {
        const it = g.it || g
        const qty = g.qty || Number(it?.qty || 1)
        const d = it?.display || {}
        const name = String(it?.name || "Pizza")

        lines.push(`${qty} x ${name}`)

        const parts = []
        if (d.size) parts.push(d.size)
        if (d.crust) parts.push(d.crust)
        if (d.sauce) parts.push(d.sauce)
        if (parts.length) lines.push(`  ${parts.join(" | ")}`)

        const tops = Array.isArray(d.toppings) ? d.toppings : (Array.isArray(it?.toppings) ? it.toppings : [])
        if (tops.length) lines.push(`  Toppings: ${tops.join(", ")}`)

        if (it?.notes) lines.push(`  Notes   : ${it.notes}`)
        if (it?.deliveryNotes) lines.push(`  Notes   : ${it.deliveryNotes}`)
        lines.push("")
    }

    lines.push("----------------------------------------")
    lines.push(`Subtotal : $${money(track?.subtotal)}`)
    lines.push(`Tax      : $${money(track?.tax)}`)
    lines.push(`Tip      : $${money(track?.tip)}`)
    lines.push("----------------------------------------")
    lines.push(`TOTAL    : $${money(track?.total)}`)
    lines.push("----------------------------------------")
    lines.push("")
    lines.push("Thank you for your purchase!")
    lines.push("")
    lines.push(`
.---------------------------------.
|  .---------------------------.  |
|[]|  P I Z Z A   P L A N E T  |[]|
|  |                           |  |
|  |  By Brandon Bradway       |  |
|  |     Kevin Foreman         |  |
|  |     Matt Oravec           |  |
|  |                           |  |
|  |  For Professor            |  |
|  |  T'Chris       Gardner    |  |
|  |                           |  |
|  \`---------------------------'  |
|      __________________ _____   |
|     |   ___            |     |  |
|     |  |   |           |     |  |
|     |  |   |           |     |  |
|     |  |   |           |     |  |
|     |  |___|           |     |  |
\\_____|__________________|_____|__|
`)

    return lines.join("\n")
}

export function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}
