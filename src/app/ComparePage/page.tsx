"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import type { Layout } from "plotly.js"
import toast, { Toaster } from "react-hot-toast"
import * as Cesium from "cesium"
import "cesium/Build/Cesium/Widgets/widgets.css"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

type ProfilePoint = {
  pressure: number
  temperature?: number | null
  salinity?: number | null
  [k: string]: any
}

export default function ComparePage() {
  const [mode, setMode] = useState<"float" | "location">("float")
  const [firstFloat, setFirstFloat] = useState("")
  const [secondFloat, setSecondFloat] = useState("")
  const [firstLat, setFirstLat] = useState<number | null>(null)
  const [firstLng, setFirstLng] = useState<number | null>(null)
  const [secondLat, setSecondLat] = useState<number | null>(null)
  const [secondLng, setSecondLng] = useState<number | null>(null)

  const firstMapContainerRef = useRef<HTMLDivElement | null>(null)
  const secondMapContainerRef = useRef<HTMLDivElement | null>(null)
  const firstMapRef = useRef<mapboxgl.Map | null>(null)
  const secondMapRef = useRef<mapboxgl.Map | null>(null)
  const firstMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const secondMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const [selectedParams, setSelectedParams] = useState<string[]>(["salinity", "temperature"])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pressureRange, setPressureRange] = useState<[number, number]>([0, 2000])
  const [firstData, setFirstData] = useState<ProfilePoint[]>([])
  const [secondData, setSecondData] = useState<ProfilePoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [visualType, setVisualType] = useState<"line" | "area" | "bar">("line")
  const [compareMode, setCompareMode] = useState<"overlay" | "side">("overlay")

  const parameters = [
    { id: "temperature", name: "Temperature", icon: "🌡️" },
    { id: "salinity", name: "Salinity", icon: "🧂" },
  ]

  useEffect(() => setIsClient(true), [])

  // ---------------- Map Initialization ----------------
  useEffect(() => {
    if (mode !== "location") return

    if (firstMapContainerRef.current && !firstMapRef.current) {
      firstMapRef.current = new mapboxgl.Map({
        container: firstMapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [78, 20],
        zoom: 2,
      })
      firstMapRef.current.on("click", (e) => {
        const { lng, lat } = e.lngLat
        setFirstLat(lat)
        setFirstLng(lng)
        if (firstMarkerRef.current) firstMarkerRef.current.remove()
        firstMarkerRef.current = new mapboxgl.Marker({ color: "blue" }).setLngLat([lng, lat]).addTo(firstMapRef.current!)
      })
    }

    if (secondMapContainerRef.current && !secondMapRef.current) {
      secondMapRef.current = new mapboxgl.Map({
        container: secondMapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [78, 20],
        zoom: 2,
      })
      secondMapRef.current.on("click", (e) => {
        const { lng, lat } = e.lngLat
        setSecondLat(lat)
        setSecondLng(lng)
        if (secondMarkerRef.current) secondMarkerRef.current.remove()
        secondMarkerRef.current = new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(secondMapRef.current!)
      })
    }
  }, [mode])

  // ---------------- Helpers ----------------
  const handleParamToggle = (paramId: string) =>
    setSelectedParams((prev) => (prev.includes(paramId) ? prev.filter((p) => p !== paramId) : [...prev, paramId]))

  const normalizeRows = (rows: any[]): ProfilePoint[] =>
    rows
      .map((r) => {
        const pressure =
          r.pres ?? r.m_pres ?? r.pressure ?? r.depth ?? r.m?.pres ?? r["m.pres"] ?? r["m_pres"] ?? null
        const temperature = r.temp ?? r.temperature ?? r["m.temp"] ?? r["m.temp"] ?? null
        const salinity = r.psal ?? r.salinity ?? r["m.psal"] ?? null

        const pressureNum = pressure != null ? Number(pressure) : NaN
        if (Number.isNaN(pressureNum)) return null

        return {
          pressure: pressureNum,
          temperature: temperature != null ? Number(temperature) : undefined,
          salinity: salinity != null ? Number(salinity) : undefined,
          ...r,
        }
      })
      .filter(Boolean) as ProfilePoint[]

  // ---------------- Submit Handler ----------------
  const handleSubmit = async () => {
    if (mode === "float" && (!firstFloat.trim() || !secondFloat.trim())) {
      toast.error("Enter both float IDs.")
      return
    }
    if (mode === "location" && (firstLat == null || firstLng == null || secondLat == null || secondLng == null)) {
      toast.error("Pick both locations on the maps.")
      return
    }

    setIsLoading(true)
    try {
      let endpoint = ""
      let body: any = {}

      if (mode === "float") {
        endpoint = "/api/ComparequeryFloat"
        body = {
          firstFloat: firstFloat.trim(),
          secondFloat: secondFloat.trim(),
          parameters: selectedParams,
          depthRange: pressureRange,
          ...(startDate && endDate ? { startDate, endDate } : {}),
        }
      } else {
        endpoint = "/api/comparequeryLocation"
        body = {
          firstLat,
          firstLng,
          secondLat,
          secondLng,
          parameters: selectedParams,
          depthRange: pressureRange,
          ...(startDate && endDate ? { startDate, endDate } : {}),
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => null)
        console.error("[Compare] non-OK:", res.status, text)
        toast.error(`Compare API failed (${res.status}).`)
        return
      }

      const json = await res.json()
console.log("Compare response:", json)  
      // Normalize profile data
      if (mode === "float") {
        const rawFirst = json?.firstFloat?.data ?? json?.first?.data ?? []
        const rawSecond = json?.secondFloat?.data ?? json?.second?.data ?? []
        setFirstData(normalizeRows(Array.isArray(rawFirst) ? rawFirst : []))
        setSecondData(normalizeRows(Array.isArray(rawSecond) ? rawSecond : []))
       
      } else {
      
// Normalize profile data
setFirstData(normalizeRows(json?.firstLocation?.data ?? []));
setSecondData(normalizeRows(json?.secondLocation?.data ?? []));

// Show toast with platform numbers
const firstFloatPlatform = json?.firstLocation?.nearestFloat;
const secondFloatPlatform = json?.secondLocation?.nearestFloat;

if (firstFloatPlatform || secondFloatPlatform) {
  toast(`🔎 Using nearest floats: First → ${firstFloatPlatform ?? "N/A"}, Second → ${secondFloatPlatform ?? "N/A"}`);
} else {
  toast.success("Profiles loaded.");
}
      }
    } catch (err) {
      console.error("Compare error:", err)
      toast.error("Failed to compare profiles.")
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------- Plotly Utilities (same as your code) ----------------
  const buildOverlayRows = () => {
    const m = new Map<number, any>()
    const push = (row: ProfilePoint | undefined, side: "first" | "second") => {
      if (!row) return
      const key = Math.round(row.pressure * 100) / 100
      const entry = m.get(key) ?? { pressure: key }
      if (side === "first") {
        if (row.temperature != null) entry.firstTemperature = row.temperature
        if (row.salinity != null) entry.firstSalinity = row.salinity
      } else {
        if (row.temperature != null) entry.secondTemperature = row.temperature
        if (row.salinity != null) entry.secondSalinity = row.salinity
      }
      m.set(key, entry)
    }

    firstData.forEach((r) => push(r, "first"))
    secondData.forEach((r) => push(r, "second"))

    return Array.from(m.values()).sort((a, b) => a.pressure - b.pressure)
  }

  const generateOverlayTraces = () => {
    const overlayRows = buildOverlayRows().filter((r) => r.pressure >= pressureRange[0] && r.pressure <= pressureRange[1])
    const traces: any[] = []
    if (selectedParams.includes("temperature")) {
      traces.push({
        x: overlayRows.map((r) => r.firstTemperature ?? null),
        y: overlayRows.map((r) => r.pressure),
        name: "First — Temperature",
        mode: visualType === "line" ? "lines" : undefined,
        type: visualType === "bar" ? "bar" : "scatter",
        fill: visualType === "area" ? "tozerox" : undefined,
      })
      traces.push({
        x: overlayRows.map((r) => r.secondTemperature ?? null),
        y: overlayRows.map((r) => r.pressure),
        name: "Second — Temperature",
        mode: visualType === "line" ? "lines" : undefined,
        type: visualType === "bar" ? "bar" : "scatter",
        fill: visualType === "area" ? "tozerox" : undefined,
      })
    }
    if (selectedParams.includes("salinity")) {
      traces.push({
        x: overlayRows.map((r) => r.firstSalinity ?? null),
        y: overlayRows.map((r) => r.pressure),
        name: "First — Salinity",
        mode: visualType === "line" ? "lines" : undefined,
        type: visualType === "bar" ? "bar" : "scatter",
        fill: visualType === "area" ? "tozerox" : undefined,
      })
      traces.push({
        x: overlayRows.map((r) => r.secondSalinity ?? null),
        y: overlayRows.map((r) => r.pressure),
        name: "Second — Salinity",
        mode: visualType === "line" ? "lines" : undefined,
        type: visualType === "bar" ? "bar" : "scatter",
        fill: visualType === "area" ? "tozerox" : undefined,
      })
    }
    return traces.filter((t) => (t.x ?? []).some((v: any) => v !== null && v !== undefined))
  }

  const generateSingleTraces = (rows: ProfilePoint[]) => {
    const filtered = rows.filter((r) => r.pressure >= pressureRange[0] && r.pressure <= pressureRange[1])
    const traces: any[] = []
    if (selectedParams.includes("temperature")) {
      traces.push({
        x: filtered.map((r) => r.temperature),
        y: filtered.map((r) => r.pressure),
        name: "Temperature",
        mode: visualType === "line" ? "lines" : undefined,
        type: visualType === "bar" ? "bar" : "scatter",
        fill: visualType === "area" ? "tozerox" : undefined,
      })
    }
    if (selectedParams.includes("salinity")) {
      traces.push({
        x: filtered.map((r) => r.salinity),
        y: filtered.map((r) => r.pressure),
        name: "Salinity",
        mode: visualType === "line" ? "lines" : undefined,
        type: visualType === "bar" ? "bar" : "scatter",
        fill: visualType === "area" ? "tozerox" : undefined,
      })
    }
    return traces.filter((t) => (t.x ?? []).some((v: any) => v !== null && v !== undefined))
  }

  const generatePlotlyLayout = (): Partial<Layout> => ({
    yaxis: { autorange: "reversed", title: { text: "Pressure (dbar)" } },
    xaxis: { title: { text: "Value" } },
    margin: { t: 30, r: 30, b: 50, l: 70 },
    legend: { orientation: "h", y: -0.2 },
    hovermode: "closest",
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#ddd" },
  })


  /* ------------------------
     Render
     ------------------------ */
  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 max-w-6xl mx-auto px-3 sm:px-6 py-6">
        {/* Mode Switch */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
          <Button className="flex-1 sm:flex-none" variant={mode === "float" ? "default" : "outline"} onClick={() => setMode("float")}>
            🔍 Compare by Float ID
          </Button>
          <Button className="flex-1 sm:flex-none" variant={mode === "location" ? "default" : "outline"} onClick={() => setMode("location")}>
            📍 Compare by Location
          </Button>
        </div>

        {/* Inputs */}
        <div className="glass-card rounded-2xl p-6 shadow-2xl border border-primary/20">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">⚖️ Compare Profiles (Pressure vs Parameter)</h2>

          {mode === "float" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Enter first float ID" value={firstFloat} onChange={(e) => setFirstFloat(e.target.value)} className="w-full px-4 py-2 glass-card border rounded-xl text-sm" />
              <input type="text" placeholder="Enter second float ID" value={secondFloat} onChange={(e) => setSecondFloat(e.target.value)} className="w-full px-4 py-2 glass-card border rounded-xl text-sm" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div ref={firstMapContainerRef} className="h-56 rounded-xl border w-full" />
                {firstLat != null && firstLng != null && <p className="text-sm mt-2">📍 First: {firstLat.toFixed(4)}, {firstLng.toFixed(4)}</p>}
              </div>
              <div>
                <div ref={secondMapContainerRef} className="h-56 rounded-xl border w-full" />
                {secondLat != null && secondLng != null && <p className="text-sm mt-2">📍 Second: {secondLat.toFixed(4)}, {secondLng.toFixed(4)}</p>}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          {/* Pressure Range */}
          <div className="mt-4">
            <label className="text-sm font-medium mb-2">Pressure Range (dbar)</label>
            <div className="flex items-center gap-3">
              <input type="number" min={0} max={pressureRange[1]} value={pressureRange[0]} onChange={(e) => setPressureRange([Math.min(Number(e.target.value), pressureRange[1]), pressureRange[1]])} className="w-20 px-2 py-1 border rounded" />
              <span>–</span>
              <input type="number" min={pressureRange[0]} max={2000} value={pressureRange[1]} onChange={(e) => setPressureRange([pressureRange[0], Math.max(Number(e.target.value), pressureRange[0])])} className="w-20 px-2 py-1 border rounded" />
              <div className="flex-1">
                <input type="range" min={0} max={2000} step={10} value={pressureRange[0]} onChange={(e) => setPressureRange([Math.min(Number(e.target.value), pressureRange[1]), pressureRange[1]])} className="w-full" />
                <input type="range" min={0} max={2000} step={10} value={pressureRange[1]} onChange={(e) => setPressureRange([pressureRange[0], Math.max(Number(e.target.value), pressureRange[0])])} className="w-full" />
              </div>
              <div className="w-28 text-sm text-right">Showing {pressureRange[0]} – {pressureRange[1]} dbar</div>
            </div>
          </div>

          {/* Parameters */}
          <div className="mt-5 space-y-2">
            {parameters.map((param) => (
              <label key={param.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedParams.includes(param.id)} onChange={() => handleParamToggle(param.id)} />
                {param.icon} {param.name}
              </label>
            ))}
            <p className="text-xs text-muted-foreground">Pressure is always the Y-axis.</p>
          </div>

          {/* Submit */}
          <div className="mt-6">
            <Button
              onClick={handleSubmit}
              className="w-full sm:w-auto"
              disabled={
                isLoading ||
                selectedParams.length === 0 ||
                (mode === "float" && (!firstFloat.trim() || !secondFloat.trim())) ||
                (mode === "location" && (!firstLat || !firstLng || !secondLat || !secondLng))
              }
            >
              {isLoading ? "Comparing..." : "Compare Profiles"}
            </Button>
          </div>
        </div>

        {/* Visualization */}
        <div className="glass-card rounded-2xl p-6 border shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-lg sm:text-xl font-bold">📊 Comparison Visualization</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" variant={compareMode === "overlay" ? "default" : "outline"} onClick={() => setCompareMode("overlay")}>🔀 Overlay</Button>
              <Button size="sm" variant={compareMode === "side" ? "default" : "outline"} onClick={() => setCompareMode("side")}>🆚 Side-by-Side</Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={visualType === "line" ? "default" : "outline"} onClick={() => setVisualType("line")}>📈 Line</Button>
            <Button size="sm" variant={visualType === "area" ? "default" : "outline"} onClick={() => setVisualType("area")}>🌊 Area</Button>
            <Button size="sm" variant={visualType === "bar" ? "default" : "outline"} onClick={() => setVisualType("bar")}>📊 Bar</Button>
          </div>

          {isClient && (firstData.length > 0 || secondData.length > 0) ? (
            compareMode === "overlay" ? (
              <motion.div key={visualType + "-overlay"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-80">
                <Plot data={generateOverlayTraces()} layout={generatePlotlyLayout()} style={{ width: "100%", height: "100%" }} config={{ displayModeBar: true }} />
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div key={"side-0"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-80">
                  <Plot data={generateSingleTraces(firstData)} layout={{ ...generatePlotlyLayout(), title: { text: "First Profile" } }} style={{ width: "100%", height: "100%" }} config={{ displayModeBar: true }} />
                </motion.div>
                <motion.div key={"side-1"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-80">
                  <Plot data={generateSingleTraces(secondData)} layout={{ ...generatePlotlyLayout(), title: { text: "Second Profile" } }} style={{ width: "100%", height: "100%" }} config={{ displayModeBar: true }} />
                </motion.div>
              </div>
            )
          ) : (
            <p className="text-muted-foreground text-sm">Select filters and fetch profiles to view chart</p>
          )}
        </div>
    
      </div>
    </>
  )
}
