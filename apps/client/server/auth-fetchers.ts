import { cookies } from "next/headers"

import type { AuthResponse, AuthUser } from "@/types/auth"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function fetchServerAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ")

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    })
  } catch {
    // A protected route must fail closed if the auth service is unavailable.
    if (process.env.NODE_ENV !== "production") {
      console.error("fetchServerAuthUser: unable to reach auth service", BASE_URL)
    }
    return null
  }

  // Fail closed on any non-OK status (401, 500, 403, …) so a protected page
  // redirects to the store instead of throwing and crashing the layout.
  if (!response.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "fetchServerAuthUser: auth service returned",
        response.status,
        response.statusText
      )
    }
    return null
  }

  try {
    const data = (await response.json()) as AuthResponse
    return data.user
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.error("fetchServerAuthUser: invalid JSON from auth service")
    }
    return null
  }
}
