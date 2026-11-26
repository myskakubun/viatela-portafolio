// Dirección del Worker del agente. Vacía hasta que se publique.
const AGENT_URL = "";

const EN = document.documentElement.lang === "en";
const T = EN ? {
  noConectado: "The agent is not connected yet. Meanwhile you can read its knowledge base on GitHub or write to weimar@viatela.com.",
  consultando: "Looking it up…",
  fallo: "The agent could not answer. Please try again.",
  sinRed: "There is no connection with the agent. Check your connection and try again.",
  fuente: "Source: "
} : {
  noConectado: "El agente todavía no está conectado. Mientras tanto puedes leer la base de conocimiento en GitHub o escribir a weimar@viatela.com.",
  consultando: "Consultando…",
  fallo: "El agente no pudo responder. Vuelve a intentarlo.",
  sinRed: "No hay conexión con el agente. Revisa tu conexión y vuelve a intentarlo.",
  fuente: "Fuente: "
};

// ---------- La piedra y la lupa ----------
(function(){
  const microtexto = [
    "Weimar Viatela Aponte","Bogotá 1999 Ingeniería Industrial","Londres","Madrid 2016 Máster UPM",
    "Programa Universitario en IA 2026","Power BI","DAX","Lenguaje M","Azure Databricks","SQL",
    "SAP S/4HANA","Databricks Genie","Claude","n8n","Cloudflare Workers","Flourish",
    "La historia en datos, datos en la historia","Myska Kubun","Raizeta","RAIzeta",
    "no consta","Alpargatas","JTI","Philip Morris International","Liri Colombia","Bilbao 2026",
    "Observatorio de la diáspora","memoria de diez generaciones"
  ];
  let texto = "";
  while (texto.length < 24000) texto += microtexto.join("   ") + "   ";
  const micro = document.getElementById("micro");
  micro.textContent = texto;

  const piedra = document.getElementById("piedra");
  const lente = document.getElementById("lente");
  const zoom = document.getElementById("zoom");
  const Z = 3.2;
  const copia = micro.cloneNode(true);
  copia.removeAttribute("id");
  zoom.appendChild(copia);

  function ajustar(){
    const r = piedra.getBoundingClientRect();
    zoom.style.width = r.width + "px";
    zoom.style.height = r.height + "px";
  }
  function mover(x, y){
    const L = lente.offsetWidth;
    lente.style.left = x + "px";
    lente.style.top = y + "px";
    zoom.style.transform = `translate(${-x*Z + L/2}px, ${-y*Z + L/2}px) scale(${Z})`;
  }
  function centro(){ const r = piedra.getBoundingClientRect(); return [r.width*0.5, r.height*0.76]; }

  ajustar();
  mover(...centro());
  window.addEventListener("resize", () => { ajustar(); mover(...centro()); });

  function desdeEvento(e){
    const r = piedra.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    mover(Math.max(0, Math.min(r.width, p.clientX - r.left)), Math.max(0, Math.min(r.height, p.clientY - r.top)));
  }
  piedra.addEventListener("pointermove", desdeEvento);
  piedra.addEventListener("touchmove", (e) => { desdeEvento(e); e.preventDefault(); }, { passive:false });

  // Un único recorrido de la lupa al cargar, si el usuario no pidió menos movimiento.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const r = piedra.getBoundingClientRect();
    const t0 = performance.now(), dur = 2200;
    let tocado = false;
    piedra.addEventListener("pointerenter", () => tocado = true, { once:true });
    (function paso(t){
      if (tocado) return;
      const k = Math.min(1, (t - t0) / dur);
      const e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2;
      mover(r.width*(0.22 + 0.28*e), r.height*(0.40 + 0.36*e));
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }
})();

// ---------- Chat del agente ----------
(function(){
  const chat = document.getElementById("chat");
  const form = document.getElementById("formulario");
  const input = document.getElementById("pregunta");
  const enviar = document.getElementById("enviar");
  const historial = [];

  function burbuja(clase, texto){
    const d = document.createElement("div");
    d.className = "msg " + clase;
    const m = texto.match(/\n?(?:Fuentes?|Sources?):\s*(.+)\s*$/i);
    if (clase === "msg-agente" && m) {
      d.textContent = texto.slice(0, m.index).trim();
      const f = document.createElement("span");
      f.className = "fuente";
      f.textContent = T.fuente + m[1];
      d.appendChild(f);
    } else {
      d.textContent = texto;
    }
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return d;
  }

  async function preguntar(q){
    q = q.trim();
    if (!q) return;
    burbuja("msg-yo", q);
    input.value = "";
    if (!AGENT_URL) {
      burbuja("msg-aviso", T.noConectado);
      return;
    }
    enviar.disabled = true;
    const espera = burbuja("msg-agente", T.consultando);
    try {
      const r = await fetch(AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: q, historial, idioma: EN ? "en" : "es" })
      });
      const datos = await r.json();
      espera.remove();
      if (!r.ok) { burbuja("msg-aviso", datos.error || T.fallo); return; }
      burbuja("msg-agente", datos.respuesta);
      historial.push({ rol: "user", texto: q }, { rol: "assistant", texto: datos.respuesta });
    } catch {
      espera.remove();
      burbuja("msg-aviso", T.sinRed);
    } finally {
      enviar.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); preguntar(input.value); });
  document.querySelectorAll("#sugerencias button").forEach((b) =>
    b.addEventListener("click", () => preguntar(b.textContent))
  );
})();
