import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      // Incluye el favicon y robots/sitemap en el precache
      includeAssets: ["favicon.png", "robots.txt"],
      manifest: {
        name: "MK5 Llantas",
        short_name: "MK5",
        description:
          "Tienda online de llantas - Bridgestone, Michelin, Pirelli y más. Envío a toda la República Mexicana.",
        theme_color: "#eb6b30",
        background_color: "#111111",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "es-MX",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        // Precachea todos los JS/CSS/HTML del bundle
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2,ico}"],
        // Aumentar el límite para nuestro bundle (logos de marcas pesan)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB

        runtimeCaching: [
          // Imágenes del CDN (R2) - cache agresivo, dura 30 días
          {
            urlPattern: /^https:\/\/cdn\.mk5\.com\.mx\/.*\.(png|jpg|jpeg|webp|gif|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mk5-cdn-images",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Imágenes en general (mercadolibre, amazon, etc del scraper)
          {
            urlPattern: /\.(png|jpg|jpeg|webp|gif|svg)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "mk5-external-images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
              },
            },
          },
          // API del backend - SIEMPRE intenta red primero (datos frescos)
          {
            urlPattern: /^https:\/\/api\.mk5\.com\.mx\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "mk5-api",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 min (solo para offline fallback)
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fuentes (Google Fonts, etc)
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "mk5-fonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // No activar SW en dev (mejor solo en build)
      },
    }),
  ],
  build: {
    // Code-splitting manual: separar vendor chunks de React (mejora cache entre deploys)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-router") ||
              id.includes("react-dom") ||
              id.includes("react/")
            ) {
              return "react-vendor";
            }
            if (id.includes("lottie")) {
              return "lottie";
            }
          }
        },
      },
    },
  },
});
