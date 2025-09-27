"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import type { PlotParams } from "react-plotly.js"
import * as Cesium from "cesium"
import "cesium/Build/Cesium/Widgets/widgets.css"
import toast, { Toaster } from "react-hot-toast"

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), { ssr: false })

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

type ChartDatum = {
  depth: number
  temperature?: number
  salinity?: number
  pressure?: number
}

type TrajPoint = { latitude: number; longitude: number }

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
  const [isTrajectoryLoading, setIsTrajectoryLoading] = useState(false)

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  // Mapbox Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  // Cesium Refs
  const cesiumRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null) // keep one viewer
  const [trajectory, setTrajectory] = useState<TrajPoint[]>([])
  const [showTrajectory, setShowTrajectory] = useState(false)

  const [visualType, setVisualType] = useState<"line" | "area" | "bar">("line")

  const parameters = [
    { id: "temperature", name: "Temperature", icon: "🌡️" },
    { id: "salinity", name: "Salinity", icon: "🧂" },
  ]

  /* -------------------------
     Mapbox: location picker
     ------------------------- */
  useEffect(() => {
    if (mode !== "location") return
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    try {
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
        if (mapRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(mapRef.current)
        }
      })
    } catch (err) {
      console.error("[Mapbox] init error:", err)
      toast.error("Map initialization failed.")
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mode])

  /* -------------------------
     Helpers & UI handlers
     ------------------------- */
  const handleParamToggle = (paramId: string) => {
    setSelectedParams((prev) => (prev.includes(paramId) ? prev.filter((p) => p !== paramId) : [...prev, paramId]))
  }

  const handleSubmit = async () => {
    if (mode === "float" && !floatId.trim()) {
      toast.error("Enter a Float ID to fetch profile.")
      return
    }
    if (mode === "location" && (lat === null || lng === null)) {
      toast.error("Select a location on the map first.")
      return
    }

    setIsLoading(true)
    try {
      const apiUrl = mode === "float" ? "/api/queryFloat" : "/api/queryLocation"

      const payload =
        mode === "float"
          ? {
              floatId,
              cycleNumber,
              parameters: selectedParams,
              pressureRange: depthRange, // ✅ renamed
              ...(startDate && endDate ? { startDate, endDate } : {}),
            }
          : {
              latitude: lat,
              longitude: lng,
              parameters: selectedParams,
              pressureRange: depthRange,
              ...(startDate && endDate ? { startDate, endDate } : {}),
            }

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => null)
        console.error("[API] query profile non-OK response:", res.status, text)
        toast.error(`Query failed (${res.status}).`)
        setIsLoading(false)
        return
      }

      const json = await res.json()
      if (json?.error) {
        console.error("[API] query profile returned error:", json.error)
        toast.error("Profile API returned an error.")
        return
      }

      setChartData(json.data ?? [])

      if (mode === "location") {
        toast.success("📡 We found the nearest float profile data for you!")
      } else {
        toast.success("✅ Float profile loaded.")
      }
    } catch (err) {
      console.error("[Fetch] query profile failed:", err)
      toast.error("Failed to fetch profile.")
    } finally {
      setIsLoading(false)
    }
  }

  /* -------------------------
     Show Trajectory (dummy + commented API)
     ------------------------- */
  const handleShowTrajectory = async () => {
    if (!floatId.trim()) {
      toast("No Float ID provided — showing demo trajectory.", { icon: "ℹ️" })
    }

    setIsTrajectoryLoading(true) // ✅ start loading
    try {
      const res = await fetch("/api/trajectory?floatId=" + encodeURIComponent(floatId.trim()))
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        console.error("[API] /api/trajectory non-OK:", res.status, txt)
        toast.error("Trajectory API error.")
        return
      }

      const json = await res.json()
      if (json?.error) {
        console.error("[API] /api/trajectory returned error:", json.error)
        toast.error("Trajectory API returned an error.")
        return
      }

      const apiPoints: TrajPoint[] = json.data ?? []
      if (!Array.isArray(apiPoints) || apiPoints.length === 0) {
        toast("No trajectory points returned for this float.", { icon: "⚠️" })
        return
      }

      setTrajectory(apiPoints)
      setShowTrajectory(true)
    } catch (err) {
      console.error("[ShowTrajectory] failed:", err)
      toast.error("Failed to get trajectory.")
    } finally {
      setIsTrajectoryLoading(false) // ✅ always stop loading
    }
  }

  /* -------------------------
     Cesium: initialize and update
     - init viewer once (when first needed)
     - on trajectory changes: update entities and camera
     - viewer destroyed only on component unmount
     ------------------------- */
  useEffect(() => {
    if (!showTrajectory || !cesiumRef.current || trajectory.length === 0) return

    // init one-time
    if (!viewerRef.current) {
      try {
        ;(window as any).CESIUM_BASE_URL = "/cesium"
        Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? ""

        viewerRef.current = new Cesium.Viewer(cesiumRef.current, {
          baseLayerPicker: false,
          geocoder: false,
          sceneModePicker: false,
          fullscreenButton: false,
          navigationHelpButton: false,
          timeline: false,
          animation: false,
          // The globe can be stylized here if needed
        })
      } catch (err) {
        console.error("[Cesium] init error:", err)
        toast.error("Cesium initialization failed.")
        return
      }
    }

    const viewer = viewerRef.current!
    // clear previous entities (fast)
    try {
      // clear previous entities (fast)
      viewer.entities.removeAll()

      const positions = trajectory.map((p) => Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude))

      // add polyline (path)
      viewer.entities.add({
        id: "traj-polyline",
        polyline: {
          positions,
          width: 3,
          material: Cesium.Color.YELLOW.withAlpha(0.95),
          clampToGround: false,
        },
      })

      // choose ~5 points to label: start, end, and 3 evenly spaced
      const labelCount = 5
      const step = Math.max(1, Math.floor(trajectory.length / (labelCount - 1)))
      const labeledPoints = trajectory.filter((_, idx) => idx % step === 0 || idx === trajectory.length - 1)

      // add labeled points
      labeledPoints.forEach((point, i) => {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude),
          point: { pixelSize: 8, color: Cesium.Color.CYAN },
          label: {
            text: `${point.latitude.toFixed(2)}, ${point.longitude.toFixed(2)}`,
            font: "12px sans-serif",
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          },
        })
      })

      // also mark first and last more clearly
      viewer.entities.add({
        id: "traj-start",
        position: positions[0],
        point: { pixelSize: 12, color: Cesium.Color.GREEN },
        label: {
          text: "Start",
          font: "14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
      })

      viewer.entities.add({
        id: "traj-end",
        position: positions[positions.length - 1],
        point: { pixelSize: 12, color: Cesium.Color.RED },
        label: {
          text: "End",
          font: "14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
      })

      // zoom / fly to entities
      viewer.zoomTo(viewer.entities).catch((e) => {
        console.warn("[Cesium] zoomTo failed:", e)
      })
    } catch (err) {
      console.error("[Cesium] render trajectory failed:", err)
      toast.error("Failed to render trajectory on globe.")
    }
  }, [trajectory, showTrajectory])

  // Ensure viewer resizes when the container becomes visible or window resizes
  useEffect(() => {
    if (!viewerRef.current) return
    // small timeout to ensure DOM has settled
    const t = setTimeout(() => viewerRef.current?.resize(), 200)
    return () => clearTimeout(t)
  }, [showTrajectory])

  useEffect(() => {
    const onResize = () => viewerRef.current?.resize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // cleanup viewer on unmount only
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy()
        } catch (err) {
          console.warn("[Cesium] destroy error:", err)
        }
        viewerRef.current = null
      }
    }
  }, [])

  /* -------------------------
     Plotly chart logic
     ------------------------- */
  const filteredChartData = chartData.filter((d) => d.depth >= depthRange[0] && d.depth <= depthRange[1])

  const traces: PlotParams["data"] = []
  if (filteredChartData.length > 0) {
    selectedParams.forEach((param) => {
      const yData = filteredChartData.map((d) => d.depth)
      let xData: number[] = []
      let color = ""

      switch (param) {
        case "temperature":
          xData = filteredChartData.map((d) => d.temperature!).filter((v) => v !== undefined)
          color = "#ff7300"
          break
        case "salinity":
          xData = filteredChartData.map((d) => d.salinity!).filter((v) => v !== undefined)
          color = "#4da6ff"
          break
        case "pressure":
          xData = filteredChartData.map((d) => d.pressure!).filter((v) => v !== undefined)
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

  /* -------------------------
     Render
     ------------------------- */
  return (
    <>
      <Toaster position="top-right" />
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
                <p className="text-sm">
                  📍 Selected: {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
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
                className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Depth Range */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Pressure Range (dbar)</label>

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
            <p className="text-sm">
              Showing pressure {depthRange[0]} – {depthRange[1]} dbar
            </p>
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

          {/* Submit + Trajectory Button */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none"
              disabled={isLoading || selectedParams.length === 0 || (mode === "float" && !floatId.trim())}
            >
              {isLoading ? "Fetching..." : "Fetch Profile"}
            </Button>

            {mode === "float" && (
              <Button
                onClick={handleShowTrajectory}
                variant="outline"
                className="flex-1 sm:flex-none bg-transparent"
                disabled={isTrajectoryLoading} // ✅ disable while loading
              >
                {isTrajectoryLoading ? "Loading trajectory..." : "🌍 Show Trajectory"}
              </Button>
            )}
          </div>
        </div>

        {/* Visualization (Plotly) */}
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
                  xaxis: { title: { text: "Value" }, gridcolor: "#444" },
                  yaxis: { title: { text: "Pressure (dbar)" }, autorange: "reversed", gridcolor: "#444" },
                  legend: { font: { color: "#ccc" } },
                  margin: { l: 60, r: 20, t: 30, b: 50 },
                }}
                style={{ width: "100%", height: "100%" }}
                config={{ responsive: true }}
              />
            </motion.div>
          ) : (
            <p className="text-muted-foreground text-sm">Select filters and fetch profile to view chart</p>
          )}
        </div>

        {/* Trajectory Globe */}
        {showTrajectory && <div ref={cesiumRef} className="w-full h-[500px] rounded-xl overflow-hidden border" />}
      </div>
    </>
  )
}
