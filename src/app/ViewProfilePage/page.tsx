"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import type { PlotParams } from "react-plotly.js"

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), { ssr: false })

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

type ChartDatum = {
  depth: number
  temperature?: number
  salinity?: number
  pressure?: number
}
type ViewProfilePageProps = {
  floatId?: string
}


export default function ViewProfilePage({ floatId: initialFloatId }: ViewProfilePageProps) {
  const [mode, setMode] = useState<"float" | "location">("float")
    const [floatId, setFloatId] = useState(initialFloatId || "")
  const [cycleNumber, setCycleNumber] = useState("")
  const [selectedParams, setSelectedParams] = useState<string[]>(["salinity"])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [depthRange, setDepthRange] = useState([0, 2000])
  const [chartData, setChartData] = useState<ChartDatum[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [visualType, setVisualType] = useState<"line" | "area" | "bar">("line")

  const parameters = [
    { id: "temperature", name: "Temperature", icon: "🌡️" },
    { id: "salinity", name: "Salinity", icon: "🧂" },
    { id: "pressure", name: "Pressure", icon: "⚡" },
  ]

  // Initialize map for location mode
  useEffect(() => {
    if (mode === "location" && mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [78, 20],
        zoom: 2,
      })

      mapRef.current.on("click", (e) => {
        const { lng, lat } = e.lngLat
        setLat(lat)
        setLng(lng)

        if (markerRef.current) markerRef.current.remove()
        markerRef.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current!)
      })
    }
  }, [mode])

  const handleParamToggle = (paramId: string) => {
    setSelectedParams((prev) =>
      prev.includes(paramId) ? prev.filter((p) => p !== paramId) : [...prev, paramId]
    )
  }

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const apiUrl = mode === "float" ? "/api/queryFloat" : "/api/queryLocation";

    const payload =
      mode === "float"
        ? {
            floatId,
            cycleNumber,
            parameters: selectedParams,
            depthRange,
            startDate,
            endDate,
          }
        : {
            latitude: lat,
            longitude: lng,
            cycle_number: cycleNumber ? Number(cycleNumber) : undefined,
            juld_start: startDate || undefined,
            juld_end: endDate || undefined,
            pressure_min: depthRange[0],
            pressure_max: depthRange[1],
          };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.error) {
      console.error("API error:", json.error);
      return;
    }

    setChartData(json.data);
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    setIsLoading(false);
  }
};


  const filteredChartData = chartData.filter(
    (d) => d.depth >= depthRange[0] && d.depth <= depthRange[1]
  )

  // Generate Plotly traces
 const traces: PlotParams["data"] = []

if (filteredChartData.length > 0) {
  selectedParams.forEach((param) => {
    const yData = filteredChartData.map((d) => d.depth)
    let xData: number[] = []
    let color = ""

    switch (param) {
      case "temperature":
        xData = filteredChartData.map((d) => d.temperature!).filter(v => v !== undefined)
        color = "#ff7300"
        break
      case "salinity":
        xData = filteredChartData.map((d) => d.salinity!).filter(v => v !== undefined)
        color = "#4da6ff"
        break
      case "pressure":
        xData = filteredChartData.map((d) => d.pressure!).filter(v => v !== undefined)
        color = "#00c49f"
        break
    }

    if (xData.length > 0) {
      traces.push({
        x: xData,
        y: yData,
        type: visualType === "bar" ? "bar" : "scatter",
        mode: visualType === "line" ? "lines" : "markers",
        fill: visualType === "area" ? "tozeroy" : undefined,
        name: param.charAt(0).toUpperCase() + param.slice(1),
        line: { color },
        marker: { color },
        orientation: visualType === "bar" ? "h" : undefined,
      })
    }
  })
}

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-3 sm:px-6">
      {/* Mode Switch */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
        <Button
          className="flex-1 sm:flex-none"
          variant={mode === "float" ? "default" : "outline"}
          onClick={() => setMode("float")}
        >
          🔍 Float ID
        </Button>
        <Button
          className="flex-1 sm:flex-none"
          variant={mode === "location" ? "default" : "outline"}
          onClick={() => setMode("location")}
        >
          📍 Location
        </Button>
      </div>

      {/* Query Card */}
      <div className="glass-card rounded-2xl p-5 shadow-2xl border border-primary/20">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">
          {mode === "float" ? "🌊 View by Float ID" : "📍 View by Location"}
        </h2>

        {mode === "float" && (
          <div className="space-y-3">
            <input
              type="text"
              value={floatId}
              onChange={(e) => setFloatId(e.target.value)}
              placeholder="Enter float ID"
              className="w-full px-4 py-2 glass-card border rounded-xl text-sm"
            />
            <input
              type="text"
              value={cycleNumber}
              onChange={(e) => setCycleNumber(e.target.value)}
              placeholder="Enter cycle number"
              className="w-full px-4 py-2 glass-card border rounded-xl text-sm"
            />
          </div>
        )}

        {mode === "location" && (
          <div className="space-y-3">
            <div ref={mapContainerRef} className="h-60 sm:h-72 w-full rounded-xl border" />
            {lat && lng && (
              <p className="text-sm">📍 Selected: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
            )}
          </div>
        )}

        {/* Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm appearance-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm appearance-none"
            />
          </div>
        </div>

        {/* Depth Range */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Depth Range (m)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={depthRange[1]}
              value={depthRange[0]}
              onChange={(e) => setDepthRange([Number(e.target.value), depthRange[1]])}
              className="w-20 px-2 py-1 border rounded"
            />
            <span>–</span>
            <input
              type="number"
              min={depthRange[0]}
              max={2000}
              value={depthRange[1]}
              onChange={(e) => setDepthRange([depthRange[0], Number(e.target.value)])}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
          <p className="text-sm">Showing depth {depthRange[0]} – {depthRange[1]} m</p>
        </div>

        {/* Parameters */}
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

        {/* Submit Button */}
        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            className="w-full sm:w-auto"
            disabled={isLoading || selectedParams.length === 0}
          >
            {isLoading ? "Fetching..." : "Fetch Profile"}
          </Button>
        </div>
      </div>

      {/* Visualization */}
      <div className="glass-card rounded-2xl p-5 border shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-bold">📊 Visualization</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant={visualType === "line" ? "default" : "outline"}
              onClick={() => setVisualType("line")}
            >
              📈 Line
            </Button>
            <Button
              size="sm"
              variant={visualType === "area" ? "default" : "outline"}
              onClick={() => setVisualType("area")}
            >
              🌊 Area
            </Button>
            <Button
              size="sm"
              variant={visualType === "bar" ? "default" : "outline"}
              onClick={() => setVisualType("bar")}
            >
              📊 Bar
            </Button>
          </div>
        </div>

        {traces.length > 0 ? (
          <motion.div
            key={visualType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Plot
              data={traces}
              layout={{
                autosize: true,
                height: 400,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#ddd" },
                xaxis: { title: "Value", gridcolor: "#444" },
                yaxis: { title: "Depth (m)", autorange: "reversed", gridcolor: "#444" },
                legend: { font: { color: "#ccc" } },
                margin: { l: 60, r: 20, t: 30, b: 50 },
              }}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </motion.div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Select filters and fetch profile to view chart
          </p>
        )}
      </div>
    </div>
  )
}
