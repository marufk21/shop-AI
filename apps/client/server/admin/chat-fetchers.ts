import type { ChatRequest, SourceCitation } from "@/types/chat"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export type StreamCallbacks = {
  onToken: (token: string) => void
  onSources: (sources: SourceCitation[]) => void
  onAgent: (agent: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

export async function streamChatMessage(
  request: ChatRequest,
  callbacks: StreamCallbacks,
  endpoint = "/api/v1/chat/message"
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("Response body is not readable")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data: ")) continue

        const payload = trimmed.slice(6)
        if (payload === "[DONE]") {
          callbacks.onDone()
          return
        }

        try {
          const event = JSON.parse(payload)
          if (event.type === "token") {
            callbacks.onToken(event.content as string)
          } else if (event.type === "sources") {
            callbacks.onSources(event.sources as SourceCitation[])
          } else if (event.type === "agent") {
            callbacks.onAgent(event.agent as string)
          }
        } catch {
          // skip unparseable events
        }
      }
    }
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error : new Error("Stream failed")
    )
  }
}
