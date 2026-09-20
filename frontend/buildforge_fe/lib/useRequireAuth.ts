"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAuth = () => {
  const { accessToken, authReady, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !accessToken) {
      router.replace("/login");
    }
  }, [authReady, accessToken, router]);

  return {
    canRender: authReady && !!accessToken && !isLoading,
  };
};
