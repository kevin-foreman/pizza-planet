import React, { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

function routeForRole(role) {
  if (role === "admin") return "/admin"
  if (role === "staff") return "/staff"
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
  const s = String(name || "").trim()
  if (!s) return false
  if (s.length < 5 || s.length > 30) return false
  if (!/^[A-Za-z0-9 _.-]+$/.test(s)) return false
  return true
}

function isValidEmail(email) {
  const s = String(email || "").trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export default function LoginPage() {
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const location = useLocation()

  const [mode, setMode] = useState("login")

  useEffect(() => {
    if (location.state?.mode === "signup") setMode("signup")
    if (location.state?.mode === "login") setMode("login")
  }, [location.state])

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

  const pwBadTip = mode === "signup" && !passwordOk(password) ? "Password does not meet requirements" : ""

  const showSignIn = mode !== "login"
  const showSignUp = mode !== "signup"
  const isSingle = (showSignIn ? 1 : 0) + (showSignUp ? 1 : 0) === 1
  return (
    <div className="container">
      <section className="panel auth-panel">
        <h1 className="center-title">{mode === "signup" ? "Create Account" : "Sign In"}</h1>

        <div className={`menu-toggle ${isSingle ? "single" : "split"}`}>
          {mode !== "login" && (
            <button
              type="button"
              className="menu-cta"
              disabled={busy}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
          )}

          {mode !== "signup" && (
            <button
              type="button"
              className="menu-cta"
              disabled={busy}
              onClick={() => setMode("signup")}
            >
              Create  new account
            </button>
          )}
        </div>



        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {mode === "signup" && (
            <label>
              Display name
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </label>
          )}

          <label>
            Email
            <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} required />
          </label>

          {mode === "signup" && (
            <div className="panel auth-pw-panel">
              <div className="auth-pw-title">Password requirements</div>
              <ul className="auth-pw-list">
                <li className={pw.len ? "ok" : "no"}>At least 8 characters</li>
                <li className={pw.upper ? "ok" : "no"}>At least 2 uppercase letters</li>
                <li className={pw.lower ? "ok" : "no"}>At least 2 lowercase letters</li>
                <li className={pw.num ? "ok" : "no"}>At least 2 numbers</li>
                <li className={pw.special ? "ok" : "no"}>At least 2 special characters</li>
              </ul>
            </div>
          )}

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="auth-submit" disabled={busy || !canSubmit} title={pwBadTip}>
            {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  )
}
