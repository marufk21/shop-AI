"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError, apiClient } from "@/server/api-client"
import type { AuthIntent, AuthResponse, AuthUser } from "@/types/auth"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"
type AuthTab = "signin" | "signup"

interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  isModalOpen: boolean
  intent: AuthIntent | null
  preferredTab: AuthTab
  openAuthModal: (intent?: AuthIntent | null, tab?: AuthTab) => void
  closeAuthModal: () => void
  refreshAuth: () => Promise<AuthUser | null>
  setAuthenticatedUser: (user: AuthUser | null) => void
  consumeIntent: () => AuthIntent | null
}

const authQueryKey = ["auth", "me"] as const
const AuthContext = React.createContext<AuthContextValue | null>(null)

async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.get<AuthResponse>("/api/auth/me")
    return response.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [intent, setIntent] = React.useState<AuthIntent | null>(null)
  const [preferredTab, setPreferredTab] = React.useState<AuthTab>("signin")

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: false,
  })

  const status: AuthStatus = isLoading
    ? "loading"
    : user
      ? "authenticated"
      : "unauthenticated"

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status,
      user: user ?? null,
      isModalOpen,
      intent,
      preferredTab,
      openAuthModal: (nextIntent = null, tab = "signin") => {
        setIntent(nextIntent)
        setPreferredTab(tab)
        setIsModalOpen(true)
      },
      closeAuthModal: () => setIsModalOpen(false),
      refreshAuth: async () => {
        const result = await refetch()
        return result.data ?? null
      },
      setAuthenticatedUser: (nextUser) => {
        queryClient.setQueryData(authQueryKey, nextUser)
      },
      consumeIntent: () => {
        const currentIntent = intent
        setIntent(null)
        return currentIntent
      },
    }),
    [intent, isModalOpen, preferredTab, queryClient, refetch, status, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
