import { describe, expect, it } from "vitest";
import { normalizeSiteUrl, resolveSiteUrl } from "./site-url.mjs";

describe("site URL configuration", () => {
  it.each([
    ["https://move.example", "https://move.example"],
    ["move.example", "https://move.example"],
    [" SITE_URL=https://move.example/path ", "https://move.example"],
    ['"https://move.example"', "https://move.example"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeSiteUrl(input)).toBe(expected);
  });

  it("falls back to Vercel's generated domain when SITE_URL is invalid", () => {
    expect(
      resolveSiteUrl({
        SITE_URL: "https://",
        VERCEL_PROJECT_PRODUCTION_URL: "move-collections.vercel.app",
      }),
    ).toBe("https://move-collections.vercel.app");
  });

  it("uses localhost only when no deploy URL is available", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:4321");
  });
});
