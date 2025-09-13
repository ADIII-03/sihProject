"use client"
import type { Message } from "./Chat"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} group mb-6`}>
      <div className={`max-w-[85%] ${message.type === "user" ? "order-2" : "order-1"}`}>
        <div className={`flex items-center gap-2 mb-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex items-center gap-2 text-sm text-muted-foreground`}>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                message.type === "user" ? "bg-primary/10" : "bg-accent/10"
              }`}
            >
              <span className="text-sm">{message.type === "user" ? "👤" : "🤖"}</span>
              <span className="font-medium">{message.type === "user" ? "You" : "Ocean AI"}</span>
            </div>
            <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl shadow-sm transition-all duration-200 animate-slide-in-left border ${
            message.type === "user"
              ? "bg-primary text-primary-foreground border-primary/20"
              : "bg-card text-card-foreground border-border/50 shadow-md"
          }`}
        >
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        </div>
      </div>
    </div>
  )
}
