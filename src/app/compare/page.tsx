"use client"

import { useState } from "react"
import Link from "next/link"

export default function ComparePage() {
  const [float1, setFloat1] = useState("")
  const [float2, setFloat2] = useState("")
  const [parameter, setParameter] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [loading, setLoading] = useState(false)
  const [comparisonData, setComparisonData] = useState<{
    float1Data: any[]
    float2Data: any[]
    parameter: string
  } | null>(null)

  const floatOptions = [
    "Float 5904468",
    "Float 5904469",
    "Float 5904470",
    "Float 5904471",
    "Float 5904472",
    "Float 5904473",
    "Float 5904474",
    "Float 5904475",
  ]

  const parameterOptions = ["Temperature", "Salinity", "Pressure", "Oxygen", "pH", "Nitrate", "Chlorophyll"]

  const handleCompare = async () => {
    if (!float1 || !float2 || !parameter) return

    setLoading(true)
    try {
      const query = `Compare ${parameter} data between ${float1} and ${float2}${
        dateRange.start && dateRange.end ? ` from ${dateRange.start} to ${dateRange.end}` : ""
      }`

      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      const mockData = {
        float1Data: Array.from({ length: 10 }, (_, i) => ({
          depth: (i + 1) * 50,
          value: (Math.random() * 10 + 15).toFixed(2),
          date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
        })),
        float2Data: Array.from({ length: 10 }, (_, i) => ({
          depth: (i + 1) * 50,
          value: (Math.random() * 10 + 12).toFixed(2),
          date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
        })),
        parameter,
      }

      setComparisonData(mockData)
    } catch (error) {
      setComparisonData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-foreground">
                🌊 Oceanic Data Explorer
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Chat
              </Link>
              <Link href="/view-profile" className="text-muted-foreground hover:text-foreground transition-colors">
                View Profile
              </Link>
              <Link href="/compare" className="text-foreground font-medium">
                Compare
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Compare Floats</h1>
          <p className="text-muted-foreground">Compare oceanographic parameters between different Argo floats</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-foreground">Comparison Setup</h2>

              {/* Float 1 Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">First Float</label>
                <select
                  value={float1}
                  onChange={(e) => setFloat1(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose first float...</option>
                  {floatOptions.map((float) => (
                    <option key={float} value={float}>
                      {float}
                    </option>
                  ))}
                </select>
              </div>

              {/* Float 2 Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Second Float</label>
                <select
                  value={float2}
                  onChange={(e) => setFloat2(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose second float...</option>
                  {floatOptions
                    .filter((f) => f !== float1)
                    .map((float) => (
                      <option key={float} value={float}>
                        {float}
                      </option>
                    ))}
                </select>
              </div>

              {/* Parameter Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Parameter to Compare</label>
                <select
                  value={parameter}
                  onChange={(e) => setParameter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose parameter...</option>
                  {parameterOptions.map((param) => (
                    <option key={param} value={param}>
                      {param}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date Range (Optional)</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                onClick={handleCompare}
                disabled={!float1 || !float2 || !parameter || loading}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Comparing..." : "Compare Floats"}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Comparison Results</h2>

              {comparisonData ? (
                <div className="space-y-6">
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <h3 className="font-semibold text-foreground mb-2">Comparison Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Comparing {comparisonData.parameter} data between {float1} and {float2}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border rounded-lg">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-3 text-left font-semibold">Depth (m)</th>
                          <th className="border border-border p-3 text-left font-semibold">{float1}</th>
                          <th className="border border-border p-3 text-left font-semibold">{float2}</th>
                          <th className="border border-border p-3 text-left font-semibold">Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.float1Data.map((item1, index) => {
                          const item2 = comparisonData.float2Data[index]
                          const diff = (Number.parseFloat(item1.value) - Number.parseFloat(item2.value)).toFixed(2)
                          return (
                            <tr key={index} className="hover:bg-muted/30">
                              <td className="border border-border p-3">{item1.depth}</td>
                              <td className="border border-border p-3">{item1.value}</td>
                              <td className="border border-border p-3">{item2.value}</td>
                              <td
                                className={`border border-border p-3 font-medium ${
                                  Number.parseFloat(diff) > 0
                                    ? "text-green-600"
                                    : Number.parseFloat(diff) < 0
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {diff > 0 ? "+" : ""}
                                {diff}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-4xl mb-4">⚖️</div>
                  <p>Select two floats and a parameter to compare data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
