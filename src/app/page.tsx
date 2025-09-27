"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Chat, type Message } from "@/components/Chat"
import { HelpModal } from "@/components/ui/help-modal"
import { Sidebar } from "@/components/ui/sidebar"
import dynamic from "next/dynamic"
import { Waves, Compass, BarChart3, Map, Sun, Moon, HelpCircle, History, Sparkles } from "lucide-react"

const ArgoMap = dynamic(() => import("../components/ArgoMap"), { ssr: false })
import ComparePage from "@/app/ComparePage/page"
import EnhancedViewProfilePage from "@/app/ViewProfilePage/page"

export default function FloatAI() {
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
    <div className="min-h-screen w-full ocean-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl float-animation"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 rounded-full bg-primary/20 blur-2xl float-animation"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-secondary/20 blur-3xl float-animation"
          style={{ animationDelay: "4s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full bg-accent/20 blur-2xl float-animation"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-ocean border-b border-border/30 backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-14 h-14 rounded-2xl ocean-deep-gradient flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-105 ripple-effect">
                  <Waves className="w-7 h-7 text-primary-foreground wave-animation" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-ocean-gradient tracking-tight">FLOATAI</h1>
                <p className="text-sm text-muted-foreground font-medium shimmer-wave">
                  {"Intelligent Ocean Analytics Platform"}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={currentPage === "chat" ? "default" : "ghost"}
                size="sm"
                className="h-11 px-6 glass-ocean transition-all duration-300 hover:scale-105 group"
                onClick={() => setCurrentPage("chat")}
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:text-accent transition-colors" />
                <span className="font-medium">Chat</span>
              </Button>
              <Button
                variant={currentPage === "profile" ? "default" : "ghost"}
                size="sm"
                className="h-11 px-6 glass-ocean transition-all duration-300 hover:scale-105 group"
                onClick={() => setCurrentPage("profile")}
              >
                <Compass className="w-4 h-4 mr-2 group-hover:text-accent transition-colors" />
                <span className="font-medium">Profile</span>
              </Button>
              <Button
                variant={currentPage === "compare" ? "default" : "ghost"}
                size="sm"
                className="h-11 px-6 glass-ocean transition-all duration-300 hover:scale-105 group"
                onClick={() => setCurrentPage("compare")}
              >
                <BarChart3 className="w-4 h-4 mr-2 group-hover:text-accent transition-colors" />
                <span className="font-medium">Analytics</span>
              </Button>
              <Button
                variant={currentPage === "map" ? "default" : "ghost"}
                size="sm"
                className="h-11 px-6 glass-ocean transition-all duration-300 hover:scale-105 group"
                onClick={() => setCurrentPage("map")}
              >
                <Map className="w-4 h-4 mr-2 group-hover:text-accent transition-colors" />
                <span className="font-medium">Explorer</span>
              </Button>
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {currentPage === "chat" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-4 glass-ocean transition-all duration-300 hover:scale-105"
                  onClick={() => setShowSidebar(true)}
                >
                  <History className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-11 px-4 glass-ocean transition-all duration-300 hover:scale-105"
                onClick={toggleTheme}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-11 px-4 glass-ocean border-primary/30 transition-all duration-300 hover:scale-105 bg-transparent"
                onClick={() => setShowHelp(true)}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden mt-4 flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={currentPage === "chat" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 glass-ocean transition-all duration-300 whitespace-nowrap"
              onClick={() => setCurrentPage("chat")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button
              variant={currentPage === "profile" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 glass-ocean transition-all duration-300 whitespace-nowrap"
              onClick={() => setCurrentPage("profile")}
            >
              <Compass className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              variant={currentPage === "compare" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 glass-ocean transition-all duration-300 whitespace-nowrap"
              onClick={() => setCurrentPage("compare")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={currentPage === "map" ? "default" : "ghost"}
              size="sm"
              className="h-10 px-4 glass-ocean transition-all duration-300 whitespace-nowrap"
              onClick={() => setCurrentPage("map")}
            >
              <Map className="w-4 h-4 mr-2" />
              Explorer
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative px-6 py-8">
        {currentPage === "chat" && (
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass-ocean border border-border/30 mb-6 shimmer-wave">
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-foreground">{"AI-Powered Ocean Intelligence"}</span>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-balance mb-4 text-ocean-gradient">
                {"Dive Deep into"}
                <br />
                {"Ocean Analytics"}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                {
                  "Harness the power of AI to explore, analyze, and understand our oceans like never before. Float through data with intelligent insights."
                }
              </p>
            </div>

            {/* Chat Interface */}
            <div className="relative">
              <div className="absolute inset-0 ocean-deep-gradient rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative glass-ocean rounded-3xl shadow-2xl overflow-hidden border border-border/30 transition-all duration-500 hover:shadow-3xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary shimmer-wave"></div>
                <Chat
                  className="h-[calc(100vh-400px)] min-h-[500px]"
                  messages={messages}
                  onMessagesChange={setMessages}
                />
              </div>
            </div>
          </div>
        )}

        {currentPage === "profile" && (
          <div className="container mx-auto">
            <div className="glass-ocean rounded-3xl p-8 border border-border/30">
              <EnhancedViewProfilePage />
            </div>
          </div>
        )}

        {currentPage === "compare" && (
          <div className="container mx-auto">
            <div className="glass-ocean rounded-3xl p-8 border border-border/30">
              <ComparePage />
            </div>
          </div>
        )}

        {currentPage === "map" && (
          <div className="container mx-auto">
            <div className="glass-ocean rounded-3xl p-8 border border-border/30">
              <ArgoMap />
            </div>
          </div>
        )}

        {/* Floating Help Button */}
        {currentPage === "chat" && (
          <Button
            onClick={() => setShowHelp(true)}
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl ocean-deep-gradient hover:shadow-accent/30 transition-all duration-500 hover:scale-110 z-30 border-2 border-accent/30 group"
            size="icon"
          >
            <HelpCircle className="w-6 h-6 text-primary-foreground group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
          </Button>
        )}
      </main>

      {/* Modals */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      {showSidebar && <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} messages={messages} />}
    </div>
  )
}
