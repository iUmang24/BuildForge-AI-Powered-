"use client";

import { AdminAuthProvider } from "@/lib/admin-auth-context";
import AdminShell from "./adminshell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>{children}</AdminShell>
  );
}
