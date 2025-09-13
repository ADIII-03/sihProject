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

export default function ViewProfilePage() {
  const [mode, setMode] = useState<"float" | "location">("float")
  const [floatId, setFloatId] = useState("")
  const [cycleNumber, setCycleNumber] = useState("")
  const [selectedParams, setSelectedParams] = useState<string[]>(["salinity"])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [depthRange, setDepthRange] = useState([0, 2000])
  const [chartData, setChartData] = useState<any[]>([])
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

  useEffect(() => {
    if (mode === "location" && mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [78, 20], // Default India
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
    setIsLoading(true)
    try {
      let body: any = {}

      if (mode === "float") {
        body = { floatId, cycleNumber, parameters: selectedParams, depthRange, startDate, endDate }
        const res = await fetch("/api/queryFloat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json();
const chartRows = data?.data || [];

const formattedChartData = chartRows.map((d: any) => ({
  depth: d.pressure, // x-axis
  temperature: d.temperature,
  salinity: d.salinity,
  pressure: d.pressure,
}));

setChartData(formattedChartData);

      } else if (mode === "location" && lat && lng) {
        body = { latitude: lat, longitude: lng, parameters: selectedParams, depthRange, startDate, endDate }
        const res = await fetch("/api/queryLocation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json();
const chartRows = data?.data || [];

const formattedChartData = chartRows.map((d: any) => ({
  depth: d.pressure, // x-axis
  temperature: d.temperature,
  salinity: d.salinity,
  pressure: d.pressure,
}));

setChartData(formattedChartData);

      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
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

        {/* FLOAT MODE */}
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

        {/* LOCATION MODE */}
        {mode === "location" && (
          <div className="space-y-3">
            <div ref={mapContainerRef} className="h-60 sm:h-72 w-full rounded-xl border" />
            {lat && lng && (
              <p className="text-sm">📍 Selected: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
            )}
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
              (mode === "float" && !floatId.trim()) ||
              (mode === "location" && (!lat || !lng))
            }
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
            <Button size="sm" className="flex-1 sm:flex-none"
              variant={visualType === "line" ? "default" : "outline"}
              onClick={() => setVisualType("line")}
            >
              📈 Line
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none"
              variant={visualType === "area" ? "default" : "outline"}
              onClick={() => setVisualType("area")}
            >
              🌊 Area
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none"
              variant={visualType === "bar" ? "default" : "outline"}
              onClick={() => setVisualType("bar")}
            >
              📊 Bar
            </Button>
          </div>
        </div>
{chartData.length > 0 ? (
  <motion.div
    key={visualType}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    {/* 📊 Line Chart */}
    {visualType === "line" && (
      <div style={{ width: "100%", height: 384 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis
              dataKey="depth"
              type="number"
              reversed
              stroke="#aaa"
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }}
              labelStyle={{ color: "#ddd" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            {selectedParams.includes("temperature") && (
              <Line dataKey="temperature" stroke="#ff7300" dot={false} />
            )}
            {selectedParams.includes("salinity") && (
              <Line dataKey="salinity" stroke="#4da6ff" dot={false} />
            )}
            {selectedParams.includes("pressure") && (
              <Line dataKey="pressure" stroke="#00c49f" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}

    {/* 📊 Area Chart */}
    {visualType === "area" && (
      <div style={{ width: "100%", height: 384 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis
              dataKey="depth"
              type="number"
              reversed
              stroke="#aaa"
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }}
              labelStyle={{ color: "#ddd" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            {selectedParams.includes("temperature") && (
              <Area
                dataKey="temperature"
                stroke="#ff7300"
                fill="#ffb380"
                type="monotone"
              />
            )}
            {selectedParams.includes("salinity") && (
              <Area
                dataKey="salinity"
                stroke="#4da6ff"
                fill="#80c6ff"
                type="monotone"
              />
            )}
            {selectedParams.includes("pressure") && (
              <Area
                dataKey="pressure"
                stroke="#00c49f"
                fill="#80ffe0"
                type="monotone"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}

    {/* 📊 Bar Chart */}
    {visualType === "bar" && (
      <div style={{ width: "100%", height: 384 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis
              dataKey="depth"
              type="number"
              reversed
              stroke="#aaa"
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }}
              labelStyle={{ color: "#ddd" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            {selectedParams.includes("temperature") && (
              <Bar dataKey="temperature" fill="#ff7300" />
            )}
            {selectedParams.includes("salinity") && (
              <Bar dataKey="salinity" fill="#4da6ff" />
            )}
            {selectedParams.includes("pressure") && (
              <Bar dataKey="pressure" fill="#00c49f" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
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
