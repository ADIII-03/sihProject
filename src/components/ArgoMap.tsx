"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
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
  height = "100vh",
}: ArgoMapProps): JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);

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

    const initCesium = async () => {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);

      const terrainProvider = isMobile
        ? new Cesium.EllipsoidTerrainProvider() // light terrain for mobile
        : await Cesium.createWorldTerrainAsync(); // high-res for desktop

      const viewer = new Cesium.Viewer(mapRef.current!, {
        terrainProvider,
        baseLayerPicker: false,
        geocoder: false,
        sceneModePicker: false,
        fullscreenButton: false,
        navigationHelpButton: false,
        timeline: false,
        animation: false,
        infoBox: true,
      });

      // Use a CustomDataSource for efficient entity rendering
      const dataSource = new Cesium.CustomDataSource("floats");
      floats.forEach((float) => {
        dataSource.entities.add({
          id: float.platform_number,
          name: `Float ${float.platform_number}`,
          position: Cesium.Cartesian3.fromDegrees(float.longitude, float.latitude),
          point: {
            pixelSize: isMobile ? 8 : 12,
            color: Cesium.Color.ORANGE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
          },
          label: {
            text: float.platform_number,
            font: isMobile ? "10px sans-serif" : "14px sans-serif",
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -14),
          },
          description: `Float ${float.platform_number}`,
        });
      });
      viewer.dataSources.add(dataSource);

      // Center camera over India
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(78.0, 20.0, isMobile ? 800_000 : 500_000),
      });

      return () => {
        viewer.destroy();
      };
    };

    initCesium().catch((err) => console.error("Cesium init failed:", err));
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width,
        height,
        border: "2px solid #1976d2",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      }}
    />
  );
}
