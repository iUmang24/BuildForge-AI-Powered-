"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FileCheck,
  LifeBuoy,
  LogOut,
  GraduationCap,
  X,
  Users,
  Mail,
  Megaphone,
  Settings,
  CreditCard,
  Ticket,
  Building,
  FolderKanban,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/submissions", label: "Submissions", icon: FileCheck },
  { href: "/admin/direct-certificates", label: "Evaluate Certificate", icon: GraduationCap },
  { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy },  
  { href: "/admin/email-templates", label: "Email Templates", icon: Mail },
  { href: "/admin/document-templates", label: "Document Templates", icon: FileCheck },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/app-settings", label: "App Settings", icon: Settings },
  { href: "/admin/colleges", label: "Colleges", icon: Building  },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban    },
  { href: "/admin/pricing", label: "Pricing", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket   },
  { href: "/admin/project-weeks", label: "Weekly Projects", icon: Calendar   },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

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
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">
                  AD
                </span>
              </div>
              <span className="font-semibold text-sidebar-foreground">
                Admin Panel
              </span>
            </Link>

            <button
              onClick={onClose}
              className="p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Info */}
          {admin && (
            <div className="p-4 border-b border-sidebar-border text-center">
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarFallback className="text-lg font-semibold">
                  {admin.email?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>

              <div className="text-sm font-semibold text-sidebar-foreground">
                {admin.email}
              </div>

              <div className="text-xs text-sidebar-foreground/60">
                {admin.role}
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
              onClick={logout}
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
