"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Shield,
  Sparkles,
  Trophy,
  Crown,
  Menu,
  X,
  LogOut,
  LogIn,
  ChevronDown,
  BrainCircuit,
  Sun,
  Moon,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();

  const links = [
    { href: "/feed", label: "Talentos", icon: Sparkles },
    { href: "/dashboard", label: "Coach IA", icon: BrainCircuit },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/subscription", label: "Planos", icon: Crown },
  ];

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "?";
  const isLoading = status === "loading";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
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
            Nexel
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

        {/* Auth Area */}
        <div className="flex items-center justify-end gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-1 py-1 pr-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
              <div className="hidden sm:flex flex-col gap-1.5">
                <div className="h-2.5 w-20 rounded-full bg-primary/20" />
                <div className="h-2 w-12 rounded-full bg-primary/10" />
              </div>
            </div>
          ) : session ? (
            /* Logged in: avatar dropdown */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-primary/30 hover:bg-primary/10 transition-colors px-1 py-1 pr-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-30 truncate">
                  {session.user?.name}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background shadow-xl shadow-black/20 py-1 z-50">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-semibold truncate">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                    <span className="inline-flex mt-1.5 items-center rounded-sm bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      {session.user?.subscriptionStatus || session.user?.role || "FREE"}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile/me"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged out: login + register buttons */
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
                className="hidden sm:flex gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
              <motion.div
                className="rounded-full"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                animate={{
                  boxShadow: [
                    "0 0 0px 0px rgba(255,179,0,0)",
                    "0 0 7px 1px rgba(255,179,0,0.35)",
                    "0 0 0px 0px rgba(255,179,0,0)",
                  ],
                }}
                transition={{
                  boxShadow: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
                  scale: { type: "spring", stiffness: 400, damping: 17 },
                }}
              >
                <Button size="sm" onClick={() => router.push("/register")} className="rounded-full">
                  Começar grátis
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-md px-4 py-4 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-2">
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

          {/* Mobile auth buttons */}
          {!session && !isLoading && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" onClick={() => { router.push("/login"); setMobileMenuOpen(false); }}>
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Button>
              <Button onClick={() => { router.push("/register"); setMobileMenuOpen(false); }}>
                Criar conta grátis
              </Button>
            </div>
          )}

          {session && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-3 px-1 py-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session.user?.image || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">{userInitial}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => { signOut({ callbackUrl: "/" }); setMobileMenuOpen(false); }}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
