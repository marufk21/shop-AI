"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ShoppingCart,
  Sun,
  Moon,
  ShoppingBag,
  SignIn,
  SignOut,
  UserCircle,
  CaretDown,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useCart } from "./cart-provider"
import { cn } from "@workspace/ui/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { apiClient } from "@/server/api-client"

export function StoreNavbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  const [scrolled, setScrolled] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const { itemCount, openCart } = useCart()
  const { openAuthModal, setAuthenticatedUser, status, user } = useAuth()
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Defer rendering the themed icon until after mount — SSR can't know
  // the user's theme preference, so the SVG paths always mismatch.
  const themeIcon =
    resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/store/products?q=${encodeURIComponent(q)}` : "/store/products")
    setSearchQuery("")
  }

  async function handleSignOut() {
    await apiClient.post("/api/auth/signout")
    setAuthenticatedUser(null)
    router.refresh()
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "bg-background/80 backdrop-blur-xl shadow-xs"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Left: Logo + Search (Flipkart-style, search next to the brand) */}
          <div className="flex flex-1 min-w-0 items-center gap-3">
            <Link
              href="/store"
              className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight select-none group shrink-0"
            >
              <Image
                src="/logo.png"
                alt="ShopAI Logo"
                width={32}
                height={32}
                priority
                className="size-8 rounded-md object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="bg-linear-to-r from-foreground to-foreground/80 bg-clip-text inline text-base sm:text-lg">
                Shop AI
              </span>
            </Link>

            <form
              role="search"
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex flex-1 max-w-xs items-center overflow-hidden rounded-lg border border-border/60 bg-muted/30 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
            >
              <label htmlFor="store-search" className="sr-only">
                Search products
              </label>
              <input
                id="store-search"
                name="q"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search for products, brands and more"
                className="h-7 w-full min-w-0 flex-1 bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none"
              />
              <button
                type="submit"
                aria-label="Search products"
                className="flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground cursor-pointer"
              >
                <MagnifyingGlass className="size-4" weight="bold" />
              </button>
            </form>
          </div>

          {/* Right: Actions - Desktop */}
          <div className="hidden md:flex items-center justify-end gap-1 shrink-0">
            {/* Theme Switcher — placeholder during SSR to prevent CLS */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            >
              {mounted ? themeIcon : <span className="size-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={openCart}
              className="relative text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            >
              <ShoppingCart className="size-4" />
              {mounted && itemCount > 0 && (
                <span aria-live="polite" className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
              <span className="sr-only">View cart</span>
            </Button>

            {status === "authenticated" ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                    >
                      <UserCircle className="size-4" />
                      <span className="hidden lg:inline">
                        {user?.username ?? "User"}
                      </span>
                      <CaretDown
                        weight="bold"
                        className="hidden sm:inline size-2.5 text-muted-foreground/70"
                      />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-60 rounded-xl p-1.5"
                >
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal("account", "signin")}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
              >
                <SignIn className="size-4" />
                <span className="hidden lg:inline">Sign in</span>
              </Button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-1 ml-auto">
            {/* Search Button - Mobile */}
            {/* <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/store/products")}
              aria-label="Search products"
              className="text-muted-foreground hover:text-foreground rounded-lg"
            >
              <MagnifyingGlass className="size-4" />
            </Button> */}

            {/* Theme Switcher — placeholder during SSR to prevent CLS */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="text-muted-foreground hover:text-foreground rounded-lg"
            >
              {mounted ? themeIcon : <span className="size-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
