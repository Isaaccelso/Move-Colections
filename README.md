# Move Collections

Landing page da Move Collections, serviço concierge de transporte para cartas TCG e colecionáveis de pequeno e médio porte em São Paulo capital e arredores.

## Desenvolvimento

```bash
npm install
cp .env.example .env
npm run dev
```

Configure `WHATSAPP_NUMBER` sem espaços ou pontuação e gere um `FORM_TOKEN_SECRET` longo e aleatório. Ambos são privados: não use o prefixo `PUBLIC_`.

## Comandos

- `npm run dev` — servidor local.
- `npm run check` — verificação Astro/TypeScript.
- `npm test` — testes do endpoint e da proteção do formulário.
- `npm run build` — build server-side para Vercel.

## Publicação na Vercel

1. Importe o repositório na Vercel.
2. Cadastre `WHATSAPP_NUMBER`, `FORM_TOKEN_SECRET`, `SITE_URL` e `ALLOWED_ORIGINS` nas variáveis de ambiente.
3. Use `npm run build` como comando de build.

O telefone nunca é incluído no HTML ou no JavaScript público. A função server-side só o usa depois que uma solicitação válida é enviada.
# Move-Colections
