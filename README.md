# viatela-portafolio

Portafolio de Weimar Viatela Aponte: trabajo verificable en datos, visualización, storytelling, inteligencia artificial e investigación.

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `sitio/` | La web estática del portafolio. Se publica con GitHub Pages. |
| `conocimiento/` | Base de conocimiento pública del agente «Pregúntale a Weimar». |
| `worker/` | Cloudflare Worker del agente: lee `conocimiento/`, responde con Claude y cita el archivo de cada dato. |

## Publicar la web

GitHub Pages despliega `sitio/` con el flujo `.github/workflows/pages.yml` en cada cambio en `main`.
En el repositorio: **Settings → Pages → Source: GitHub Actions**.

Para usar `portafolio.viatela.com`: añade en el DNS de viatela.com un registro `CNAME portafolio → myskakubun.github.io` y escribe el dominio en **Settings → Pages → Custom domain**.

## Publicar el agente

```bash
cd worker
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY   # la clave nunca va en el código
npx wrangler deploy
```

Copia la URL que devuelve `wrangler deploy` en la constante `AGENT_URL` de `sitio/index.html`.

## Actualizar lo que sabe el agente

Edita los archivos de `conocimiento/` y haz commit. El agente lee los cambios en unos cinco minutos, sin volver a desplegar. Las reglas sobre qué puede entrar están en `CLAUDE.md`.
