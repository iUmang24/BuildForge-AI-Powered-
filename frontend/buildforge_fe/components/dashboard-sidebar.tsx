"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Award,
  LogOut,
  X,
  CreditCard,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/certificate", label: "Certificate", icon: Award },
  { href: "/help", label: "Need Help", icon: LifeBuoy },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
];

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout(); // 🔥 logout already redirects to /login
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/bflogo.png"   // change if svg
                alt="BUILDFORGE"
                width={200}
                height={50}
                className="object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-sidebar-border text-center">
              {/* Avatar */}
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarFallback className="text-lg font-semibold">
                  {user.full_name
                    ?.trim()
                    .split(/\s+/)          // handles multiple spaces safely
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="text-sm font-semibold text-sidebar-foreground">
                {user.full_name}
              </div>

              {/* Program / Email */}
              <div className="text-xs text-sidebar-foreground/60 truncate">
                {user.email}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
