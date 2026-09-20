"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { hardLogout } from "@/lib/hardLogout";

type AuthContextType = {
  user: any;
  accessToken: string | null;
  isLoading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const inactivityTimer = React.useRef<NodeJS.Timeout | null>(null);


  const tryRefreshToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) return false;

      const json = await res.json();
      if (!json.success) return false;

      setAccessToken(json.data.accessToken);
      return json.data.accessToken;
    } catch {
      return false;
    }
  };

  /* ================= FETCH PROFILE ================= */

  const fetchProfile = async (token: string) => {
    let res = await fetch(`${API_BASE_URL}/students/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 🔥 If access token expired → try refresh
    if (res.status === 401) {
      const newToken = await tryRefreshToken();

      if (!newToken) {
        hardLogout();
        return false;
      }

      res = await fetch(`${API_BASE_URL}/students/profile`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    const json = await res.json();

    if (!json.success) {
      hardLogout();
      return false;
    }

    setUser(json.data);
    return true;
  };

  /* ================= REFRESH USER (AFTER PAYMENT) ================= */

  const refreshUser = async () => {
    if (!accessToken) return false;
    return await fetchProfile(accessToken);
  };

  /* ================= LOGIN ================= */

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    const res = await fetch(`${API_BASE_URL}/students/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!json.success) {
      setIsLoading(false);
      return false;
    }

    setAccessToken(json.data.accessToken);
    // await fetchProfile(json.data.accessToken);
    const ok = await fetchProfile(json.data.accessToken);
    if (!ok) {
      hardLogout();
      return false;
    }

    setIsLoading(false);
    setAuthReady(true);
    return true;
  };

  /* ================= INIT AUTH (PAGE REFRESH FIX) ================= */

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/students/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("No session");
        }

        const json = await res.json();

        if (json.success && isMounted) {
          setAccessToken(json.data.accessToken);
          await fetchProfile(json.data.accessToken);
        }
      } catch (err) {
        // ✅ expected when not logged in
        console.log("No existing session");
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
          // hardLogout();
        }

      } finally {
        if (isMounted) {
          setIsLoading(false);
          setAuthReady(true); // 🔥 GUARANTEED
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
  if (!accessToken) return;

  const resetTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      console.log("⏳ Inactive for 5 minutes → Logging out");
      logout();
    }, 5 * 60 * 1000);
  };

  const events = ["click", "mousemove", "keydown", "scroll"];

  events.forEach((event) => {
    window.addEventListener(event, resetTimer);
  });

  resetTimer(); // start timer immediately

  return () => {
    events.forEach((event) => {
      window.removeEventListener(event, resetTimer);
    });

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
  };
}, [accessToken]);

  /* ================= LOGOUT ================= */

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/students/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { }

    setUser(null);
    setAccessToken(null);
    // hardLogout();
    // setAuthReady(true);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        authReady,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
