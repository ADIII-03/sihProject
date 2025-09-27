"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "./ChatMessage"

export interface Message {
  visualizationType: string
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface ChatProps {
  className?: string
  messages?: Message[]
  onMessagesChange?: (messages: Message[]) => void
}

export function Chat({ className, messages: externalMessages, onMessagesChange }: ChatProps) {
  const [internalMessages, setInternalMessages] = useState<Message[]>([])
  const messages = externalMessages || internalMessages

  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    if (onMessagesChange) {
      if (typeof updater === "function") {
        onMessagesChange(updater(messages))
      } else {
        onMessagesChange(updater)
      }
    } else {
      setInternalMessages(updater)
    }
  }

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => scrollToBottom(), [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // 1️⃣ Add user's message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
      visualizationType: ""
    }
    setMessages((prev) => [...prev, userMessage])

    const currentQuery = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      // 2️⃣ Call your backend API (which calls Groq)
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Groq API failed: ${err}`)
      }

      const data = await response.json()

      // 3️⃣ Handle structured response
      const messageContent =
        data.response ||
        "🤖 The AI didn’t return any content. Try rephrasing your question."

      // 4️⃣ Add bot's message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: messageContent,
        timestamp: new Date(),
        visualizationType: ""
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Query error:", error)

      // 5️⃣ Show error as bot message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          error instanceof Error
            ? `❌ Error: ${error.message}`
            : "❌ Unknown error while calling Groq API.",
        timestamp: new Date(),
        visualizationType: ""
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQueries = [
    { icon: "🌊", text: "What is the temperature profile in the Arabian Sea?", category: "Temperature Analysis" },
    { icon: "🧂", text: "Compare salinity levels between different ocean regions", category: "Salinity Comparison" },
    { icon: "📍", text: "Show me ARGO float locations in the Pacific Ocean", category: "Float Tracking" },
    { icon: "📊", text: "Analyze oxygen levels over time in the Indian Ocean", category: "Temporal Analysis" },
  ]

  const handleSuggestedQuery = (query: string) => {
    setInputValue(query)
    inputRef.current?.focus()
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6 min-h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-ocean flex items-center justify-center shadow-2xl animate-pulse-subtle">
                <span className="text-4xl">✨</span>
              </div>
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-3xl font-bold text-foreground">Welcome to Ocean Analytics</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Ask any question about temperature, salinity, ARGO floats, or oceanography data and get instant insights.
                </p>
              </div>

              {/* ✅ Suggested Queries */}
              <div className="w-full max-w-4xl">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-left">Try these examples:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full h-auto p-4 text-left justify-start hover:bg-accent/5 hover:border-primary/30 transition-all duration-200 group bg-transparent"
                      onClick={() => handleSuggestedQuery(query.text)}
                    >
                      <div className="flex items-start gap-3 w-full min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                          <span className="text-lg">{query.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors break-words whitespace-normal">
                            {query.text}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">
                            {query.category}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start animate-slide-in-left">
                  <div className="max-w-[80%] p-4 rounded-2xl shadow-sm bg-card border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Analyzing oceanographic data...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* ✅ Input Section */}
      <div className="border-t border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about temperature, salinity, ARGO floats..."
                className="pr-12 h-12"
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {inputValue.length}/500
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              className={`h-12 px-6 ${
                !inputValue.trim() || isLoading
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-gradient-ocean hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
              }`}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="mr-2">📤</span>
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
