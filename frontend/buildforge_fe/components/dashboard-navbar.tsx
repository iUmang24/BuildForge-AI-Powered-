"use client";

import { Menu } from "lucide-react";

interface DashboardNavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function DashboardNavbar({ onMenuClick, title }: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border lg:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        {title && <h1 className="font-semibold text-foreground">{title}</h1>}
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
    </header>
  );
}
