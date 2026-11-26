// Agente «Pregúntale a Weimar».
// Responde solo con la base de conocimiento de conocimiento/ en GitHub y cita el archivo.

const RAW_BASE = "https://raw.githubusercontent.com/myskakubun/viatela-portafolio/main/conocimiento/";
const CACHE_SECONDS = 300; // los cambios del repositorio aparecen en unos 5 minutos
const MAX_PREGUNTA = 500;
const MAX_HISTORIAL = 6;

const REGLAS = `Eres «Pregúntale a Weimar», el agente del portafolio de Weimar Viatela Aponte.

Reglas:
1. Responde solo con lo que aparece en la BASE DE CONOCIMIENTO de abajo. No uses lo que sepas por otro lado.
2. Al final de cada respuesta añade una línea «Fuente: archivo.md» con los archivos que usaste.
3. Si la base no contiene la respuesta, di que eso no consta en lo que Weimar ha publicado y sugiere escribirle a weimar@viatela.com.
4. No inventes fechas, cifras, clientes ni logros. Lo que está en diseño o piloto, dilo así.
5. Habla de Weimar en tercera persona. Responde en el idioma de la pregunta, en dos o tres párrafos cortos como máximo.
6. Si te piden algo que no tiene que ver con Weimar y su trabajo, di amablemente que solo respondes sobre eso.`;

function cors(origin, env) {
  const permitidos = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = permitidos.length === 0 || permitidos.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : permitidos[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

async function cargarConocimiento(ctx) {
  const cache = caches.default;
  const clave = new Request(RAW_BASE + "__base_completa__");
  const guardada = await cache.match(clave);
  if (guardada) return guardada.text();

  const indice = await fetch(RAW_BASE + "indice.json").then((r) => {
    if (!r.ok) throw new Error("No se pudo leer indice.json");
    return r.json();
  });
  const partes = await Promise.all(
    indice.archivos.map(async (nombre) => {
      const r = await fetch(RAW_BASE + nombre);
      if (!r.ok) return "";
      return `<archivo nombre="${nombre}">\n${await r.text()}\n</archivo>`;
    })
  );
  const base = partes.filter(Boolean).join("\n\n");
  ctx.waitUntil(
    cache.put(clave, new Response(base, { headers: { "Cache-Control": `max-age=${CACHE_SECONDS}` } }))
  );
  return base;
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const h = cors(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { headers: h });
    if (request.method !== "POST") return json({ error: "Usa POST." }, 405, h);

    // Límite de preguntas por visitante (binding de rate limiting de Cloudflare).
    if (env.LIMITE) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const { success } = await env.LIMITE.limit({ key: ip });
      if (!success) {
        return json({ error: "Has hecho muchas preguntas seguidas. Espera un minuto y vuelve a intentarlo." }, 429, h);
      }
    }

    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return json({ error: "La petición no es JSON válido." }, 400, h);
    }
    const pregunta = String(cuerpo.pregunta || "").trim().slice(0, MAX_PREGUNTA);
    if (!pregunta) return json({ error: "Escribe una pregunta." }, 400, h);

    const historial = Array.isArray(cuerpo.historial) ? cuerpo.historial.slice(-MAX_HISTORIAL) : [];
    const mensajes = historial
      .filter((m) => (m.rol === "user" || m.rol === "assistant") && typeof m.texto === "string")
      .map((m) => ({ role: m.rol, content: m.texto.slice(0, 2000) }));
    mensajes.push({ role: "user", content: pregunta });
    while (mensajes.length && mensajes[0].role !== "user") mensajes.shift();

    let base;
    try {
      base = await cargarConocimiento(ctx);
    } catch {
      return json({ error: "No pude leer la base de conocimiento. Inténtalo en unos minutos." }, 502, h);
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.MODEL || "claude-haiku-5-5",
        max_tokens: 600,
        system: [
          { type: "text", text: REGLAS },
          // La base es igual en todas las preguntas: se cachea para bajar el coste.
          { type: "text", text: `BASE DE CONOCIMIENTO\n\n${base}`, cache_control: { type: "ephemeral" } },
        ],
        messages: mensajes,
      }),
    });

    if (!r.ok) {
      return json({ error: "El agente no pudo responder ahora. Inténtalo de nuevo en un momento." }, 502, h);
    }
    const datos = await r.json();
    const texto = (datos.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return json({ respuesta: texto }, 200, h);
  },
};
