import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { POST } from "@/pages/api/whatsapp";
import {
  buildWhatsappUrl,
  createFormToken,
  requestOriginIsAllowed,
  validateQuoteForm,
  verifyFormToken,
} from "./quote";

const secret = "test-secret-with-enough-entropy-for-hmac";
const phoneFixture = "5511999999999";

function validForm(token = createFormToken(secret, Date.now() - 2_000)) {
  const data = new FormData();
  data.set("formToken", token);
  data.set("company_website", "");
  data.set("name", "Ana Colecionadora");
  data.set("profile", "collector");
  data.append("itemTypes", "cards");
  data.append("itemTypes", "slabs");
  data.set("quantity", "12");
  data.set("origin", "Pinheiros, São Paulo");
  data.set("destination", "Moema, São Paulo");
  data.set("dimensions", "35 × 25 × 15 cm");
  data.set("declaredValue", "R$ 3.500");
  data.set("desiredDate", "2026-08-01");
  data.set("notes", "Um slab precisa ficar separado.");
  data.set("consent", "on");
  return data;
}

describe("signed form token", () => {
  it("accepts a signed token inside the allowed window", () => {
    const now = 2_000_000;
    const token = createFormToken(secret, now - 2_000, "fixed-nonce");
    expect(verifyFormToken(token, secret, now)).toBe(true);
  });

  it("rejects tokens that are too new, expired or tampered", () => {
    const now = 2_000_000;
    expect(verifyFormToken(createFormToken(secret, now - 500), secret, now)).toBe(false);
    expect(verifyFormToken(createFormToken(secret, now - 31 * 60 * 1_000), secret, now)).toBe(false);
    expect(verifyFormToken(`${createFormToken(secret, now - 2_000)}x`, secret, now)).toBe(false);
  });
});

describe("quote validation", () => {
  it("normalizes a valid request", () => {
    const result = validateQuoteForm(validForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.itemTypes).toEqual(["cards", "slabs"]);
      expect(result.data.quantity).toBe(12);
    }
  });

  it("rejects missing required fields and unknown values", () => {
    const data = new FormData();
    data.set("profile", "bot");
    data.append("itemTypes", "unknown");
    const result = validateQuoteForm(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.length).toBeGreaterThan(5);
  });
});

describe("WhatsApp redirect", () => {
  it("builds an encoded message with the insurance limitation", () => {
    const result = validateQuoteForm(validForm());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const url = new URL(buildWhatsappUrl(result.data, phoneFixture));
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe(`/${phoneFixture}`);
    expect(url.searchParams.get("text")).toContain("não representa seguro");
    expect(url.searchParams.get("text")).toContain("Ana Colecionadora");
  });

  it("requires the origin to match the current host", () => {
    const sameOrigin = new Request("https://move.example/api/whatsapp", {
      headers: { origin: "https://move.example" },
    });
    const foreignOrigin = new Request("https://move.example/api/whatsapp", {
      headers: { origin: "https://spam.example" },
    });
    expect(requestOriginIsAllowed(sameOrigin)).toBe(true);
    expect(requestOriginIsAllowed(foreignOrigin)).toBe(false);
  });

  it("returns a 303 only for a valid server-side submission", async () => {
    process.env.FORM_TOKEN_SECRET = secret;
    process.env.WHATSAPP_NUMBER = phoneFixture;
    const body = new URLSearchParams();
    for (const [key, value] of validForm()) body.append(key, String(value));
    const request = new Request("https://move.example/api/whatsapp", {
      method: "POST",
      headers: { origin: "https://move.example" },
      body,
    });
    const response = await (POST as Function)({
      request,
      redirect: (location: string, status: number) => new Response(null, { status, headers: { location } }),
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("https://wa.me/");
  });

  it("rejects a filled honeypot", async () => {
    process.env.FORM_TOKEN_SECRET = secret;
    process.env.WHATSAPP_NUMBER = phoneFixture;
    const data = validForm();
    data.set("company_website", "https://spam.example");
    const body = new URLSearchParams();
    for (const [key, value] of data) body.append(key, String(value));
    const request = new Request("https://move.example/api/whatsapp", {
      method: "POST",
      headers: { origin: "https://move.example" },
      body,
    });
    const response = await (POST as Function)({ request, redirect: vi.fn() });
    expect(response.status).toBe(400);
  });
});

describe("public source privacy", () => {
  it("does not expose the contact variable or a phone literal in public-facing source", () => {
    const publicFiles = [
      "src/pages/index.astro",
      "src/components/QuoteForm.astro",
      "src/scripts/site.ts",
      "src/styles/global.css",
    ];
    const publicSource = publicFiles.map((file) => readFileSync(resolve(file), "utf8")).join("\n");
    expect(publicSource).not.toMatch(/PUBLIC_WHATSAPP/i);
    expect(publicSource).not.toMatch(/55\d{10,11}/);
  });
});
