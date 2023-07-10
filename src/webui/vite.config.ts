import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa";

const manifestForPlugin: Partial<VitePWAOptions> = {
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico"],
  workbox: {
    globPatterns: ["*.webp", "index.html", "assets/*", "*.js"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\/api\/items\/?\d*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-items",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 3600 * 24 * 31,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\/api\/categories/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-categories",
          expiration: {
            maxEntries: 1,
            maxAgeSeconds: 3600 * 24 * 31,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
  manifest: {
    name: "Ludo du Poisson-Lune",
    short_name: "Ludothèque",
    description: "Accèder à la ludothèque du Poisson-Lune d'Acigné",
    icons: [
      {
        src: "/pwaicon-96-96.webp",
        sizes: "96x96",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/pwaicon-192-192.webp",
        sizes: "192x192",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/pwaicon-512-512.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/pwaicon-512-512.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "maskable",
      },
    ],
    theme_color: "#FFFFFF",
    display: "standalone",
    orientation: "portrait",
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA(manifestForPlugin)],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
