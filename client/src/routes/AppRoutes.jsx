import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import LoginPage from "../pages/LoginPage.jsx"
import HomePage from "../pages/HomePage.jsx"
import MenuPage from "../pages/MenuPage.jsx"
import PizzaBuilderPage from "../pages/PizzaBuilderPage.jsx"
import SaladBuilderPage from "../pages/SaladBuilderPage.jsx"
import CalzoneBuilderPage from "../pages/CalzoneBuilderPage.jsx"
import CheckoutPage from "../pages/CheckoutPage.jsx"
import CartPage from "../pages/CartPage.jsx"
import OrderConfirmationPage from "../pages/OrderConfirmationPage.jsx"
import ToppingsPage from "../pages/admin/ToppingsPage.jsx"

import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx"
import AdminPricingPage from "../pages/admin/AdminPricingPage.jsx"
import StaffOrdersPage from "../pages/staff/StaffOrdersPage.jsx"

import RequireRole from "./RequireRole.jsx"

function NotFound() {
  return (
    <div style={{ padding: "16px" }}>
      <h1>404</h1>
      <p>Page not found.</p>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />

      <Route path="/builder" element={<Navigate to="/builder/pizza" replace />} />
      <Route path="/builder/pizza" element={<PizzaBuilderPage />} />
      <Route path="/builder/salad" element={<SaladBuilderPage />} />
      <Route path="/builder/calzone" element={<CalzoneBuilderPage />} />

      <Route path="/build/pizza" element={<Navigate to="/builder/pizza" replace />} />
      <Route path="/build/salad" element={<Navigate to="/builder/salad" replace />} />
      <Route path="/build/calzone" element={<Navigate to="/builder/calzone" replace />} />

      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-confirmation" element={<div style={{ padding: 16 }}>CONFIRM ROUTE WORKS</div>} />


      <Route
        path="/staff/orders"
        element={
          <RequireRole role="staff">
            <StaffOrdersPage />
          </RequireRole>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/pricing"
        element={
          <RequireRole role="admin">
            <AdminPricingPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/toppings"
        element={
          <RequireRole role="admin">
            <ToppingsPage />
          </RequireRole>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
