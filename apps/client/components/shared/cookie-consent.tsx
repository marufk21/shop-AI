"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Cookie, X } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"

const STORAGE_KEY = "shopai-cookie-consent"

export function CookieConsent() {
  const prefersReducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined")
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-consent"
          initial={prefersReducedMotion ? {} : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-16 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border/60 bg-popover p-4 shadow-lg md:bottom-6 md:left-auto md:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Cookie className="size-4 text-primary" weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-foreground">
                We use cookies to enhance your browsing experience and analyze
                site traffic. By continuing, you agree to our use of cookies.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={accept}
                  size="xs"
                  className="h-7 rounded-lg px-3 text-[11px] font-semibold"
                >
                  Accept All
                </Button>
                <Button
                  onClick={decline}
                  variant="ghost"
                  size="xs"
                  className="h-7 rounded-lg px-3 text-[11px] font-medium"
                >
                  Decline
                </Button>
              </div>
            </div>
            <button
              onClick={decline}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close cookie notice"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
