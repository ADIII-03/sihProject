import type { NextConfig } from "next";
import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // optional: ignore TS errors in build
  },

  webpack: (config) => {
    config.plugins?.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            // Copy Cesium static assets to /public/cesium
            from: path.join(
              path.dirname(require.resolve("cesium/package.json")),
              "Build/Cesium"
            ),
            to: "cesium", // served at /cesium/*
          },
        ],
      })
    );

    return config;
  },
};

export default nextConfig;
