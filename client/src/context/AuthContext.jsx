import React, { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "../api/auth.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "pp_token";
const USER_KEY = "pp_user";

function loadUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser());
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");

  function saveSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  async function login(email, password) {
    const result = await authApi.login({ email, password });
    saveSession(result.token, result.user);
    return result.user;
  }

  async function signup(email, password, displayName) {
    const result = await authApi.signup({ email, password, displayName });
    saveSession(result.token, result.user);
    return result.user;
  }

  function logout() {
    setUser(null);
    setToken("");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = useMemo(() => ({ user, token, login, signup, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
