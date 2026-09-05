"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { SidebarProvider } from "@workspace/ui/components/sidebar"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { LenisProvider } from "@/components/shared/lenis-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Toaster } from "sonner"
import { getQueryClient } from "@/lib/query-client"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <ThemeProvider>
      <LenisProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider delay={300}>
              <SidebarProvider>
                {children}
                <Toaster richColors closeButton />
              </SidebarProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LenisProvider>
    </ThemeProvider>
  )
}
