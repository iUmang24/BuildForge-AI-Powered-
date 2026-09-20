"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/bflogo.png"   // or .svg
              alt="BuildForge"
              width={180}
              height={45}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="/#route" className="text-muted-foreground hover:text-foreground transition-colors">
              Path
            </Link>
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#certificate" className="text-muted-foreground hover:text-foreground transition-colors">
              Certificate
            </Link>
            <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              Faq
            </Link>
            <Link href="/#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/apply">Apply Now</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/#how-it-works"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link
              href="/#features"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#testimonials"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/apply">Apply Now</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
