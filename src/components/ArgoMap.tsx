"use client";

import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

interface Float {
  platform_number: string;
  latitude: number;
  longitude: number;
}

interface ArgoMapProps {
  width?: string | number;
  height?: string | number;
}

export default function ArgoMap({
  width = "100%",
  height = "600px",
}: ArgoMapProps): JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);

  // Dummy float data: some over India, some in Indian Ocean
  const floats: Float[] = [
    { platform_number: "1001", latitude: 28.6, longitude: 77.2 }, // Delhi
    { platform_number: "1002", latitude: 19.0, longitude: 72.8 }, // Mumbai
    { platform_number: "1003", latitude: 13.0, longitude: 80.2 }, // Chennai
    { platform_number: "1004", latitude: 10.0, longitude: 70.0 }, // Indian Ocean
    { platform_number: "1005", latitude: -5.0, longitude: 73.0 }, // Indian Ocean south
  ];

  useEffect(() => {
    if (!mapRef.current) return;

    (window as any).CESIUM_BASE_URL = "/cesium";
    Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? "";

    Cesium.createWorldTerrainAsync()
      .then((terrainProvider) => {
        const viewer = new Cesium.Viewer(mapRef.current!, {
          terrainProvider,
          baseLayerPicker: true,
          timeline: false,
          animation: false,
          infoBox: true,
          sceneModePicker: true,
          navigationHelpButton: true,
          fullscreenButton: true,
          geocoder: true, // allow searching locations
        });

        const entityArray: Cesium.Entity[] = [];

        // Add floats
        floats.forEach((float) => {
          const entity = viewer.entities.add({
            id: float.platform_number,
            name: `Float ${float.platform_number}`,
            position: Cesium.Cartesian3.fromDegrees(float.longitude, float.latitude),
            point: {
              pixelSize: 12,
              color: Cesium.Color.ORANGE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
            },
            label: {
              text: float.platform_number,
              font: "14px sans-serif",
              fillColor: Cesium.Color.WHITE,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -14),
            },
            description: `Float ${float.platform_number}`,
          });
          entityArray.push(entity);
        });

        // Center over India: approx lat 20°N, lon 78°E, zoom distance ~ 1.5 million meters
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(78.0, 20.0, 1_500_000),
        });

        return () => {
          viewer.destroy();
        };
      })
      .catch((err) => console.error("Cesium terrain failed:", err));
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width,
        height,
        border: "2px solid #1976d2", // nicer colored border
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      }}
    />
  );
}
