// Brand URLs people type off posters and Instagram ("TicketManía").
// Page routes match case-sensitively, so "/TicketMania" would 404, while
// next.config redirects match case-INsensitively — a "/TicketMania" →
// "/ticketmania" redirect there also matches "/ticketmania" itself and loops.
// Capitalised and accented spellings are therefore folded in the proxy.
const VANITY_SEGMENTS = new Set(['ticketmania'])

/**
 * Canonical path for a capitalised or accented spelling of a vanity route
 * ("/TicketManía/x" → "/ticketmania/x"); null when the path is already
 * canonical or is not a vanity route. Only the first segment is folded.
 */
export function canonicalVanityPath(pathname: string): string | null {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname)
  if (!match) return null
  let segment: string
  try {
    segment = decodeURIComponent(match[1])
  } catch {
    return null
  }
  const folded = segment
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
  if (!VANITY_SEGMENTS.has(folded) || match[1] === folded) return null
  return `/${folded}${match[2] ?? ''}`
}
