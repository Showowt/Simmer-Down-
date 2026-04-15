/**
 * Fixed SVG noise overlay. Respects prefers-reduced-motion (dims further
 * but does not animate). Render once at root layout; CSS positions it
 * fixed + pointer-events-none so it never intercepts input.
 */
export function FilmGrain() {
  const noise = `
    <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
        <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.45 0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(%23n)'/>
    </svg>
  `
    .trim()
    .replace(/\n\s*/g, "")
    .replace(/#/g, "%23");

  const bg = `url("data:image/svg+xml;utf8,${noise}")`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] mix-blend-overlay opacity-[0.035] motion-reduce:opacity-[0.02]"
      style={{ backgroundImage: bg, backgroundSize: "200px 200px" }}
    />
  );
}
