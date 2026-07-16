import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:4321",
  output: "server",
  adapter: vercel(),
  compressHTML: true,
  image: {
    responsiveStyles: true,
  },
  vite: {
    build: {
      cssMinify: "lightningcss",
    },
  },
});
