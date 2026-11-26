# Reglas del repositorio viatela-portafolio

Este repositorio tiene tres partes:

- `sitio/`: la web estática del portafolio (portafolio.viatela.com). Es bilingüe: `sitio/index.html` (español) y `sitio/en/index.html` (inglés) comparten `estilos.css` y `app.js`. Todo cambio de contenido se hace en las dos versiones.
- `conocimiento/`: la base de conocimiento del agente «Pregúntale a Weimar». El agente responde **solo** con lo que está en estos archivos.
- `worker/`: el Cloudflare Worker que sirve al agente.

## Cómo actualizar la base de conocimiento

Cuando Weimar diga «actualiza esto en el repositorio» (o algo parecido) en cualquier sesión con acceso a este repositorio:

1. Decide a qué archivo de `conocimiento/` pertenece el dato:
   - `perfil.md`: quién es, a qué se dedica ahora, fortalezas, idiomas, ciudad.
   - `experiencia.md`: empleos y responsabilidades, con fechas MM/AAAA.
   - `formacion.md`: títulos, certificaciones y cursos.
   - `competencias.md`: herramientas y habilidades técnicas.
   - `proyectos.md`: proyectos propios y de clientes (libro, agentes, apps, realidad virtual, observatorio).
   - `raizeta.md`: la investigación Raizeta y RAIzeta.
   - `contacto.md`: cómo contactar y qué servicios ofrece.
   Si nada encaja, crea un archivo nuevo y añádelo a `conocimiento/indice.json`.
2. Edita el texto existente en vez de duplicarlo. Si algo cambió, sustituye el dato viejo.
3. Pon la fecha del cambio en la línea `Actualizado:` del archivo.
4. Haz commit con un mensaje en español que diga qué cambió, por ejemplo `conocimiento: añade charla en el consulado de Madrid`.

## Lo que nunca entra en `conocimiento/`

Este repositorio es público y el agente lo cuenta a cualquiera.

- Datos de clientes que no hayan autorizado aparecer (nombres, cifras, conversaciones).
- Familia, salud, dinero personal, direcciones o documentos de identidad.
- Precios o presupuestos de proyectos concretos.
- Cosas sin confirmar: planes que Weimar no ha decidido, logros que no ha dicho que ocurrieron.
- Claves, tokens o secretos de cualquier tipo.

Si dudas si algo es público, pregunta antes de subirlo.

## Estilo de los textos

Español neutro, frases cortas, tercera persona («Weimar dirige…»). Hechos concretos con fechas; nada de adjetivos de venta. Lo que está en diseño o piloto se describe como tal.
