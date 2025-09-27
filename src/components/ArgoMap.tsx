"use client";

import { useEffect, useRef, useState } from "react";
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

export default function ArgoMap({ width = "100%", height = "100vh" }: ArgoMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);

  // Fetch latest floats
  useEffect(() => {
    const fetchFloats = async () => {
      try {
        const res = await fetch("/api/floats");
        const data = await res.json();
        const cleanData = (data.floats ?? []).map((f: any) => ({
          platform_number: f.platform_number,
          latitude: Number(f.latitude),
          longitude: Number(f.longitude),
        }));
        setFloats(cleanData);
      } catch (err) {
        console.error("Failed to fetch floats:", err);
      }
    };
    fetchFloats();
  }, []);

  // Initialize Cesium
  useEffect(() => {
    if (!mapRef.current || floats.length === 0) return;

    (window as any).CESIUM_BASE_URL = "/cesium";
    Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? "";

    const viewer = new Cesium.Viewer(mapRef.current, {
      baseLayerPicker: false,
      geocoder: false,
      sceneModePicker: false,
      fullscreenButton: false,
      navigationHelpButton: false,
      timeline: false,
      animation: false,
      infoBox: true, // Enable infoBox
    });

    const dataSource = new Cesium.CustomDataSource("floats");

    floats.forEach((float) => {
      dataSource.entities.add({
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
          text: String(float.platform_number),
          font: "14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
        },
        description: `Platform Number: ${float.platform_number}`, // InfoBox content
      });
    });

    viewer.dataSources.add(dataSource);

    // Click handler to show infoBox
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position);
      if (picked && picked.id) {
        viewer.selectedEntity = picked.id; // Automatically shows description in infoBox
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Center camera
    if (floats.length > 0) {
      const f = floats[0];
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(f.longitude, f.latitude, 800_000),
      });
    }

    return () => viewer.destroy();
  }, [floats]);

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
