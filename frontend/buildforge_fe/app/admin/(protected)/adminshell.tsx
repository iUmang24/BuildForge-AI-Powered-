"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminNavbar } from "@/components/admin-navbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, authReady, accessToken } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !admin && !accessToken) {
      router.replace("/admin/login");
    }
  }, [authReady, admin, accessToken, router]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <AdminNavbar
        onMenuClick={() => setSidebarOpen(true)}
        title="Admin Dashboard"
      />
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
