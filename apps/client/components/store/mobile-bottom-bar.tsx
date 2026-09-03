"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  House,
  MagnifyingGlass,
  ChatCircle,
  ShoppingCart,
  UserCircle,
  SignIn,
  SignOut,
  ShoppingBag,
} from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useCart } from "@/components/store/cart-provider"
import { useAuth } from "@/components/auth/auth-provider"
import { apiClient } from "@/server/api-client"
import { cn } from "@workspace/ui/lib/utils"

export function MobileBottomBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount, openCart } = useCart()
  const { openAuthModal, setAuthenticatedUser, status, user } = useAuth()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignOut() {
    await apiClient.post("/api/auth/signout")
    setAuthenticatedUser(null)
    router.refresh()
  }

  const links = [
    {
      href: "/store",
      label: "Home",
      icon: House,
      active: pathname === "/store",
    },
    {
      href: "/store/products",
      label: "Search",
      icon: MagnifyingGlass,
      active: pathname === "/store/products",
    },
    {
      href: "#",
      label: "Cart",
      icon: ShoppingCart,
      active: false,
      badge: itemCount,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        openCart()
      },
    },
    {
      href: "#",
      label: "Chat",
      icon: ChatCircle,
      active: false,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        const trigger = document.querySelector<HTMLButtonElement>(
          '[aria-label="Open chat"]'
        )
        trigger?.click()
      },
    },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-background/80 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.label}
              href={link.href}
              onClick={link.onClick}
              aria-current={link.active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors",
                link.active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="relative">
                <Icon className="size-5" weight={link.active ? "fill" : "regular"} />
                {mounted && "badge" in link && link.badge != null && link.badge > 0 && (
                  <span aria-live="polite" className="absolute -top-1.5 -right-2.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {(link.badge ?? 0) > 9 ? "9+" : (link.badge ?? 0)}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold">{link.label}</span>
            </Link>
          )
        })}

        {/* Profile */}
        {status === "authenticated" ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors cursor-pointer bg-transparent border-0 p-0",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCircle className="size-5" weight="regular" />
              <span className="max-w-full truncate px-1 text-[10px] font-semibold">
                {mounted ? (user?.username ?? "Profile") : "Profile"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-60 rounded-xl p-1.5">
              <div className="flex items-center gap-3 px-2.5 py-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground">
                  {user?.username?.slice(0, 1).toUpperCase() ??
                    user?.email?.[0]?.toUpperCase() ??
                    "U"}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {user?.username ?? "User"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
                {user?.eligibility === "full" ? (
                  <span className="ml-auto shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Full access
                  </span>
                ) : null}
              </div>

              {user?.role === "admin" ? (
                <DropdownMenuItem
                  onClick={() => router.push("/admin")}
                  className="cursor-pointer"
                >
                  <ShoppingBag className="size-3.5" />
                  Admin Dashboard
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void handleSignOut()}
                className="cursor-pointer"
              >
                <SignOut className="size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("account", "signin")}
            className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            <SignIn className="size-5" weight="regular" />
            <span className="text-[10px] font-semibold">Profile</span>
          </button>
        )}
      </div>
    </nav>
  )
}
