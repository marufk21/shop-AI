"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Switch } from "@workspace/ui/components/switch"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import {
  ArrowUp,
  UserCircle,
  Article,
  Gear,
  Brain,
  Storefront,
  Headset,
  Cpu,
  Spinner,
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

export default function ChatbotPage() {
  const { messages, isStreaming, sendMessage, clearMessages, activeAgent } = useChat()
  const [input, setInput] = useState("")
  const [ragEnabled, setRagEnabled] = useState(true)
  const [modelTemp, setModelTemp] = useState(0.7)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isStreaming])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input, {
      temperature: modelTemp,
      useRag: ragEnabled,
    })
    setInput("")

    requestAnimationFrame(() => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop =
          scrollViewportRef.current.scrollHeight
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Multi-agent system powered by LangGraph.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearMessages}>
            Clear Chat
          </Button>
          {isStreaming && (
            <Badge variant="secondary" className="gap-1.5">
              {activeAgent && AGENT_META[activeAgent] ? (
                <>
                  {(() => {
                    const meta = AGENT_META[activeAgent]
                    return (
                      <meta.icon className={`size-3 ${meta.color}`} weight="fill" />
                    )
                  })()}
                  {AGENT_META[activeAgent].label}
                </>
              ) : (
                <>
                  <Spinner className="size-3 animate-spin" />
                  Routing...
                </>
              )}
            </Badge>
          )}
          <Badge
            variant={ragEnabled ? "default" : "secondary"}
            className="gap-1.5"
          >
            <Brain className="size-3" />
            RAG {ragEnabled ? "Active" : "Disabled"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden lg:col-span-3">
          <CardHeader className="shrink-0 border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Brain className="size-4 text-primary" />
              Multi-Agent Chat
              <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 font-normal">
                <Cpu className="size-2.5" />
                LangGraph
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <ScrollArea
              className="min-h-0 flex-1 overflow-hidden"
              viewportRef={scrollViewportRef}
              data-lenis-prevent
            >
              <div className="space-y-4 p-4">
                {messages.length === 0 ? (
                  <div className="py-16 text-center">
                    <Brain className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Start a conversation to test the multi-agent chatbot.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      A supervisor agent routes queries to the right specialist.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {[
                        "Recommend some products",
                        "What's your shipping policy?",
                        "How do I return an item?",
                        "Show me products under $50",
                      ].map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          onClick={() => setInput(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const meta = msg.agent ? AGENT_META[msg.agent] : undefined
                    return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "assistant" ? "" : "flex-row-reverse"
                      }`}
                    >
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="text-xs">
                          {msg.role === "assistant" ? (
                            meta ? (
                              <meta.icon className={`size-3 ${meta.color}`} weight="fill" />
                            ) : (
                              <Brain className="size-3" />
                            )
                          ) : (
                            <UserCircle className="size-3" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={
                          msg.role === "assistant"
                            ? "max-w-[80%] space-y-2"
                            : "max-w-[80%] flex flex-col items-end space-y-2"
                        }
                      >
                        {/* Agent badge */}
                        {msg.role === "assistant" && meta && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 w-fit">
                            <meta.icon className={`size-2.5 ${meta.color}`} weight="fill" />
                            <span className={`text-[10px] font-semibold ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                        )}

                        <div
                          className={`rounded-xl px-3.5 py-2.5 text-sm ${
                            msg.role === "assistant"
                              ? "bg-muted"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <div className="leading-relaxed">
                            <MarkdownRenderer content={msg.content} />
                            {msg.role === "assistant" && isStreaming && (
                              <span className="ml-1 inline-flex items-center gap-[3px] align-middle">
                                <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse" />
                                <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
                                <span className="h-3 w-0.5 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
                              </span>
                            )}
                          </div>
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="space-y-1.5">
                            {msg.sources.map((src, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs"
                              >
                                <Article className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {src.document_name}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {src.excerpt}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <span className="text-[10px] text-muted-foreground">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type a test message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={2}
                  className="min-h-0 resize-none"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  aria-label="Send message"
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Gear className="size-4" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">RAG Retrieval</Label>
                  <p className="text-xs text-muted-foreground">
                    Use document context
                  </p>
                </div>
                <Switch checked={ragEnabled} onCheckedChange={setRagEnabled} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm">Temperature: {modelTemp}</Label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={modelTemp}
                  onChange={(e) => setModelTemp(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
