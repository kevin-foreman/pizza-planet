import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import LoginPage from '../pages/LoginPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import MenuPage from '../pages/MenuPage.jsx'
import PizzaBuilderPage from '../pages/PizzaBuilderPage.jsx'
import SaladBuilderPage from '../pages/SaladBuilderPage.jsx'
import CalzoneBuilderPage from '../pages/CalzoneBuilderPage.jsx'
import CheckoutPage from '../pages/CheckoutPage.jsx'
import OrderStatusPage from '../pages/OrderStatusPage.jsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import AdminPricingPage from '../pages/admin/AdminPricingPage.jsx'
import StaffOrdersPage from '../pages/staff/StaffOrdersPage.jsx'
import CartPage from '../pages/CartPage.jsx'

import RequireRole from './RequireRole.jsx'

function NotFound() {
	return (
		<div style={{ padding: '16px' }}>
			<h1>404</h1>
			<p>Page not found.</p>
		</div>
	)
}
/* temporary placeholders (we’ll replace these next) */
const StaffOrders = () => <h2>Staff Orders</h2>
const AdminPricing = () => <h2>Admin Pricing</h2>

export default function AppRoutes() {
	return (
		<Routes>
			{/* Auth */}
			<Route path="/login" element={<LoginPage />} />

			{/* Public / customer */}
			<Route path="/" element={<HomePage />} />
			<Route path="/menu" element={<MenuPage />} />

			{/* Builder routes */}
			<Route path="/builder" element={<Navigate to="/builder/pizza" replace />} />
			<Route path="/builder/pizza" element={<PizzaBuilderPage />} />
			<Route path="/builder/salad" element={<SaladBuilderPage />} />
			<Route path="/builder/calzone" element={<CalzoneBuilderPage />} />

			{/* Optional compatibility routes */}
			<Route path="/build/pizza" element={<Navigate to="/builder/pizza" replace />} />
			<Route path="/build/salad" element={<Navigate to="/builder/salad" replace />} />
			<Route path="/build/calzone" element={<Navigate to="/builder/calzone" replace />} />

			<Route path="/cart" element={<CartPage />} />
			<Route path="/checkout" element={<CheckoutPage />} />
			<Route path="/order/:orderId" element={<OrderStatusPage />} />
			{/* roles */}
			<Route path="/admin" element={<AdminDashboardPage />} />
			<Route path="/admin/pricing" element={<AdminPricingPage />} />
			<Route path="/staff/orders" element={<StaffOrdersPage />} />

			{/* Staff */}
			<Route
				path="/staff/orders"
				element={
					<RequireRole role="staff">
						<StaffOrders />
					</RequireRole>
				}
			/>

			{/* Admin */}
			<Route
				path="/admin/pricing"
				element={
					<RequireRole role="admin">
						<AdminPricing />
					</RequireRole>
				}
			/>

			{/* Catch-all */}
			<Route path="*" element={<NotFound />} />
		</Routes>
	)
}