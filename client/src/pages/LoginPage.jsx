import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

function routeForRole(role) {
  if (role === "admin") return "/admin"
  if (role === "staff") return "/staff/orders"
  return "/"
}

function countMatches(str, re) {
  const m = str.match(re)
  return m ? m.length : 0
}

function passwordCheck(pw) {
  const s = String(pw || "")
  return {
    len: s.length >= 8,
    upper: countMatches(s, /[A-Z]/g) >= 2,
    lower: countMatches(s, /[a-z]/g) >= 2,
    num: countMatches(s, /[0-9]/g) >= 2,
    special: countMatches(s, /[^A-Za-z0-9]/g) >= 2,
  }
}

function passwordOk(pw) {
  const c = passwordCheck(pw)
  return c.len && c.upper && c.lower && c.num && c.special
}

function isValidDisplayName(name) {
  const s = String(name || '').trim()
  if (!s) return false
  if (s.length < 5 || s.length > 30) return false
  if (!/^[A-Za-z0-9 _.-]+$/.test(s)) return false
  return true
}

function isValidEmail(email) {
  const s = String(email || '').trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export default function LoginPage() {
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState("login")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const pw = passwordCheck(password)
  const canSubmit = mode === "signup"
    ? true
    : email.trim() && password.length > 0

  async function onSubmit(e) {
    e.preventDefault()
    setError("")

    if (mode === "signup") {
      if (!displayName.trim()) {
        setError("Display name is required.")
        return
      }
      if (!isValidDisplayName(displayName)) {
        setError("Display name must be 5–30 characters and use letters, numbers, spaces, _ . - only.")
        return
      }
    }

    if (!email.trim()) {
      setError("Email is required.")
      return
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (!password) {
      setError("Password is required.")
      return
    }
    if (mode === "signup" && !passwordOk(password)) {
      setError("Password does not meet the required rules.")
      return
    }

    setBusy(true)
    try {
      const user = mode === "signup"
        ? await signup(email, password, displayName)
        : await login(email, password)

      navigate(routeForRole(user.role), { replace: true })
    } catch (err) {
      setError(err?.message || "Auth failed")
    } finally {
      setBusy(false)
    }
  }


  return (
    <div style={{ maxWidth: "420px", margin: "40px auto" }}>
      <h1 style={{ textAlign: "center" }}>
        {mode === "signup" ? "Create Account" : "Sign In"}
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <button type="button" disabled={busy} onClick={() => setMode("login")}>
          Sign in
        </button>

        <button type="button" disabled={busy} onClick={() => setMode("signup")}>
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: "grid", gap: 12 }}>

        {mode === "signup" && (
          <label>
            Display name
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        {mode === "signup" && (
          <div className="panel" style={{ marginTop: 4 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Password requirements</div>
            <ul style={{ margin: 0, paddingLeft: 18, opacity: .9 }}>
              <li style={{ opacity: pw.len ? 1 : .55 }}>At least 8 characters</li>
              <li style={{ opacity: pw.upper ? 1 : .55 }}>At least 2 uppercase letters</li>
              <li style={{ opacity: pw.lower ? 1 : .55 }}>At least 2 lowercase letters</li>
              <li style={{ opacity: pw.num ? 1 : .55 }}>At least 2 numbers</li>
              <li style={{ opacity: pw.special ? 1 : .55 }}>At least 2 special characters</li>
            </ul>
          </div>
        )}

        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

        <button
          type="submit"
          disabled={busy || !canSubmit}
          style={{ width: "100%" }}
          title={mode === "signup" && !passwordOk(password) ? "Password does not meet requirements" : ""}
        >
          {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  )
}
