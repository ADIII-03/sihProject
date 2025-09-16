"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

export default function ComparePage() {
  // ------------------- STATE -------------------
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

  // ------------------- EFFECTS -------------------
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (mode === "location") {
      // First Map
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
      // Second Map
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

  // ------------------- HANDLERS -------------------
  const handleParamToggle = (paramId: string) => {
    setSelectedParams((prev) =>
      prev.includes(paramId) ? prev.filter((p) => p !== paramId) : [...prev, paramId]
    )
  }

  // Add this useEffect after your state declarations
useEffect(() => {
  // Dummy data for testing
  const dummyFirstData = Array.from({ length: 20 }, (_, i) => ({
    depth: i * 100,
    temperature: 10 + Math.random() * 5,
    salinity: 34 + Math.random(),
    pressure: i * 10,
  }));

  const dummySecondData = Array.from({ length: 20 }, (_, i) => ({
    depth: i * 100,
    temperature: 12 + Math.random() * 5,
    salinity: 35 + Math.random(),
    pressure: i * 10 + 5,
  }));

  setFirstData(dummyFirstData);
  setSecondData(dummySecondData);

  // Dummy float IDs
  setFirstFloat("FLOAT-001");
  setSecondFloat("FLOAT-002");

  // Dummy location
  setFirstLat(20);
  setFirstLng(78);
  setSecondLat(22);
  setSecondLng(80);

  // Set default depth range
  setDepthRange([0, 2000]);
}, []);


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

  // ------------------- DATA PREP -------------------
  const buildOverlayMap = () => {
    const m = new Map<number, any>()
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
    return Array.from(m.values()).sort((a, b) => a.depth - b.depth)
  }

  const getOverlayData = () => buildOverlayMap()

  const generatePlotlyTraces = (overlay: boolean) => {
    const traces: any[] = []
    const data = getOverlayData().filter(
      (d) => d.depth >= depthRange[0] && d.depth <= depthRange[1]
    )
    selectedParams.forEach((param) => {
      if (param === "temperature") {
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => overlay ? d.firstTemperature : firstData.map((fd) => fd.temperature)),
          type: visualType,
          mode: visualType === "line" ? "lines" :
           undefined,
            fill: visualType === "area" ? "tozerox" : "none",
          name: "First Temp",
        })
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => overlay ? d.secondTemperature : secondData.map((sd) => sd.temperature)),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
           fill: visualType === "area" ? "tozerox" : undefined,
          name: "Second Temp",
        })
      }
      if (param === "salinity") {
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => overlay ? d.firstSalinity : firstData.map((fd) => fd.salinity)),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
            fill: visualType === "area" ? "tozerox" : undefined,
          name: "First Salinity",
        })
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => overlay ? d.secondSalinity : secondData.map((sd) => sd.salinity)),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
            fill: visualType === "area" ? "tozerox" : undefined,
          name: "Second Salinity",
        })
      }
      if (param === "pressure") {
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => overlay ? d.firstPressure : firstData.map((fd) => fd.pressure)),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
            fill: visualType === "area" ? "tozerox" : undefined,
          name: "First Pressure",
        })
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => overlay ? d.secondPressure : secondData.map((sd) => sd.pressure)),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
            fill: visualType === "area" ? "tozerox" : undefined,
          name: "Second Pressure",
        })
      }
    })
    return traces
  }

  const generateSingleTraces = (dataSet: any[]) => {
    const traces: any[] = []
    const data = dataSet.filter(
      (d) => d.depth >= depthRange[0] && d.depth <= depthRange[1]
    )
    selectedParams.forEach((param) => {
      if (param === "temperature") {
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => d.temperature),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
            fill: visualType === "area" ? "tozerox" : undefined,
          name: "Temperature",
        })
      }
      if (param === "salinity") {
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => d.salinity),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
            fill: visualType === "area" ? "tozerox" : undefined,
          name: "Salinity",
        })
      }
      if (param === "pressure") {
        traces.push({
          y: data.map((d) => d.depth),
          x: data.map((d) => d.pressure),
          type: visualType,
          mode: visualType === "line" ? "lines" : undefined,
            fill: visualType === "area" ? "tozerox" : undefined,
          name: "Pressure",
        })
      }
    })
    return traces
  }

 const generatePlotlyLayout = () => ({
  yaxis: { autorange: "reversed", title: { text: "Depth (m)" } },
  xaxis: { title: { text: "Value" } },
  margin: { t: 30, r: 30, b: 50, l: 50 },
  legend: { orientation: "h", y: -0.2 },
  hovermode: "closest",
  paper_bgcolor: "#1e1e1e",
  plot_bgcolor: "#1e1e1e",
  font: { color: "#fff" },
})


  // ------------------- JSX -------------------
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

      {/* Input + Filters */}
      <div className="glass-card rounded-2xl p-6 shadow-2xl border border-primary/20">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">⚖️ Compare Profiles</h2>
        {/* Float Inputs */}
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
        {/* Location Inputs */}
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
        {/* Depth Range */}
        <div className="mt-4">
  <label className="text-sm font-medium mb-2">Depth Range (m)</label>
  <div className="flex items-center gap-4">
    <span className="text-sm">{depthRange[0]}</span>
    <input
      type="range"
      min={0}
      max={2000}
      step={50}
      value={depthRange[0]}
      onChange={(e) => setDepthRange([Math.min(Number(e.target.value), depthRange[1]), depthRange[1]])}
      className="flex-1 accent-primary"
    />
    <input
      type="range"
      min={0}
      max={2000}
      step={50}
      value={depthRange[1]}
      onChange={(e) => setDepthRange([depthRange[0], Math.max(Number(e.target.value), depthRange[0])])}
      className="flex-1 accent-primary"
    />
    <span className="text-sm">{depthRange[1]}</span>
  </div>
</div>

        {/* Parameter Selection */}
        <div className="mt-5 space-y-2">
          {parameters.map((param) => (
            <label key={param.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selectedParams.includes(param.id)} onChange={() => handleParamToggle(param.id)} />
              {param.icon} {param.name}
            </label>
          ))}
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

        {/* Visual Type */}
        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={visualType === "line" ? "default" : "outline"} onClick={() => setVisualType("line")}>📈 Line</Button>
          <Button size="sm" variant={visualType === "area" ? "default" : "outline"} onClick={() => setVisualType("area")}>🌊 Area</Button>
          <Button size="sm" variant={visualType === "bar" ? "default" : "outline"} onClick={() => setVisualType("bar")}>📊 Bar</Button>
        </div>

        {/* Plot */}
        {isClient && (firstData.length > 0 || secondData.length > 0) ? (
          compareMode === "overlay" ? (
            <motion.div key={visualType + "-overlay"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-80">
              <Plot data={generatePlotlyTraces(true)} layout={generatePlotlyLayout()} style={{ width: "100%", height: "100%" }} config={{ displayModeBar: true }} />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[firstData, secondData].map((dataSet, i) => (
                <motion.div key={visualType + "-side-" + i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} className="h-80">
                  <Plot
                    data={generateSingleTraces(dataSet)}
                    layout={{ ...generatePlotlyLayout(), title: {text :i === 0  ? "First Profile" : "Second Profile" }}}
                    style={{ width: "100%", height: "100%" }}
                    config={{ displayModeBar: true }}
                  />
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <p className="text-muted-foreground text-sm">Select filters and fetch profiles to view chart</p>
        )}
      </div>
    </div>
  )
}
