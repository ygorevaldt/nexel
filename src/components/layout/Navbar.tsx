"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Sparkles, Trophy, Wallet, User as UserIcon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/feed", label: "Talentos", icon: Sparkles },
    { href: "/dashboard", label: "CT de Bolso", icon: Shield },
    { href: "/challenges", label: "Desafios", icon: Trophy },
    { href: "/wallet", label: "Carteira", icon: Wallet },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 max-w-7xl mx-auto px-4 md:px-8 items-center w-full justify-between">
        
        {/* Mobile Menu Toggle */}
        <div className="flex items-center md:hidden">
          <Button variant="ghost" className="px-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-foreground" />}
          </Button>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(255,179,0,0.5)]" />
          <span className="font-black tracking-tight text-lg uppercase">
            FF Elite Hub
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav className="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest text-[#a1a1aa]">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 transition-all hover:text-primary ${
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(255,179,0,0.3)]" : "text-foreground/70"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile */}
        <div className="flex items-center justify-end">
          <nav className="flex items-center space-x-2">
            <Button variant="outline" className="h-10 w-10 p-0 rounded-full border-primary/30 hover:bg-primary/10 transition-colors">
               <span className="sr-only">Profile</span>
               <Avatar className="h-8 w-8">
                 <AvatarImage src="" alt="User" />
                 <AvatarFallback className="bg-primary/20 text-primary font-bold"><UserIcon className="h-4 w-4" /></AvatarFallback>
               </Avatar>
            </Button>
          </nav>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-4 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-4">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center p-3 rounded-xl transition-all font-bold uppercase tracking-widest text-sm ${
                    isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
