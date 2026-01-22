import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function RequireRole({ role, roles, children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const allowed = Array.isArray(roles) ? roles : [role]
  if (!allowed.includes(user.role)) return <Navigate to="/" replace />

  return children
}
