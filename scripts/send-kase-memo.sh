#!/bin/bash
# One-shot script: send Grupo Kase response via Telegram
# Run: bash scripts/send-kase-memo.sh

set -euo pipefail

# Load env
ENV_FILE="$(dirname "$0")/../.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env.local not found"
  exit 1
fi

TOKEN=$(grep TELEGRAM_BOT_TOKEN "$ENV_FILE" | head -1 | cut -d= -f2 | tr -d ' "'"'"'')
CHAT_ID=$(grep TELEGRAM_CHAT_ID "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d ' "'"'"'')

if [ -z "$TOKEN" ] || [ -z "$CHAT_ID" ]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not found in .env.local"
  exit 1
fi

API="https://api.telegram.org/bot${TOKEN}/sendMessage"

# Telegram has a 4096 char limit per message, so we split into parts

send_msg() {
  local text="$1"
  local response
  response=$(curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg chat "$CHAT_ID" --arg text "$text" '{
      chat_id: $chat,
      text: $text,
      parse_mode: "Markdown",
      disable_web_page_preview: true
    }')")

  local ok
  ok=$(echo "$response" | jq -r '.ok')
  if [ "$ok" != "true" ]; then
    echo "FAILED: $(echo "$response" | jq -r '.description')"
    return 1
  fi
  echo "Sent OK"
  sleep 1
}

echo "Sending to Telegram chat: $CHAT_ID"
echo "---"

# Part 1: Header + Entregables 1-2
send_msg "📋 *RE: Memorando Técnico UX/UI — Simmer Down*
_Análisis de Factibilidad + Entregables Requeridos_

Equipo Grupo Kase,

Recibido y analizado el memorando técnico. Coincidimos con la visión de evolucionar la plataforma de catálogo estático a herramienta de posicionamiento turístico y funnel de conversión.

Hicimos una auditoría completa del estado actual de la plataforma contra cada punto del memorando. La buena noticia: varias piezas clave ya están construidas (checkout estructurado por WhatsApp con datos pre-llenados por sucursal, programa de lealtad SimmerLovers completo con tiers y canje de recompensas). Lo que falta es ejecutable en su totalidad.

Sin embargo, para arrancar desarrollo necesitamos *entregables de su lado* que no podemos generar nosotros. Sin estos materiales, la implementación queda bloqueada.

━━━━━━━━━━━━━━━━━━
*ENTREGABLES REQUERIDOS DE GRUPO KASE*
━━━━━━━━━━━━━━━━━━

*1. 📸 Sesión Fotográfica Profesional (BLOQUEADOR CRÍTICO)*

Las fotografías actuales del menú no cumplen el estándar que ustedes mismos definen en el memo. Necesitamos:

• Fotografía profesional de *cada plato del menú* — pizzas artesanales, pastas, especialidades de mar (Aguachile, Leche de Tigra específicamente), entradas, postres
• Resolución mínima 4K (3840×2160px), formato RAW o TIFF para nosotros procesarlos en WebP optimizado
• Iluminación natural, texturas visibles, fidelidad al plato real servido
• *Incluir tomas de cervezas artesanales/importadas y cócteles* para el módulo de cross-selling

⚠️ Sin esta sesión fotográfica, los puntos 1 y 4 del memorando no pueden ejecutarse."

# Part 2: Entregables 2-5
send_msg "*2. 🎬 Producción de Video (BLOQUEADOR PARA HERO)*

Para el Hero Section inmersivo necesitamos material de video:

• Tomas de la preparación artesanal en horno (masa, ingredientes, horno de leña, pizza saliendo)
• Tomas de ambiente de cada sucursal clave:
  → Surf City: atardecer, terraza, vista al mar
  → Lago de Coatepeque: muelle, vista al lago, terraza
  → Simmer Garden: jardín, ambiente nocturno
  → Santa Ana: fachada, interior, barra
• Duración total: mínimo 2-3 min de footage bruto (nosotros editamos el loop)
• Resolución 4K, horizontal (16:9), sin audio necesario
• Incluir personas disfrutando la experiencia — no solo platos vacíos

*3. 📊 Datos de Mood por Sucursal*

Para las tarjetas interactivas de destinos, necesitamos que confirmen qué aplica a cada ubicación:

• Santa Ana — ¿DJ Sets? ¿Música en vivo? ¿Terraza? Frase de ambiente:
• Lago de Coatepeque — ¿DJ Sets? ¿Música en vivo? ¿Terraza? Frase:
• San Benito — ¿DJ Sets? ¿Música en vivo? ¿Terraza? Frase:
• Simmer Garden — ¿DJ Sets? ¿Música en vivo? ¿Terraza? Frase:
• Surf City — ¿DJ Sets? ¿Música en vivo? ¿Playa? Frase:

*4. ⭐ Lista de Platos Favoritos*

El memo pide badges de \"Favorito\". Necesitamos que definan cuáles platos llevan esta etiqueta. Recomendamos 5-8 items máximo. Ya tenemos badges de \"Nuevo\" y \"Destacado\" funcionando.

*5. 🎁 Descuento SimmerLovers — Definición*

El punto 7 pide entregar un código de descuento instantáneo al registrarse. Definan:
• ¿Qué porcentaje o monto? (ej: 10%, 15%, \$5 off)
• ¿Aplica a todo el menú o solo ciertos items?
• ¿Uso único o recurrente?
• ¿Vigencia? (ej: 30 días desde registro)"

# Part 3: Status + Timeline
send_msg "━━━━━━━━━━━━━━━━━━
*LO QUE YA ESTÁ LISTO* ✅
━━━━━━━━━━━━━━━━━━

✅ *Checkout WhatsApp estructurado* — el carrito ya genera el mensaje con detalle de platos, cantidades, precios, sucursal y datos del cliente. Cada sucursal tiene su número asignado.
✅ *Programa SimmerLovers* — 4 tiers (Bronce→Platino), acumulación de puntos, canje de recompensas, historial de transacciones.
✅ *Badges en menú* — Nuevo, Destacado, Picante, Vegetariano ya implementados.
✅ *5 sucursales con páginas individuales* — galerías, horarios, estado abierto/cerrado en tiempo real.

━━━━━━━━━━━━━━━━━━
*LO QUE CONSTRUIMOS NOSOTROS* 🔨
_(una vez recibidos los entregables)_
━━━━━━━━━━━━━━━━━━

1️⃣ Hero con video loop optimizado (WebM + MP4, poster en móvil)
2️⃣ Tarjetas de destino interactivas con reveal de mood en hover
3️⃣ Jerarquía visual del menú — badge Favorito + tratamiento expandido para platos premium
4️⃣ Modal de cross-selling \"Completá Tu Experiencia\" antes de enviar pedido
5️⃣ Overlay ligero de captura SimmerLovers (Nombre + WhatsApp + Fecha de nacimiento → código de descuento)
6️⃣ Corrección del CTA de WhatsApp en homepage para usar el flujo estructurado del carrito

━━━━━━━━━━━━━━━━━━
*TIMELINE ESTIMADO* 📅
━━━━━━━━━━━━━━━━━━

Una vez recibidos los materiales fotográficos y de video:

*Semana 1:* Hero video + tarjetas interactivas + reemplazo fotográfico
*Semana 2:* Jerarquía visual del menú + cross-selling + overlay SimmerLovers
*Semana 3:* QA, optimización de performance, deploy a producción

━━━━━━━━━━━━━━━━━━

*Siguiente paso:* Envíen las respuestas de la tabla de mood por sucursal y la lista de favoritos esta semana. Coordinen la sesión fotográfica y de video lo antes posible — eso es lo que marca el timeline real.

Quedamos atentos.
_MachineMind Development Team_"

echo ""
echo "=== All messages sent ==="
