"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";

export function PublicNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Vortex Padrão.svg"
            alt="Vórtex+"
            className="h-7 w-auto brightness-0 invert transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/admin/templates"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" />
              Meus Templates
            </Link>
          ) : (
            <>
              <Link
                href="/admin/login"
                className="text-sm font-medium text-neutral-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Entrar
              </Link>
              <Link
                href="/admin/login?mode=register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                Começar grátis
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}