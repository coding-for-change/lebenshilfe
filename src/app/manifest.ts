import type { MetadataRoute } from "next";

// Web App Manifest — drives the "Add to Home screen" / installed-PWA experience
// on Android (Chrome) and other browsers. iOS home-screen icons come from the
// `apple-icon.png` file convention + the `appleWebApp` metadata in layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lebenshilfe München",
    short_name: "Lebenshilfe",
    description: "Lebenshilfe München Portal",
    lang: "de",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Full-bleed icon with a safe zone so Android can apply its own
        // adaptive mask (circle, squircle, …) without clipping the logo.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
