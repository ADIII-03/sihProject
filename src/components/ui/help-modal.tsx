"use client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { X, MessageCircle, BarChart3, Map, TrendingUp, Grid3X3 } from "lucide-react"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  const exampleQueries = [
    {
      icon: <BarChart3 className="h-5 w-5 text-chart-1" />,
      category: "Depth Profiles",
      queries: [
        "Show me salinity profile near the equator in March 2023",
        "Display temperature depth profile for the Atlantic",
        "Generate oxygen profile for coordinates 30°N, 40°W",
      ],
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-chart-2" />,
      category: "Comparisons",
      queries: [
        "Compare oxygen levels in Arabian Sea vs Bay of Bengal",
        "Show temperature differences between Pacific and Atlantic",
        "Compare salinity profiles for summer vs winter",
      ],
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-chart-3" />,
      category: "Time Series",
      queries: [
        "Display temperature time series for the Pacific Ocean",
        "Show chlorophyll trends over the past year",
        "Generate salinity time series for the Mediterranean",
      ],
    },
    {
      icon: <Grid3X3 className="h-5 w-5 text-chart-4" />,
      category: "Heatmaps",
      queries: [
        "Create a heatmap of chlorophyll distribution",
        "Show temperature heatmap across depth and time",
        "Generate salinity distribution heatmap",
      ],
    },
    {
      icon: <Map className="h-5 w-5 text-chart-5" />,
      category: "Maps",
      queries: [
        "Map float locations in the Atlantic Ocean",
        "Show oceanographic buoy positions with trajectories",
        "Display float network in the Pacific region",
      ],
    },
  ]

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card/95 backdrop-blur-sm border-border/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-ocean-blue dark:text-aqua">
            How to Use Oceanic Data Explorer
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Getting Started</h3>
            </div>
            <p className="text-muted-foreground">
              Ask natural language questions about oceanographic data and get interactive visualizations. The AI will
              analyze your query and generate appropriate charts, maps, or data displays.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {exampleQueries.map((category, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <h4 className="font-semibold">{category.category}</h4>
                </div>
                <div className="space-y-2">
                  {category.queries.map((query, queryIndex) => (
                    <div
                      key={queryIndex}
                      className="p-3 rounded-lg bg-muted/50 border border-border/20 text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => {
                        // Copy to clipboard or trigger query
                        navigator.clipboard.writeText(query)
                      }}
                    >
                      &quot;{query}&quot;
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-border/20 pt-6">
            <h3 className="text-lg font-semibold">Features</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Interactive Visualizations</h4>
                <p className="text-sm text-muted-foreground">
                  Charts and maps are fully interactive with zoom, pan, and hover details.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Download visualization data as JSON or CSV files for further analysis.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Fullscreen Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Expand any visualization to fullscreen for detailed examination.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Real-time Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Queries are processed in real-time with live oceanographic data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

