import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const profileId = searchParams.get("profile_id")
    const platformNumber = searchParams.get("platform_number")
    const cycleNumber = searchParams.get("cycle_number")
    const latitude = searchParams.get("latitude")
    const longitude = searchParams.get("longitude")
    const date = searchParams.get("date")

    // Validate input - either profile_id OR (platform_number + cycle_number) OR (location + date)
    if (!profileId && !platformNumber && !latitude) {
      return NextResponse.json(
        { error: "Must provide either profile_id, platform_number+cycle_number, or latitude+longitude+date" },
        { status: 400 },
      )
    }

    let queryPayload: any = {}

    if (profileId) {
      queryPayload = { profile_id: profileId }
    } else if (platformNumber && cycleNumber) {
      queryPayload = {
        platform_number: platformNumber,
        cycle_number: Number.parseInt(cycleNumber),
      }
    } else if (latitude && longitude) {
      queryPayload = {
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        date: date || new Date().toISOString(),
      }
    }

    try {
      const backendResponse = await fetch("http://localhost:8000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryPayload),
        signal: AbortSignal.timeout(15000),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return NextResponse.json(data)
      } else {
        const errorData = await backendResponse.json().catch(() => ({}))
        return NextResponse.json(
          {
            error: "Backend error",
            message: errorData.message || `HTTP ${backendResponse.status}`,
            details: "Please check if the Python FastAPI service is running on localhost:8000",
          },
          { status: backendResponse.status },
        )
      }
    } catch (backendError) {
      console.error("Backend connection error:", backendError)

      const mockProfile = {
        profile_id: profileId || `${platformNumber}_${cycleNumber}` || "mock_profile_001",
        metadata: {
          platform_number: platformNumber || "1900121",
          cycle_number: cycleNumber ? Number.parseInt(cycleNumber) : 12,
          latitude: latitude ? Number.parseFloat(latitude) : -9.857,
          longitude: longitude ? Number.parseFloat(longitude) : 55.953,
          time: date || "2002-11-11T09:20:28Z",
        },
        measurements: Array.from({ length: 20 }, (_, i) => ({
          pressure_dbar: 5.5 + i * 50,
          temperature_c: 27.38 - i * 0.8 + (Math.random() * 0.5 - 0.25),
          salinity_psu: 35.37 - i * 0.02 + (Math.random() * 0.1 - 0.05),
        })),
      }

      return NextResponse.json({
        ...mockProfile,
        _note: "Mock data - backend unavailable. Please ensure Python FastAPI service is running on localhost:8000",
      })
    }
  } catch (error) {
    console.error("Error processing profile request:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process profile request. Please try again.",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    try {
      const backendResponse = await fetch("http://localhost:8000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return NextResponse.json(data)
      } else {
        const errorData = await backendResponse.json().catch(() => ({}))
        return NextResponse.json(
          {
            error: "Backend error",
            message: errorData.message || `HTTP ${backendResponse.status}`,
          },
          { status: backendResponse.status },
        )
      }
    } catch (backendError) {
      console.error("Backend connection error:", backendError)

      // Mock fallback
      const mockProfile = {
        profile_id: body.profile_id || `${body.platform_number}_${body.cycle_number}` || "mock_profile_001",
        metadata: {
          platform_number: body.platform_number || "1900121",
          cycle_number: body.cycle_number || 12,
          latitude: body.latitude || -9.857,
          longitude: body.longitude || 55.953,
          time: body.date || "2002-11-11T09:20:28Z",
        },
        measurements: Array.from({ length: 20 }, (_, i) => ({
          pressure_dbar: 5.5 + i * 50,
          temperature_c: 27.38 - i * 0.8 + (Math.random() * 0.5 - 0.25),
          salinity_psu: 35.37 - i * 0.02 + (Math.random() * 0.1 - 0.05),
        })),
      }

      return NextResponse.json({
        ...mockProfile,
        _note: "Mock data - backend unavailable",
      })
    }
  } catch (error) {
    console.error("Error processing profile POST request:", error)
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to process profile request" },
      { status: 500 },
    )
  }
}
