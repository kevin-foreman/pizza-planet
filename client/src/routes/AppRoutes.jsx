import React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"

import LoginPage from "../pages/LoginPage.jsx"
import HomePage from "../pages/HomePage.jsx"
import MenuPage from "../pages/MenuPage.jsx"
import PizzaBuilderPage from "../pages/PizzaBuilderPage.jsx"
import SaladBuilderPage from "../pages/SaladBuilderPage.jsx"
import CalzoneBuilderPage from "../pages/CalzoneBuilderPage.jsx"
import CheckoutPage from "../pages/CheckoutPage.jsx"
import CartPage from "../pages/CartPage.jsx"
import OrderTrackPage from "../pages/OrderTrackPage.jsx"
import OrderConfirmationPage from "../pages/OrderConfirmationPage.jsx"
import OrderHistoryPage from "../pages/OrderHistoryPage.jsx"

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

function RedirectWithSearch({ to }) {
  const location = useLocation()
  return <Navigate to={`${to}${location.search}`} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />

      <Route path="/builder" element={<RedirectWithSearch to="/builder/pizza" />} />
      <Route path="/builder/pizza" element={<PizzaBuilderPage />} />
      <Route path="/builder/salad" element={<SaladBuilderPage />} />
      <Route path="/builder/calzone" element={<CalzoneBuilderPage />} />

      <Route path="/build/pizza" element={<RedirectWithSearch to="/builder/pizza" />} />
      <Route path="/build/salad" element={<RedirectWithSearch to="/builder/salad" />} />
      <Route path="/build/calzone" element={<RedirectWithSearch to="/builder/calzone" />} />
      <Route path="/orders" element={<OrderHistoryPage />} />


      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />

      <Route path="/order/:id" element={<OrderTrackPage />} />

      <Route path="/staff" element={<RequireRole roles={["staff", "admin"]}><StaffHomePage /></RequireRole>} />
      <Route path="/staff/archived" element={<RequireRole roles={["staff", "admin"]}><ArchivedOrdersPage /></RequireRole>} />
      <Route path="/staff/clock" element={<RequireRole roles={["staff", "admin"]}><StaffClockPage /></RequireRole>} />
      <Route path="/staff/orders" element={<RequireRole roles={["staff", "admin"]}><StaffOrdersPage /></RequireRole>} />

      <Route path="/admin" element={<RequireRole role="admin"><AdminDashboardPage /></RequireRole>} />
      <Route path="/admin/pricing" element={<RequireRole role="admin"><AdminPricingPage /></RequireRole>} />
      <Route path="/admin/toppings" element={<RequireRole role="admin"><ToppingsPage /></RequireRole>} />
      <Route path="/admin/users" element={<RequireRole role="admin"><AdminUsersPage /></RequireRole>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
