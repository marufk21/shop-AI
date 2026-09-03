"use client"

import { useState, useRef, useEffect } from "react"
import { useLenis } from "lenis/react"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import {
  ChatCircle,
  ArrowUp,
  Brain,
  UserCircle,
  X,
  Article,
  Truck,
  ArrowBendUpLeft,
  Gift,
  Storefront,
  Headset,
} from "@phosphor-icons/react"

import { useChat } from "@/hooks/admin/use-chat"
import { MarkdownRenderer } from "@/components/shared/markdown-renderer"

const AGENT_META: Record<
  string,
  { icon: typeof Brain; label: string; color: string }
> = {
  product: { icon: Storefront, label: "Product Agent", color: "text-blue-500" },
  support: { icon: Headset, label: "Support Agent", color: "text-emerald-500" },
}

const quickReplies = [
  {
    icon: Storefront,
    label: "Find products",
    description: "Browse tailored picks",
    prompt: "Recommend some products for me",
  },
  {
    icon: Gift,
    label: "Gift ideas",
    description: "Help choosing a present",
    prompt: "Recommend some gift ideas",
  },
  {
    icon: Truck,
    label: "Shipping help",
    description: "Delivery and tracking",
    prompt: "What are your shipping options?",
  },
  {
    icon: ArrowBendUpLeft,
    label: "Returns help",
    description: "Returns and refunds",
    prompt: "What is your return policy?",
  },
]

const productFollowUps = [
  { label: "Cheaper options", prompt: "Show cheaper options" },
  { label: "Only in stock", prompt: "Show only in-stock options" },
  { label: "More like this", prompt: "Show more like this" },
]

export function FloatingChatbot() {
  const { messages, isStreaming, sendMessage, clearMessages, activeAgent } = useChat({
    endpoint: "/api/v1/store/chat/message",
  })
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isStreaming, open])

  const lenis = useLenis()

  // Lock background scroll when chatbot is open (Lenis + native fallback)
  useEffect(() => {
    if (open) {
      lenis?.stop()
      document.body.style.overflow = "hidden"
    } else {
      lenis?.start()
      document.body.style.overflow = ""
    }
    return () => {
      lenis?.start()
      document.body.style.overflow = ""
    }
  }, [open, lenis])

  const handleSend = (text?: string) => {
    const msg = text ?? input
    if (!msg.trim() || isStreaming) return
    sendMessage(msg)
    if (!text) setInput("")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Floating trigger */}
      <SheetTrigger
        render={
          <button
            className="fixed right-4 bottom-4 z-50 hidden size-10 items-center justify-center rounded-full border border-border/60 bg-background/90 backdrop-blur-md shadow-sm text-foreground hover:shadow-md hover:border-border hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer md:flex"
            aria-label="Open chat"
          >
            <ChatCircle className="size-4.5" weight="regular" />
          </button>
        }
      />

      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full max-w-95 flex-col p-0 sm:max-w-95 border-l"
      >
        {/* Header */}
        <div className="shrink-0 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <Brain className="size-4.5 text-primary" weight="fill" />
              </div>
              <div>
                <p className="text-[13px] font-heading font-semibold tracking-tight leading-tight">
                  Assistant
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`flex size-1.5 rounded-full ${
                      isStreaming ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    }`}
                  />
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight capitalize">
                    {isStreaming
                      ? activeAgent
                        ? `${activeAgent} agent`
                        : "Routing..."
                      : "Ready to help"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  disabled={isStreaming}
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        >
          <div className="space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center pt-6 pb-4">
                  {/* Welcome icon */}
                  <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <Brain className="size-5 text-primary" weight="fill" />
                  </div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    How can I help?
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 text-center max-w-55 leading-relaxed">
                    Choose a starting point or ask anything about the store.
                  </p>

                  {/* Suggested starting points */}
                  <div className="grid w-full max-w-70 grid-cols-2 gap-2 mt-4">
                    {quickReplies.map(({ icon: Icon, label, description, prompt }) => (
                      <button
                        key={label}
                        onClick={() => handleSend(prompt)}
                        className="group flex min-h-17 flex-col items-start rounded-xl border border-border/50 bg-background px-3 py-2.5 text-left transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                          <span className="flex size-5 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <Icon className="size-3" />
                          </span>
                          {label}
                        </div>
                        <span className="mt-1 text-[10px] leading-snug text-muted-foreground">
                          {description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isBot = msg.role === "assistant"
                const isLastBot =
                  isBot && messages[messages.length - 1]?.id === msg.id
                const agentKey =
                  isLastBot && isStreaming ? activeAgent : msg.agent
                const meta = agentKey ? AGENT_META[agentKey] : undefined

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isBot ? "" : "flex-row-reverse"}`}
                  >
                    {/* Avatar */}
                    {isBot ? (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        {meta ? (
                          <meta.icon className="size-3.5" weight="fill" />
                        ) : (
                          <Brain className="size-3.5" weight="fill" />
                        )}
                      </div>
                    ) : (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 mt-0.5">
                        <UserCircle className="size-3.5" weight="fill" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`min-w-0 max-w-[82%] ${isBot ? "" : "flex flex-col items-end"}`}>
                      {/* Agent badge */}
                      {isBot && meta && (
                        <div className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded-full bg-muted/60 w-fit">
                          <meta.icon className={`size-2.5 ${meta.color}`} weight="fill" />
                          <span className={`text-[9px] font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                      )}

                      <div
                        className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                          isBot
                            ? "rounded-tl-sm bg-muted/50 text-foreground"
                            : "rounded-tr-sm bg-primary text-primary-foreground"
                        }`}
                      >
                        <div className="wrap-break-word text-[13px] leading-relaxed">
                          <MarkdownRenderer content={msg.content} />
                          {isLastBot && isStreaming && (
                            <span className="ml-1 inline-flex items-center gap-[3px] align-middle">
                              <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse" />
                              <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
                              <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
                            </span>
                          )}
                        </div>
                      </div>

                      {isBot && msg.agent === "product" && !isStreaming && msg.content && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {productFollowUps.map(({ label, prompt }) => (
                            <button
                              key={prompt}
                              onClick={() => handleSend(prompt)}
                              className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={isStreaming}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {msg.sources.map((src, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-[10px]"
                            >
                              <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-muted">
                                <Article className="size-2.5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">
                                  {src.document_name}
                                </p>
                                <p className="text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                                  {src.excerpt}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Streaming placeholder */}
              {isStreaming && messages.length > 0 && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Brain className="size-3" weight="fill" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-muted/50 px-3 py-2.5">
                    <span className="text-[9px] text-muted-foreground font-medium block mb-1">
                      {activeAgent ? `${activeAgent} agent` : "Routing..."}
                    </span>
                    <span className="inline-flex items-center gap-[3px]">
                      <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse" />
                      <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
                      <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t px-3 py-2.5">
            <div className="flex items-end gap-1.5 rounded-xl border bg-muted/20 p-1 transition-all duration-150 focus-within:border-foreground/20 focus-within:bg-background">
              <Textarea
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                className="min-h-0 flex-1 resize-none border-0 bg-transparent text-[13px] shadow-none ring-0 focus-visible:ring-0 py-1.5 px-2 placeholder:text-muted-foreground/60"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                aria-label="Send message"
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-150 hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowUp className="size-3.5" weight="bold" />
              </button>
            </div>
            <p className="text-center text-[9px] text-muted-foreground/65 mt-1.5 font-medium">
              Powered by ShopAI · May produce inaccurate info
            </p>
          </div>
      </SheetContent>
    </Sheet>
  )
}
