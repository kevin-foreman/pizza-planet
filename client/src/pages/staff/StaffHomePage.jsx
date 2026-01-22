import React from 'react'
import { Link } from 'react-router-dom'

export default function StaffHomePage() {
    return (
        <div className="page">
            <div className="page-header center-title">
                <h1>Staff</h1>
                <p className="page-sub">Orders and clock in/out.</p>
            </div>

            <div className="panel helper staff-home-actions">
                <Link className="menu-card" to="/staff/orders">Orders</Link>
                <Link className="menu-card" to="/staff/clock">Clock In / Out</Link>
            </div>

        </div>
    )
}
