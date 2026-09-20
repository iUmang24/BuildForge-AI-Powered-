"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !user) {
      router.replace("/login");
    }
  }, [authReady, user, router]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <DashboardNavbar
        onMenuClick={() => setSidebarOpen(true)}
        title="Dashboard"
      />
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
