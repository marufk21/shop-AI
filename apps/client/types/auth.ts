export interface AuthUser {
  id: string
  email: string
  username?: string | null
  role: "customer" | "admin"
  eligibility: "standard" | "full"
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: AuthUser
}

export type AuthIntent = "checkout" | "account" | "wishlist"
