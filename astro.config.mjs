import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import { resolveSiteUrl } from "./config/site-url.mjs";

export default defineConfig({
  site: resolveSiteUrl(),
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
