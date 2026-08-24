"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, Menu, X, BookOpen, Store, Sparkles, LogIn, ArrowRight } from "lucide-react";

export function PublicNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Vortex Padrão.svg"
            alt="Vórtex+"
            className="h-6 sm:h-7 w-auto brightness-0 invert transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#como-funciona"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Como Funciona
          </Link>
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            Templates
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Docs
          </Link>
        </nav>

        {/* Actions (Desktop + Mobile CTA) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <Link
              href="/admin/templates"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <LayoutTemplate className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Meus Templates</span>
              <span className="sm:hidden">Templates</span>
            </Link>
          ) : (
            <>
              <Link
                href="/admin/login"
                className="hidden sm:inline-flex text-sm font-medium text-neutral-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Entrar
              </Link>
              <Link
                href="/admin/login?mode=register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Começar grátis</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden xs:inline" />
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 top-16 bg-black/80 backdrop-blur-md z-40"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed top-16 left-0 right-0 bg-zinc-950 border-b border-white/10 p-6 z-50 shadow-2xl flex flex-col gap-4"
            >
              <nav className="flex flex-col gap-2">
                <Link
                  href="/#como-funciona"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  Como Funciona
                </Link>
                <Link
                  href="/templates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Store className="w-4 h-4 text-primary" />
                  Templates
                </Link>
                <Link
                  href="/docs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  Documentação
                </Link>
              </nav>

              <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                {!isLoggedIn && (
                  <Link
                    href="/admin/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Entrar na Conta
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}