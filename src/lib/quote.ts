import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_MAX_AGE_MS = 30 * 60 * 1000;
const TOKEN_MIN_AGE_MS = 1_500;

export type QuoteRequest = {
  name: string;
  profile: "collector" | "store" | "seller";
  itemTypes: string[];
  quantity: number;
  origin: string;
  destination: string;
  dimensions: string;
  declaredValue: string;
  desiredDate: string;
  notes: string;
};

type ValidationResult =
  | { success: true; data: QuoteRequest }
  | { success: false; errors: string[] };

const allowedProfiles = new Set(["collector", "store", "seller"]);
const allowedItemTypes = new Set(["cards", "slabs", "sealed", "miniatures", "other"]);

function normalizeLine(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeParagraph(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createFormToken(secret: string, issuedAt = Date.now(), nonce = randomBytes(12).toString("hex")) {
  const payload = Buffer.from(JSON.stringify({ issuedAt, nonce })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyFormToken(token: string, secret: string, now = Date.now()) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || payload.length > 256 || signature.length > 128) return false;

  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      issuedAt?: number;
      nonce?: string;
    };
    if (typeof data.issuedAt !== "number" || typeof data.nonce !== "string") return false;
    const age = now - data.issuedAt;
    return age >= TOKEN_MIN_AGE_MS && age <= TOKEN_MAX_AGE_MS;
  } catch {
    return false;
  }
}

export function getFormTokenSecret() {
  const secret = process.env.FORM_TOKEN_SECRET || import.meta.env.FORM_TOKEN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "move-collections-local-development-only-secret";
  throw new Error("FORM_TOKEN_SECRET is not configured.");
}

export function validateQuoteForm(formData: FormData): ValidationResult {
  const errors: string[] = [];
  const name = normalizeLine(formData.get("name"), 80);
  const profileValue = normalizeLine(formData.get("profile"), 20);
  const itemTypes = formData
    .getAll("itemTypes")
    .map((value) => normalizeLine(value, 20))
    .filter((value) => allowedItemTypes.has(value));
  const quantityValue = Number(normalizeLine(formData.get("quantity"), 4));
  const origin = normalizeLine(formData.get("origin"), 100);
  const destination = normalizeLine(formData.get("destination"), 100);
  const dimensions = normalizeLine(formData.get("dimensions"), 80);
  const declaredValue = normalizeLine(formData.get("declaredValue"), 40);
  const desiredDate = normalizeLine(formData.get("desiredDate"), 10);
  const notes = normalizeParagraph(formData.get("notes"), 600);
  const consent = formData.get("consent") === "on";

  if (name.length < 2) errors.push("Informe seu nome.");
  if (!allowedProfiles.has(profileValue)) errors.push("Selecione seu perfil.");
  if (itemTypes.length === 0) errors.push("Selecione ao menos um tipo de item.");
  if (!Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 500) {
    errors.push("Informe uma quantidade entre 1 e 500.");
  }
  if (origin.length < 3) errors.push("Informe o bairro ou endereço de origem.");
  if (destination.length < 3) errors.push("Informe o bairro ou endereço de destino.");
  if (dimensions.length < 2) errors.push("Informe as dimensões aproximadas.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desiredDate)) errors.push("Escolha uma data desejada.");
  if (!consent) errors.push("Confirme o consentimento para atendimento.");

  if (errors.length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      name,
      profile: profileValue as QuoteRequest["profile"],
      itemTypes,
      quantity: quantityValue,
      origin,
      destination,
      dimensions,
      declaredValue,
      desiredDate,
      notes,
    },
  };
}

const profileLabels: Record<QuoteRequest["profile"], string> = {
  collector: "Colecionador(a)",
  store: "Loja",
  seller: "Vendedor(a)",
};

const itemLabels: Record<string, string> = {
  cards: "Cards avulsos e decks",
  slabs: "Slabs e cases rígidos",
  sealed: "Produtos selados",
  miniatures: "Miniaturas e figuras",
  other: "Outro colecionável",
};

export function buildWhatsappUrl(quote: QuoteRequest, rawNumber: string) {
  const number = rawNumber.replace(/\D/g, "");
  if (!/^55\d{10,11}$/.test(number)) throw new Error("WHATSAPP_NUMBER is invalid.");

  const lines = [
    "Olá, Move Collections. Gostaria de solicitar uma avaliação.",
    "",
    `Nome: ${quote.name}`,
    `Perfil: ${profileLabels[quote.profile]}`,
    `Itens: ${quote.itemTypes.map((type) => itemLabels[type] ?? type).join(", ")}`,
    `Quantidade aproximada: ${quote.quantity}`,
    `Origem: ${quote.origin}`,
    `Destino: ${quote.destination}`,
    `Dimensões: ${quote.dimensions}`,
    quote.declaredValue
      ? `Valor declarado: ${quote.declaredValue} (informativo; não representa seguro)`
      : "Valor declarado: não informado",
    `Data desejada: ${quote.desiredDate}`,
    quote.notes ? `Observações: ${quote.notes}` : "Observações: nenhuma",
    "",
    "Entendo que o serviço não inclui seguro e depende de avaliação de item e rota.",
  ];

  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function requestOriginIsAllowed(request: Request, configuredOrigins = process.env.ALLOWED_ORIGINS) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidates = new Set(
    [requestOrigin, ...(configuredOrigins ?? "").split(",")]
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  );

  if (origin) return candidates.has(new URL(origin).origin);
  if (referer) return candidates.has(new URL(referer).origin);
  return false;
}
