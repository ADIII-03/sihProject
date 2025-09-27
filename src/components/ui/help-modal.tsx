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
      category: "Natural Language Queries",
      queries: [
        "Show salinity profile for float 1001 from Jan 2023 to Mar 2023",
        "Display temperature vs pressure for platform 1002",
        "Compare oxygen variation of two floats in Arabian Sea",
      ],
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-chart-2" />,
      category: "View Profile",
      queries: [
        "Select a platform number to view salinity & temperature variation vs pressure",
        "Filter by cycle number and date range for detailed profiling",
        "Explore float profiles even without platform number by selecting nearest location",
      ],
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-chart-3" />,
      category: "Comparison",
      queries: [
        "Compare salinity vs pressure between two platform numbers",
        "Compare temperature variation using Plotly charts",
        "Compare profiles for nearby floats if platform number not available",
      ],
    },
    {
      icon: <Map className="h-5 w-5 text-chart-4" />,
      category: "Map Interaction",
      queries: [
        "Click on map to select a location and see nearest float data",
        "Inspect latest float positions and their measurements",
        "All floats’ last known locations are visible with platform numbers",
      ],
    },
    {
      icon: <Grid3X3 className="h-5 w-5 text-chart-5" />,
      category: "3D Float Map",
      queries: [
        "Visualize the last location of each float in 3D using Cesium",
        "Click on a float to see its platform number and basic info",
        "Pan, zoom, and rotate the globe to explore float locations interactively",
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
              Ask natural language questions about oceanographic floats. You can explore float profiles, compare
              data, select locations on maps, view latest float positions, and interact with 3D maps. The AI will
              generate interactive charts, maps, and visualizations in response to your query.
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
                      onClick={() => navigator.clipboard.writeText(query)}
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
                  Plotly charts and maps are fully interactive with zoom, pan, and hover details.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Download float profile or comparison data as CSV or JSON for further analysis.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Map & 3D Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Use Mapbox to pick locations and see nearest floats. Explore the 3D Cesium map for the latest
                  float positions and platform numbers.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Comparison Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Compare multiple floats side-by-side or explore variations even without platform numbers.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
