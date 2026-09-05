"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import AdminLoading from "@/app/(admin)/admin/loading"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, status, openAuthModal } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    if (status === "unauthenticated") {
      router.replace("/store")
      openAuthModal()
    } else if (status === "authenticated" && user?.role !== "admin") {
      router.replace("/store")
    }
  }, [mounted, status, user, router, openAuthModal])

  if (!mounted || status === "loading") {
    return <AdminLoading />
  }

  if (status === "unauthenticated" || !user || user.role !== "admin") {
    return <AdminLoading />
  }

  return <>{children}</>
}
