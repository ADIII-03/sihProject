// Type definitions for API responses and data structures

export interface ApiResponse {
  type: "profile" | "comparison" | "map" | "timeseries" | "heatmap"
  query_info: string
  data: ProfileData | ComparisonData | MapData | TimeSeriesData | HeatmapData
}

export interface ProfileData {
  profiles: Array<{
    depth: number
    value: number
  }>
  variable: string
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface ComparisonData {
  comparisons: Array<{
    depth: number
    series1: number
    series2: number
  }>
  series1Name: string
  series2Name: string
  variable: string
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface TimeSeriesData {
  timeseries: Array<{
    timestamp: string
    value: number
  }>
  variable: string
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface HeatmapData {
  heatmap: Array<{
    depth: number
    time: string
    value: number
  }>
  variable: string
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface MapData {
  floats: Array<{
    id: string
    latitude: number
    longitude: number
    depth?: number
    temperature?: number
    salinity?: number
    timestamp?: string
    trajectory?: Array<{
      lat: number
      lng: number
      timestamp: string
    }>
  }>
  title: string
  center?: [number, number]
  zoom?: number
  showTrajectories?: boolean
}

export interface QueryRequest {
  query: string
}

export interface ErrorResponse {
  error: string
  message?: string
}
