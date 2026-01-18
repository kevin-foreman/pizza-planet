import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function routeForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff/orders";
  return "/menu";
}

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user =
        mode === "signup"
          ? await signup(email, password, displayName)
          : await login(email, password);

      navigate(routeForRole(user.role), { replace: true });
    } catch (err) {
      setError(err?.message || "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: "420px", margin: "40px auto" }}>
      <h1 style={{ textAlign: "center" }}>
        {mode === "signup" ? "Create Account" : "Sign In"}
      </h1>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        {mode === "signup" && (
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

        <button type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
