"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useRouter } from "next/navigation";

type AdminAuthContextType = {
  admin: any;
  accessToken: string | null;
  isLoading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<boolean>;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();

  const [admin, setAdmin] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  /* ================= FETCH PROFILE ================= */

  const fetchProfile = async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (res.status === 401 || res.status === 403) {
      await logout();
      return false;
    }

    const json = await res.json();

    if (!json.success) {
      await logout();
      return false;
    }

    setAdmin(json.data);
    return true;
  };

  /* ================= REFRESH ADMIN ================= */

  const refreshAdmin = async () => {
    if (!accessToken) return false;
    return await fetchProfile(accessToken);
  };

  /* ================= LOGIN ================= */

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    const res = await fetch(`${API_BASE_URL}/admin/login`, {
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

    const ok = await fetchProfile(json.data.accessToken);
    if (!ok) return false;

    setIsLoading(false);
    setAuthReady(true);
    return true;
  };

  /* ================= INIT AUTH (PAGE REFRESH FIX) ================= */

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) throw new Error("No session");

        const json = await res.json();

        if (json.success && isMounted) {
          setAccessToken(json.data.accessToken);
          await fetchProfile(json.data.accessToken);
        }
      } catch {
        if (isMounted) {
          setAdmin(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setAuthReady(true);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ================= LOGOUT ================= */

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setAdmin(null);
    setAccessToken(null);

    router.replace("/admin/login");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        accessToken,
        isLoading,
        authReady,
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
};
