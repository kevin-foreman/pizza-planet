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

/* Staff pages */
import StaffHomePage from '../pages/staff/StaffHomePage.jsx'
import StaffClockPage from '../pages/staff/StaffClockPage.jsx'
import StaffOrdersPage from "../pages/staff/StaffOrdersPage.jsx"
import ArchivedOrdersPage from "../pages/staff/ArchivedOrdersPage.jsx"

/* Admin pages */
import ToppingsPage from "../pages/admin/ToppingsPage.jsx"
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx'
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx"
import AdminPricingPage from "../pages/admin/AdminPricingPage.jsx"

/* protected route */
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
      <Route path="/order-confirmation" element={<div style={{ padding: 16 }}>Thank you for your Purchase (There will be a track here soon)</div>} />

      {/*protected role routes */}
      <Route
        path="/staff"
        element={
          <RequireRole roles={["staff", "admin"]}>
            <StaffHomePage />
          </RequireRole>
        }
      />
      <Route
        path="/staff/archived"
        element={
          <RequireRole roles={["staff", "admin"]}>
            <ArchivedOrdersPage />
          </RequireRole>
        }
      />
      <Route
        path="/staff/clock"
        element={
          <RequireRole roles={["staff", "admin"]}>
            <StaffClockPage />
          </RequireRole>
        }
      />
      <Route
        path="/staff/orders"
        element={
          <RequireRole roles={["staff", "admin"]}>
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
      <Route
        path="/admin/users"
        element={
          <RequireRole role="admin">
            <AdminUsersPage />
          </RequireRole>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
