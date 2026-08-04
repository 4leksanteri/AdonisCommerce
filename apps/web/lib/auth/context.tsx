"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * `initialUser` is resolved server-side (see app/layout.tsx) by reading the
 * session cookie and calling the API — the client never talks to the API
 * or the session cookie directly, only through server actions.
 */
export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
