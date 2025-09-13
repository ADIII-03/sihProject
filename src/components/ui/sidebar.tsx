"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/components/Chat"

interface SavedQuery {
  id: string
  query: string
  timestamp: Date
  type: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  messages?: Message[]
}

export function Sidebar({ isOpen, onClose, messages = [] }: SidebarProps) {
  const savedQueries: SavedQuery[] = messages
    .filter((msg) => msg.type === "user")
    .map((msg) => ({
      id: msg.id,
      query: msg.content,
      timestamp: msg.timestamp,
      type: msg.visualizationType || "query",
    }))

  const handleDeleteQuery = (id: string) => {
    // Note: In a real app, this would need to communicate back to remove the message
    console.log("Delete query:", id)
  }

  const handleExportQueries = () => {
    const dataStr = JSON.stringify(savedQueries, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ocean-queries-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`w-80 bg-card/95 backdrop-blur-sm border-r border-border/20 h-full transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <h2 className="text-lg font-semibold text-ocean-blue dark:text-aqua">Query History</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="text-lg">✕</span>
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportQueries} className="flex-1 bg-transparent">
              <span className="mr-2">📥</span>
              Export ({savedQueries.length})
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3">
              {savedQueries.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-4xl mb-2 opacity-50">💬</div>
                  <p>No queries yet</p>
                  <p className="text-xs mt-1">Start chatting to see your query history</p>
                </div>
              ) : (
                savedQueries.map((query) => (
                  <Card
                    key={query.id}
                    className="bg-muted/30 border-border/20 hover:bg-muted/50 transition-colors group"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{query.query}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {query.timestamp.toLocaleDateString()}{" "}
                              {query.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{query.type}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteQuery(query.id)}
                        >
                          <span className="text-sm">🗑️</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  )
}
