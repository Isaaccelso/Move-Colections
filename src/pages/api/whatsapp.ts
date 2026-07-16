import type { APIRoute } from "astro";
import {
  buildWhatsappUrl,
  getFormTokenSecret,
  requestOriginIsAllowed,
  validateQuoteForm,
  verifyFormToken,
} from "@/lib/quote";

export const prerender = false;

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export const POST: APIRoute = async ({ request, redirect }) => {
  if (!requestOriginIsAllowed(request)) {
    return textResponse("Não foi possível validar a origem da solicitação.", 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data")) {
    return textResponse("Formato de solicitação não aceito.", 415);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return textResponse("Não foi possível ler os dados enviados.", 400);
  }

  if (String(formData.get("company_website") ?? "").trim()) {
    return textResponse("Não foi possível processar a solicitação.", 400);
  }

  const token = String(formData.get("formToken") ?? "");
  if (!verifyFormToken(token, getFormTokenSecret())) {
    return textResponse("A sessão do formulário expirou. Atualize a página e tente novamente.", 400);
  }

  const result = validateQuoteForm(formData);
  if (!result.success) return textResponse(result.errors.join("\n"), 400);

  const whatsappNumber = process.env.WHATSAPP_NUMBER || import.meta.env.WHATSAPP_NUMBER;
  if (!whatsappNumber) {
    console.error("WHATSAPP_NUMBER is not configured.");
    return textResponse("O atendimento está temporariamente indisponível. Tente novamente em alguns minutos.", 503);
  }

  try {
    return redirect(buildWhatsappUrl(result.data, whatsappNumber), 303);
  } catch (error) {
    console.error("Unable to build WhatsApp redirect.", error);
    return textResponse("O atendimento está temporariamente indisponível. Tente novamente em alguns minutos.", 503);
  }
};
