"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import AdminLoading from "@/app/(admin)/admin/loading"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, status, openAuthModal } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/store")
      openAuthModal()
    } else if (status === "authenticated" && user?.role !== "admin") {
      router.replace("/store")
    }
  }, [status, user, router, openAuthModal])

  if (status === "loading") {
    return <AdminLoading />
  }

  if (status === "unauthenticated" || !user || user.role !== "admin") {
    return <AdminLoading />
  }

  return <>{children}</>
}
