"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Chat, type Message } from "@/components/Chat"
import { HelpModal } from "@/components/ui/help-modal"
import { Sidebar } from "@/components/ui/sidebar"
import dynamic from "next/dynamic"
const ArgoMap = dynamic(() => import("../components/ArgoMap"), { ssr: false })

import ViewProfilePage from "@/app/ViewProfilePage/page"
import ComparePage from "@/app/ComparePage/page"

export default function OceanicChatApp() {
  const [isDark, setIsDark] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentPage, setCurrentPage] = useState<"chat" | "profile" | "compare" | "map">("chat")

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark)
    setIsDark(shouldBeDark)
    if (shouldBeDark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem("theme", newTheme ? "dark" : "light")
    if (newTheme) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen w-full bg-ocean-gradient-animated particle-container text-foreground dark:text-white transition-colors duration-500">
      {/* Background particles */}
      <div className="particle animate-particle-float"></div>
      <div className="particle animate-particle-float"></div>
      <div className="particle animate-particle-float"></div>
      <div className="particle animate-particle-float"></div>
      <div className="particle animate-particle-float"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-ocean-gradient flex items-center justify-center shadow-2xl animate-pulse-glow hover-lift interactive-scale">
                <span className="text-white text-xl animate-ocean-wave">🌊</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse shadow-lg"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Oceanic Data Explorer</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium animate-shimmer-flow">
                Advanced Marine Science Analytics Platform
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-center">
            <Button
              variant={currentPage === "chat" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 w-full sm:w-auto transition-all duration-300 hover-lift interactive-scale border border-border/30 bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
              onClick={() => setCurrentPage("chat")}
            >
              <span className="mr-2 text-lg">💬</span>
              <span className="hidden sm:inline font-medium">Chat</span>
            </Button>
            <Button
              variant={currentPage === "profile" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 w-full sm:w-auto transition-all duration-300 hover-lift interactive-scale border border-border/30 bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
              onClick={() => setCurrentPage("profile")}
            >
              <span className="mr-2 text-lg">🌊</span>
              <span className="hidden sm:inline font-medium">View Profile</span>
            </Button>
            <Button
              variant={currentPage === "compare" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 w-full sm:w-auto transition-all duration-300 hover-lift interactive-scale border border-border/30 bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
              onClick={() => setCurrentPage("compare")}
            >
              <span className="mr-2 text-lg">📊</span>
              <span className="hidden sm:inline font-medium">Compare</span>
            </Button>
            <Button
              variant={currentPage === "map" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 w-full sm:w-auto transition-all duration-300 hover-lift interactive-scale border border-border/30 bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
              onClick={() => setCurrentPage("map")}
            >
              <span className="mr-2 text-lg">🗺️</span>
              <span className="hidden sm:inline font-medium">Map</span>
            </Button>
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap sm:flex-nowrap">
            {currentPage === "chat" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 glass-card border-0 hover-glow transition-all duration-300 interactive-scale"
                onClick={() => setShowSidebar(true)}
              >
                <span className="mr-2 text-lg">🕒</span>
                <span className="hidden sm:inline font-medium">History</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-4 glass-card border-0 hover-glow transition-all duration-300 interactive-scale"
              onClick={toggleTheme}
            >
              <span className="text-lg">{isDark ? "☀️" : "🌙"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 glass-card border-primary/30 hover-glow transition-all duration-300 interactive-scale bg-transparent"
              onClick={() => setShowHelp(true)}
            >
              <span className="mr-2 text-lg">❓</span>
              <span className="hidden sm:inline font-medium">Help</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative px-4 sm:px-6 py-6">
        {currentPage === "chat" && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800 border border-slate-700 mb-4 hover-glow transition-all duration-300 shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg"></div>
                <span className="text-sm font-semibold text-white">AI-Powered Ocean Analytics</span>
                <div
                  className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-3xl blur-xl"></div>
              <div className="relative glass-card rounded-3xl shadow-2xl overflow-hidden border border-border/30 hover-lift transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-shimmer-flow"></div>
                <Chat
                  className="h-[calc(100vh-320px)] min-h-[400px] sm:min-h-[600px]"
                  messages={messages}
                  onMessagesChange={setMessages}
                />
              </div>
            </div>
          </div>
        )}

        {currentPage === "profile" && (
          <div className="container mx-auto px-2 sm:px-6 py-4">
            <ViewProfilePage />
          </div>
        )}

        {currentPage === "compare" && (
          <div className="container mx-auto px-2 sm:px-6 py-4">
            <ComparePage />
          </div>
        )}
        {currentPage === "map" && (
          <div className="container mx-auto px-2 sm:px-6 py-4">
            <ArgoMap />
          </div>
        )}

        {/* Floating Help Button */}
        {currentPage === "chat" && (
          <Button
            onClick={() => setShowHelp(true)}
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl bg-ocean-gradient hover:shadow-primary/30 transition-all duration-500 hover:scale-110 z-30 glass-card border-2 border-white/30 animate-pulse-glow interactive-scale"
            size="icon"
          >
            <span className="text-white text-2xl animate-ocean-wave">❓</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
          </Button>
        )}
      </main>

      {/* Modals */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      {showSidebar && <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} messages={messages} />}
    </div>
  )
}
