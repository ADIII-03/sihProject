"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

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

  const [selectedParams, setSelectedParams] = useState<string[]>(["salinity"])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [depthRange, setDepthRange] = useState<[number, number]>([0, 2000])

  const [firstData, setFirstData] = useState<any[]>([])
  const [secondData, setSecondData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [visualType, setVisualType] = useState<"line" | "area" | "bar">("line")
  const [compareMode, setCompareMode] = useState<"overlay" | "side">("overlay")
  const [isClient, setIsClient] = useState(false)

  const parameters = [
    { id: "temperature", name: "Temperature", icon: "🌡️" },
    { id: "salinity", name: "Salinity", icon: "🧂" },
    { id: "pressure", name: "Pressure", icon: "⚡" },
  ]

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (mode === "location") {
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
          firstMarkerRef.current = new mapboxgl.Marker({ color: "blue" })
            .setLngLat([lng, lat])
            .addTo(firstMapRef.current!)
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
          secondMarkerRef.current = new mapboxgl.Marker({ color: "red" })
            .setLngLat([lng, lat])
            .addTo(secondMapRef.current!)
        })
      }
    }
  }, [mode])

  const handleParamToggle = (paramId: string) => {
    setSelectedParams((prev) =>
      prev.includes(paramId) ? prev.filter((p) => p !== paramId) : [...prev, paramId]
    )
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      let endpoint = ""
      let body: any = {}

      if (mode === "float") {
        endpoint = "/api/ComparequeryFloat"
        body = {
          firstFloat,
          secondFloat,
          parameters: selectedParams,
          depthRange,
          startDate,
          endDate,
        }
      } else {
        endpoint = "/api/comparequeryLocation"
        body = {
          firstLat,
          firstLng,
          secondLat,
          secondLng,
          parameters: selectedParams,
          depthRange,
          startDate,
          endDate,
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (mode === "float") {
        setFirstData(data.firstFloat?.data || [])
        setSecondData(data.secondFloat?.data || [])
      } else {
        setFirstData(data.firstLocation?.data || [])
        setSecondData(data.secondLocation?.data || [])
      }
    } catch (error) {
      console.error("❌ Error comparing profiles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // ---------- NEW: Proper overlay alignment by depth ----------
  // Build a Map keyed by numeric depth so values align correctly, even if depths differ
  const buildOverlayMap = () => {
    const m = new Map<number, any>()

    // Helper: ensure numeric depth exists and skip invalid
    const push = (src: any, prefix: "first" | "second") => {
      if (!src) return
      const depth = Number(src.depth ?? src.pres ?? src.pressure ?? src.m_pres)
      if (Number.isNaN(depth)) return
      const entry = m.get(depth) ?? { depth }
      if (prefix === "first") {
        if ("temperature" in src) entry.firstTemperature = src.temperature
        if ("salinity" in src) entry.firstSalinity = src.salinity
        if ("pressure" in src) entry.firstPressure = src.pressure ?? src.depth ?? src.pres
      } else {
        if ("temperature" in src) entry.secondTemperature = src.temperature
        if ("salinity" in src) entry.secondSalinity = src.salinity
        if ("pressure" in src) entry.secondPressure = src.pressure ?? src.depth ?? src.pres
      }
      m.set(depth, entry)
    }

    firstData.forEach((d) => push(d, "first"))
    secondData.forEach((d) => push(d, "second"))

    // Return sorted array by numeric depth ascending
    return Array.from(m.values()).sort((a, b) => a.depth - b.depth)
  }

  // returns overlay data; if forBar = true, convert depth to string so Recharts treats it categorical
  const getOverlayData = (forBar = false) => {
    const arr = buildOverlayMap()
    if (forBar) {
      return arr.map((r) => ({ ...r, depth: String(r.depth) })) // depth as category
    }
    return arr
  }
  // ---------- end overlay helpers ----------

  // Helper to get chart-specific axis props
  const renderOverlayChart = () => {
    const overlayForBar = visualType === "bar"
    const data = getOverlayData(overlayForBar)

    if (visualType === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis dataKey="depth" type="number" reversed stroke="#aaa" />
            <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} labelStyle={{ color: "#ddd" }} itemStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            {selectedParams.includes("temperature") && (
              <>
                <Line dataKey="firstTemperature" stroke="#ff7300" dot={false} name="First Temp" />
                <Line dataKey="secondTemperature" stroke="#0088fe" dot={false} name="Second Temp" />
              </>
            )}
            {selectedParams.includes("salinity") && (
              <>
                <Line dataKey="firstSalinity" stroke="#ff7f50" dot={false} name="First Salinity" />
                <Line dataKey="secondSalinity" stroke="#1f78b4" dot={false} name="Second Salinity" />
              </>
            )}
            {selectedParams.includes("pressure") && (
              <>
                <Line dataKey="firstPressure" stroke="#00c49f" dot={false} name="First Pressure" />
                <Line dataKey="secondPressure" stroke="#006644" dot={false} name="Second Pressure" />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (visualType === "area") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis dataKey="depth" type="number" reversed stroke="#aaa" />
            <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} labelStyle={{ color: "#ddd" }} itemStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            {selectedParams.includes("temperature") && (
              <>
                <Area dataKey="firstTemperature" stroke="#ff7300" fill="#ffb380" type="monotone" name="First Temp" />
                <Area dataKey="secondTemperature" stroke="#0088fe" fill="#80c6ff" type="monotone" name="Second Temp" />
              </>
            )}
            {selectedParams.includes("salinity") && (
              <>
                <Area dataKey="firstSalinity" stroke="#ff7f50" fill="#ffd1c2" type="monotone" name="First Salinity" />
                <Area dataKey="secondSalinity" stroke="#1f78b4" fill="#cfe8ff" type="monotone" name="Second Salinity" />
              </>
            )}
            {selectedParams.includes("pressure") && (
              <>
                <Area dataKey="firstPressure" stroke="#00c49f" fill="#a6f3df" type="monotone" name="First Pressure" />
                <Area dataKey="secondPressure" stroke="#006644" fill="#9fe6c7" type="monotone" name="Second Pressure" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    // BAR
    return (
      <ResponsiveContainer width="100%" height="100%">
        {/* For BarChart with layout="vertical", Recharts expects Y to be categorical.
            getOverlayData(true) already stringifies depth when forBar=true. */}
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis type="number" stroke="#aaa" />
          <YAxis dataKey="depth" type="category" stroke="#aaa" />
          <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} labelStyle={{ color: "#ddd" }} itemStyle={{ color: "#fff" }} />
          <Legend wrapperStyle={{ color: "#ccc" }} />
          {selectedParams.includes("temperature") && (
            <>
              <Bar dataKey="firstTemperature" fill="#ff7300" name="First Temp" />
              <Bar dataKey="secondTemperature" fill="#0088fe" name="Second Temp" />
            </>
          )}
          {selectedParams.includes("salinity") && (
            <>
              <Bar dataKey="firstSalinity" fill="#ff7f50" name="First Salinity" />
              <Bar dataKey="secondSalinity" fill="#1f78b4" name="Second Salinity" />
            </>
          )}
          {selectedParams.includes("pressure") && (
            <>
              <Bar dataKey="firstPressure" fill="#00c49f" name="First Pressure" />
              <Bar dataKey="secondPressure" fill="#006644" name="Second Pressure" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Side-by-side single-plot render (firstData or secondData)
  const renderSingleChart = (data: any[], index: number) => {
    // For Bar charts, convert depth to string for categorical Y
    const forBar = visualType === "bar"
    const plotData = forBar ? data.map((d) => ({ ...d, depth: String(d.depth) })) : data

    if (visualType === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={plotData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis dataKey="depth" type="number" reversed stroke="#aaa" />
            <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} labelStyle={{ color: "#ddd" }} itemStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            {selectedParams.includes("temperature") && <Line dataKey="temperature" stroke="#ff7300" dot={false} />}
            {selectedParams.includes("salinity") && <Line dataKey="salinity" stroke="#4da6ff" dot={false} />}
            {selectedParams.includes("pressure") && <Line dataKey="pressure" stroke="#00c49f" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (visualType === "area") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={plotData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis dataKey="depth" type="number" reversed stroke="#aaa" />
            <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} labelStyle={{ color: "#ddd" }} itemStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            {selectedParams.includes("temperature") && <Area dataKey="temperature" stroke="#ff7300" fill="#ffb380" type="monotone" />}
            {selectedParams.includes("salinity") && <Area dataKey="salinity" stroke="#4da6ff" fill="#80c6ff" type="monotone" />}
            {selectedParams.includes("pressure") && <Area dataKey="pressure" stroke="#00c49f" fill="#80ffe0" type="monotone" />}
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    // BAR single
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={plotData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis type="number" stroke="#aaa" />
          <YAxis dataKey="depth" type="category" stroke="#aaa" />
          <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }} labelStyle={{ color: "#ddd" }} itemStyle={{ color: "#fff" }} />
          <Legend wrapperStyle={{ color: "#ccc" }} />
          {selectedParams.includes("temperature") && <Bar dataKey="temperature" fill="#ff7300" />}
          {selectedParams.includes("salinity") && <Bar dataKey="salinity" fill="#4da6ff" />}
          {selectedParams.includes("pressure") && <Bar dataKey="pressure" fill="#00c49f" />}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-3 sm:px-6">
      {/* Mode Switch */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
        <Button
          className="flex-1 sm:flex-none"
          variant={mode === "float" ? "default" : "outline"}
          onClick={() => setMode("float")}
        >
          🔍 Compare by Float ID
        </Button>
        <Button
          className="flex-1 sm:flex-none"
          variant={mode === "location" ? "default" : "outline"}
          onClick={() => setMode("location")}
        >
          📍 Compare by Location
        </Button>
      </div>

      {/* Input Card */}
      <div className="glass-card rounded-2xl p-6 shadow-2xl border border-primary/20">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">⚖️ Compare Profiles</h2>

        {mode === "float" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Enter first float ID"
              value={firstFloat}
              onChange={(e) => setFirstFloat(e.target.value)}
              className="w-full px-4 py-2 glass-card border rounded-xl text-sm"
            />
            <input
              type="text"
              placeholder="Enter second float ID"
              value={secondFloat}
              onChange={(e) => setSecondFloat(e.target.value)}
              className="w-full px-4 py-2 glass-card border rounded-xl text-sm"
            />
          </div>
        )}

        {mode === "location" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div ref={firstMapContainerRef} className="h-56 rounded-xl border" />
              {firstLat && firstLng && (
                <p className="text-sm mt-2">📍 First: {firstLat.toFixed(4)}, {firstLng.toFixed(4)}</p>
              )}
            </div>
            <div>
              <div ref={secondMapContainerRef} className="h-56 rounded-xl border" />
              {secondLat && secondLng && (
                <p className="text-sm mt-2">📍 Second: {secondLat.toFixed(4)}, {secondLng.toFixed(4)}</p>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min="0"
            max="2000"
            step="50"
            value={depthRange[0]}
            onChange={(e) => setDepthRange([Number(e.target.value), depthRange[1]])}
            className="w-full accent-primary"
          />
          <p className="text-sm">Depth: {depthRange[0]} – {depthRange[1]} m</p>
        </div>

        <div className="mt-5 space-y-2">
          {parameters.map((param) => (
            <label key={param.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedParams.includes(param.id)}
                onChange={() => handleParamToggle(param.id)}
              />
              {param.icon} {param.name}
            </label>
          ))}
        </div>

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
            <Button size="sm" variant={compareMode === "overlay" ? "default" : "outline"} onClick={() => setCompareMode("overlay")}>
              🔀 Overlay
            </Button>
            <Button size="sm" variant={compareMode === "side" ? "default" : "outline"} onClick={() => setCompareMode("side")}>
              🆚 Side-by-Side
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={visualType === "line" ? "default" : "outline"} onClick={() => setVisualType("line")}>
            📈 Line
          </Button>
          <Button size="sm" variant={visualType === "area" ? "default" : "outline"} onClick={() => setVisualType("area")}>
            🌊 Area
          </Button>
          <Button size="sm" variant={visualType === "bar" ? "default" : "outline"} onClick={() => setVisualType("bar")}>
            📊 Bar
          </Button>
        </div>

        {isClient && (firstData.length > 0 || secondData.length > 0) ? (
          compareMode === "overlay" ? (
            <motion.div
              key={visualType + "-overlay"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="h-80"
            >
              {renderOverlayChart()}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ data: firstData, label: "First" }, { data: secondData, label: "Second" }].map((d, i) => (
                <motion.div
                  key={visualType + i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="h-80"
                >
                  {renderSingleChart(d.data, i)}
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <p className="text-muted-foreground text-sm">
            Select filters and fetch profiles to view chart
          </p>
        )}
      </div>
    </div>
  )
}
