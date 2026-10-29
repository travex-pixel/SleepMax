import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OFFMODE",
    short_name: "OFFMODE",
    description: "A quiet place to put the day down.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121523",
    theme_color: "#121523",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
