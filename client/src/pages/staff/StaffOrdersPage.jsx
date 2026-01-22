import React, { useEffect, useState } from "react"
import StaffOrderCard from "../../components/staff/StaffOrderCard.jsx"
import { useAuth } from "../../context/AuthContext.jsx"

export default function StaffOrdersPage() {
    const { token } = useAuth()
    const [orders, setOrders] = useState([])
    const [error, setError] = useState("")

    useEffect(() => {
        if (!token) return
        fetch("/api/staff/orders", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setOrders)
    }, [token])

    return (
        <div className="page">
            <h1 className="page-title">Orders</h1>

            <div className="order-list">
                {(Array.isArray(orders) ? orders : []).map(o => (

                    <StaffOrderCard
                        key={o._id}
                        order={o}
                        onPatch={(id, patch) =>
                            fetch(`/api/staff/orders${id}`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify(patch)
                            })
                        }
                    />
                ))}
            </div>
        </div>
    )
}
