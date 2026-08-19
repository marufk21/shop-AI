"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useLenis } from "lenis/react"
import { ArrowUp } from "@phosphor-icons/react"

export function BackToTop() {
  const prefersReducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const lenis = useLenis()

  const checkScroll = useCallback(() => {
    // Lenis virtual scroll: use the instance's scroll value when available,
    // falling back to native scrollY for environments without Lenis
    const scrollY = lenis?.scroll ?? window.scrollY
    setVisible(scrollY > 400)
  }, [lenis])

  useEffect(() => {
    // Lenis emits its own 'scroll' event when the virtual scroll value changes
    if (lenis) {
      lenis.on("scroll", checkScroll)
      return () => {
        lenis.off("scroll", checkScroll)
      }
    }
    // Fallback: native scroll listener when Lenis is not available
    window.addEventListener("scroll", checkScroll, { passive: true })
    return () => window.removeEventListener("scroll", checkScroll)
  }, [lenis, checkScroll])

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0)
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-40 flex size-9 items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground shadow-md transition-colors hover:border-border hover:text-foreground hover:shadow-lg md:hidden"
          aria-label="Back to top"
        >
          <ArrowUp className="size-4" weight="bold" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
