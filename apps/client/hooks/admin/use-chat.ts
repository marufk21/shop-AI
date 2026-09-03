import { useCallback, useState } from "react"

import { streamChatMessage } from "@/server/admin/chat-fetchers"
import type { ChatMessage, ChatMessageInput } from "@/types/chat"

type SendOptions = {
  temperature?: number
  useRag?: boolean
  topK?: number
}

type UseChatOptions = {
  endpoint?: string
}

export function useChat({ endpoint }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeAgent, setActiveAgent] = useState<string | null>(null)

  const sendMessage = useCallback(
    (content: string, options: SendOptions = {}) => {
      const { temperature = 0.7, useRag = true, topK = 5 } = options

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toLocaleTimeString(),
      }

      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)
      setActiveAgent(null)

      // Build conversation history from existing messages (excluding the
      // just-added user message and empty assistant placeholder)
      const history: ChatMessageInput[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      streamChatMessage(
        {
          message: content,
          history,
          temperature,
          use_rag: useRag,
          top_k: topK,
        },
        {
          onAgent: (agent) => {
            setActiveAgent(agent)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, agent } : m
              )
            )
          },
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token }
                  : m
              )
            )
          },
          onSources: (sources) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, sources } : m
              )
            )
          },
          onDone: () => {
            setIsStreaming(false)
            setActiveAgent(null)
          },
          onError: () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: "Sorry, something went wrong." }
                  : m
              )
            )
            setIsStreaming(false)
            setActiveAgent(null)
          },
        },
        endpoint
      )
    },
    [endpoint, messages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, isStreaming, sendMessage, clearMessages, activeAgent }
}
