const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>
  /** Next.js fetch options (server-side only, e.g. revalidate caching) */
  next?: { revalidate?: number }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text()
    let message: string
    try {
      message = (JSON.parse(body) as { detail?: string }).detail ?? body
    } catch {
      message = body || response.statusText
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const token = localStorage.getItem("shopai_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, BASE_URL)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

export const apiClient = {
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(path, options?.params)
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        ...getAuthHeaders(),
      },
      ...(options?.next ? { next: options.next } : {}),
    })
    return handleResponse<T>(response)
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const isFormData = body instanceof FormData
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...getAuthHeaders(),
      },
      body: isFormData ? body : JSON.stringify(body),
    })
    return handleResponse<T>(response)
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const isFormData = body instanceof FormData
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...getAuthHeaders(),
      },
      body: isFormData ? body : JSON.stringify(body),
    })
    return handleResponse<T>(response)
  },

  async delete<T = void>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        ...getAuthHeaders(),
      },
    })
    return handleResponse<T>(response)
  },
}
