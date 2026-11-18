"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import {
  extractTicketToken,
  ticketRemaining,
  type CheckInResult,
  type DoorEvent,
  type DoorRoster,
  type DoorTicket,
} from "@/lib/ticket-door";

const SV_TZ = "America/El_Salvador";
const ALL_EVENTS = "all";
const SCAN_INTERVAL_MS = 140;
// A QR still in front of the camera is not a new scan: it has to leave the
// frame this long before the same code opens a result again.
const SAME_CODE_GONE_MS = 1500;
const ADMITTED_FLASH_MS = 1600;
const ROSTER_REFRESH_MS = 20_000;
const DETECTOR_MAX_FAILURES = 5;
// With "any event" selected, warn when the ticket's show isn't within this window.
const TONIGHT_WINDOW_MS = 12 * 3_600_000;

// Shape Detection API — not in TypeScript's DOM lib.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}
type JsQR = (typeof import("jsqr"))["default"];

type CamState = "idle" | "starting" | "scanning" | "error";

type TicketSheet = { kind: "ticket"; ticket: DoorTicket; at: number; farFromNow: boolean; error?: string };
type Sheet =
  | { kind: "loading" }
  | TicketSheet
  | { kind: "admitted"; ticket: DoorTicket; admitted: number; remaining: number }
  | { kind: "invalid"; title: string; detail: string; relogin?: boolean };

interface ApiEnvelope<T> {
  data: T | null;
  error: string | null;
  message: string;
}

const dateFmt = new Intl.DateTimeFormat("es-SV", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: SV_TZ,
});
const timeFmt = new Intl.DateTimeFormat("es-SV", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: SV_TZ,
});

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : timeFmt.format(d);
}

function agoText(iso: string | null, now: number): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "hace segundos";
  if (mins < 60) return `hace ${mins} min`;
  return `hace ${Math.floor(mins / 60)} h ${mins % 60} min`;
}

function people(n: number): string {
  return `${n} persona${n === 1 ? "" : "s"}`;
}

function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Haptics are optional feedback (iOS has none); the screen colour is the signal.
  }
}

function cameraErrorMessage(name: string): string {
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "No hay permiso para usar la cámara. Actívalo (iPhone: Ajustes › Safari › Cámara › Permitir. Android: toca el candado junto a la dirección › Permisos › Cámara) y toca «Reintentar».";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No se encontró una cámara en este dispositivo. Usa la lista de abajo.";
    case "NotReadableError":
    case "AbortError":
      return "La cámara está ocupada por otra app. Ciérrala y toca «Reintentar».";
    default:
      return "No se pudo abrir la cámara. Toca «Reintentar» o usa la lista de abajo.";
  }
}

export default function ScannerClient({ initialEventId }: { initialEventId: string | null }) {
  const [events, setEvents] = useState<DoorEvent[] | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(initialEventId ?? "");
  const [roster, setRoster] = useState<DoorRoster | null>(null);
  const [rosterError, setRosterError] = useState<{ eventId: string; message: string } | null>(null);
  const [cam, setCam] = useState<CamState>("idle");
  const [camError, setCamError] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [admitCount, setAdmitCount] = useState(1);
  const [admitting, setAdmitting] = useState(false);
  const [query, setQuery] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const detectorFailuresRef = useRef(0);
  const jsqrRef = useRef<JsQR | null>(null);
  const pausedRef = useRef(false); // a result is on screen
  const lastCodeRef = useRef<{ key: string; at: number } | null>(null);
  const selectedRef = useRef(selected);
  const resumeOnVisibleRef = useRef(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // ── Events for the picker ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/tickets", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as ApiEnvelope<{
          events: DoorEvent[];
          defaultEventId: string | null;
        }> | null;
        if (!res.ok || !json?.data) throw new Error(json?.message || "No se pudieron cargar los eventos.");
        if (cancelled) return;
        const { events: list, defaultEventId } = json.data;
        setEvents(list);
        setSelected((current) => current || defaultEventId || ALL_EVENTS);
      } catch (err) {
        if (cancelled) return;
        console.error("[DoorScanner] events load failed", err);
        setEventsError(err instanceof Error ? err.message : "No se pudieron cargar los eventos.");
        setSelected((current) => current || ALL_EVENTS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Guest list + entry counts (refreshes so several doors stay in sync) ──
  const loadRoster = useCallback(async (eventId: string, quiet: boolean) => {
    try {
      const res = await fetch(`/api/admin/tickets?event_id=${encodeURIComponent(eventId)}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as ApiEnvelope<DoorRoster> | null;
      if (!res.ok || !json?.data) throw new Error(json?.message || "No se pudo cargar la lista de boletos.");
      if (selectedRef.current !== eventId) return;
      setRoster(json.data);
      setRosterError(null);
    } catch (err) {
      console.error("[DoorScanner] roster load failed", err);
      if (!quiet && selectedRef.current === eventId) {
        setRosterError({
          eventId,
          message: err instanceof Error ? err.message : "No se pudo cargar la lista de boletos.",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!selected || selected === ALL_EVENTS) return;
    void loadRoster(selected, false);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadRoster(selected, true);
    }, ROSTER_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [selected, loadRoster]);

  // ── Camera + decoding ─────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const decodeFrame = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;

    const detector = detectorRef.current;
    if (detector) {
      try {
        const codes = await detector.detect(video);
        detectorFailuresRef.current = 0;
        return codes[0]?.rawValue ?? null;
      } catch (err) {
        detectorFailuresRef.current += 1;
        if (detectorFailuresRef.current >= DETECTOR_MAX_FAILURES) {
          console.error("[DoorScanner] native QR detector keeps failing, switching to jsQR", err);
          detectorRef.current = null;
          jsqrRef.current = (await import("jsqr")).default;
        }
        return null;
      }
    }

    const jsqr = jsqrRef.current;
    if (!jsqr) return null;
    // Decode the centre square (what the on-screen frame shows), max 640px.
    const side = Math.min(video.videoWidth, video.videoHeight);
    const size = Math.min(side, 640);
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    if (canvas.width !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    return jsqr(data, size, size, { inversionAttempts: "attemptBoth" })?.data ?? null;
  }, []);

  const openTicket = useCallback(async (token: string) => {
    pausedRef.current = true;
    setSheet({ kind: "loading" });
    try {
      const res = await fetch(`/api/admin/tickets?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as ApiEnvelope<DoorTicket> | null;
      if (res.status === 404) {
        vibrate([90, 60, 90]);
        setSheet({ kind: "invalid", title: "NO VÁLIDO", detail: "Este QR no corresponde a ningún boleto de TicketManía." });
        return;
      }
      if (res.status === 401) {
        setSheet({ kind: "invalid", title: "SESIÓN EXPIRADA", detail: "Vuelve a iniciar sesión para seguir escaneando.", relogin: true });
        return;
      }
      if (!res.ok || !json?.data) throw new Error(json?.message || `lookup HTTP ${res.status}`);

      const ticket = json.data;
      const remaining = ticketRemaining(ticket);
      const now = Date.now();
      const startsMs = ticket.event?.startsAt ? Date.parse(ticket.event.startsAt) : NaN;
      vibrate(remaining > 0 ? 40 : [90, 60, 90]);
      setAdmitCount(Math.max(1, remaining));
      setSheet({
        kind: "ticket",
        ticket,
        at: now,
        farFromNow: Number.isFinite(startsMs) && Math.abs(startsMs - now) > TONIGHT_WINDOW_MS,
      });
    } catch (err) {
      console.error("[DoorScanner] ticket lookup failed", err);
      setSheet({
        kind: "invalid",
        title: "SIN CONEXIÓN",
        detail: "No se pudo consultar el boleto. Revisa el internet e intenta de nuevo.",
      });
    }
  }, []);

  const onCode = useCallback(
    (text: string) => {
      const token = extractTicketToken(text);
      const key = token ?? `raw:${text}`;
      const now = Date.now();
      const last = lastCodeRef.current;
      const stillInView = last !== null && last.key === key && now - last.at < SAME_CODE_GONE_MS;
      lastCodeRef.current = { key, at: now };
      if (pausedRef.current || stillInView) return;

      if (!token) {
        pausedRef.current = true;
        vibrate([90, 60, 90]);
        setSheet({ kind: "invalid", title: "NO ES UN BOLETO", detail: "Este código QR no es un boleto de TicketManía." });
        return;
      }
      void openTicket(token);
    },
    [openTicket],
  );

  const runLoop = useCallback(() => {
    const tick = async () => {
      if (!streamRef.current) return;
      try {
        const text = await decodeFrame();
        if (text) onCode(text);
      } catch (err) {
        console.error("[DoorScanner] frame decode failed", err);
      }
      if (streamRef.current) timerRef.current = window.setTimeout(tick, SCAN_INTERVAL_MS);
    };
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(tick, SCAN_INTERVAL_MS);
  }, [decodeFrame, onCode]);

  const startCamera = useCallback(async () => {
    setCamError(null);
    setNeedsReload(false);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCam("error");
      setCamError(
        "Este navegador no permite usar la cámara. Abre simmerdownsv.com/admin/boletos en Safari o Chrome (no dentro de WhatsApp o Instagram).",
      );
      return;
    }
    setCam("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      if (!detectorRef.current && !jsqrRef.current) {
        const Native = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
        if (Native) {
          try {
            const formats = await Native.getSupportedFormats();
            if (formats.includes("qr_code")) detectorRef.current = new Native({ formats: ["qr_code"] });
          } catch (err) {
            console.error("[DoorScanner] native QR detector unavailable, using jsQR", err);
          }
        }
        if (!detectorRef.current) jsqrRef.current = (await import("jsqr")).default;
      }

      setCam("scanning");
      runLoop();
    } catch (err) {
      stopCamera();
      const name = err instanceof Error ? err.name : "";
      console.error("[DoorScanner] camera start failed", err);
      // Permission errors can come from a page opened before camera access was
      // allowed for the panel — a fresh load picks up the right policy.
      setNeedsReload(name === "NotAllowedError" || name === "SecurityError");
      setCamError(cameraErrorMessage(name));
      setCam("error");
    }
  }, [runLoop, stopCamera]);

  // Release the camera when the phone locks or the tab hides; resume after.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (streamRef.current) {
          resumeOnVisibleRef.current = true;
          stopCamera();
          setCam("idle");
        }
      } else if (resumeOnVisibleRef.current) {
        resumeOnVisibleRef.current = false;
        void startCamera();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [startCamera, stopCamera]);

  useEffect(
    () => () => {
      stopCamera();
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    },
    [stopCamera],
  );

  // ── Result sheet actions ──────────────────────────────────
  const dismiss = useCallback(() => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    setSheet(null);
    pausedRef.current = false;
  }, []);

  const admit = useCallback(
    async (base: TicketSheet, count: number) => {
      const { ticket } = base;
      setAdmitting(true);
      try {
        const res = await fetch("/api/admin/tickets/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: ticket.token, count }),
        });
        const result = ((await res.json().catch(() => null)) as CheckInResult | null) ?? { ok: false, reason: "error" };

        if (result.ok) {
          const admitted = result.admitted ?? count;
          const remaining = result.remaining ?? Math.max(0, ticket.quantity - ticket.admitted - admitted);
          vibrate([60, 40, 60]);
          setSheet({ kind: "admitted", ticket, admitted, remaining });
          const eventId = selectedRef.current;
          if (eventId && eventId !== ALL_EVENTS) void loadRoster(eventId, true);
          flashTimerRef.current = window.setTimeout(dismiss, ADMITTED_FLASH_MS);
          return;
        }
        if (result.reason === "unauthorized") {
          setSheet({ kind: "invalid", title: "SESIÓN EXPIRADA", detail: "Vuelve a iniciar sesión para seguir escaneando.", relogin: true });
          return;
        }
        if (result.reason === "already_used" || result.reason === "void" || result.reason === "not_found") {
          // Another door got there first — show the ticket as it is now.
          await openTicket(ticket.token);
          return;
        }
        setSheet({ ...base, error: "No se pudo registrar la entrada. Intenta de nuevo." });
      } catch (err) {
        console.error("[DoorScanner] check-in failed", err);
        setSheet({ ...base, error: "Sin conexión. Revisa el internet e intenta de nuevo." });
      } finally {
        setAdmitting(false);
      }
    },
    [dismiss, loadRoster, openTicket],
  );

  // ── Derived view state ────────────────────────────────────
  const activeRoster = roster && roster.event.id === selected ? roster : null;
  const pickerEvent = events?.find((e) => e.id === selected) ?? null;
  const stats = activeRoster?.event ?? pickerEvent;
  const selectedMissingFromPicker =
    !!selected && selected !== ALL_EVENTS && events !== null && pickerEvent === null;
  const rosterErrorMessage = rosterError && rosterError.eventId === selected ? rosterError.message : null;

  const filtered = useMemo(() => {
    const tickets = activeRoster?.tickets ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    const digits = q.replace(/\D/g, "");
    return tickets.filter(
      (t) =>
        (t.buyerName ?? "").toLowerCase().includes(q) ||
        (digits.length >= 3 &&
          ((t.buyerPhone ?? "").replace(/\D/g, "").includes(digits) ||
            (t.orderNumber ?? "").replace(/\D/g, "").includes(digits))),
    );
  }, [activeRoster, query]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A pasted ticket link/code (or a Bluetooth scanner typing one) opens it.
    const token = extractTicketToken(query);
    if (token) {
      setQuery("");
      void openTicket(token);
    }
  };

  const insidePct = stats && stats.seats > 0 ? Math.min(100, Math.round((stats.admitted / stats.seats) * 100)) : 0;

  return (
    <div className="max-w-md mx-auto pb-12">
      <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2 mb-1">
        <ScanLine className="w-6 h-6 text-[#FF6B35]" /> Escanear Boletos
      </h1>
      <p className="text-sm text-[#6B6560] mb-5">Puerta TicketManía · valida cada QR una sola vez.</p>

      {/* Event picker */}
      <label htmlFor="door-event" className="block text-xs text-[#6B6560] uppercase tracking-wider mb-1.5">
        Evento en la puerta
      </label>
      <select
        id="door-event"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-3 py-3 rounded-xl focus:border-[#FF6B35] focus:outline-none"
      >
        {selected === "" && <option value="">Cargando eventos…</option>}
        {events?.map((e) => (
          <option key={e.id} value={e.id}>
            {e.title} · {fmtDate(e.startsAt)}
          </option>
        ))}
        {selectedMissingFromPicker && (
          <option value={selected}>{activeRoster?.event.title ?? "Evento seleccionado"}</option>
        )}
        <option value={ALL_EVENTS}>Cualquier evento (sin revisar el evento)</option>
      </select>
      {eventsError && <p className="text-xs text-red-400 mt-1.5">{eventsError}</p>}

      {/* Entry counter */}
      {selected !== ALL_EVENTS && stats && (
        <div className="mt-3 bg-[#252320] border border-[#3D3936] rounded-xl px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[#B8B0A8] flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Adentro
            </span>
            <span className="text-[#FFF8F0] font-bold tabular-nums text-xl">
              {stats.admitted}
              <span className="text-[#6B6560] font-normal text-base"> / {stats.seats}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-[#1F1D1A] rounded-full overflow-hidden">
            <div className="h-full bg-[#4CAF50] transition-all" style={{ width: `${insidePct}%` }} />
          </div>
          <p className="text-xs text-[#6B6560] mt-1.5">
            {stats.orders} compra{stats.orders === 1 ? "" : "s"} · faltan {Math.max(0, stats.seats - stats.admitted)}
          </p>
          {stats.tiers.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-[#3D3936] pt-2" data-testid="door-tier-counts">
              {stats.tiers.map((tier) => (
                <li key={tier.name} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-[#FFB800] font-semibold">{tier.name}</span>
                  <span className="shrink-0 tabular-nums text-[#FFF8F0]">
                    {tier.admitted}
                    <span className="text-[#6B6560]"> / {tier.seats}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Camera */}
      <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-black border border-[#3D3936]">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover ${cam === "scanning" ? "" : "opacity-0"}`}
        />
        {cam === "scanning" ? (
          <>
            <div
              className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute left-[14%] right-[14%] top-1/2 h-0.5 bg-[#FF6B35]/80 animate-pulse"
              aria-hidden="true"
            />
            <p className="absolute bottom-3 inset-x-0 text-center text-xs text-white/85">
              Apunta al código QR del boleto
            </p>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            {cam === "starting" && (
              <>
                <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
                <p className="text-[#B8B0A8] text-sm">Abriendo cámara…</p>
              </>
            )}
            {cam === "error" && (
              <>
                <CameraOff className="w-10 h-10 text-red-400" />
                <p className="text-sm text-[#FFF8F0] leading-relaxed">{camError}</p>
                <button
                  onClick={() => (needsReload ? window.location.reload() : void startCamera())}
                  className="min-h-[48px] px-6 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
              </>
            )}
            {cam === "idle" && (
              <>
                <Camera className="w-12 h-12 text-[#FF6B35]" />
                <button
                  onClick={() => void startCamera()}
                  className="min-h-[56px] px-8 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-lg font-bold rounded-xl"
                >
                  Iniciar cámara
                </button>
                <p className="text-xs text-[#6B6560] max-w-[16rem]">
                  La primera vez el teléfono pedirá permiso para usar la cámara: toca «Permitir».
                </p>
              </>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#6B6560]">
        <span>Si no lee, pide al cliente subir el brillo de su pantalla.</span>
        {cam === "scanning" && (
          <button
            onClick={() => {
              resumeOnVisibleRef.current = false;
              stopCamera();
              setCam("idle");
            }}
            className="shrink-0 underline hover:text-[#B8B0A8]"
          >
            Detener cámara
          </button>
        )}
      </div>

      {/* Guest list — for QR codes that won't scan */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-[#FFF8F0] mb-1">¿El QR no escanea? Búscalo aquí</h2>
        <p className="text-xs text-[#6B6560] mb-3">Por nombre, teléfono o número de pedido.</p>
        {selected === ALL_EVENTS ? (
          <p className="text-sm text-[#6B6560] bg-[#252320] border border-[#3D3936] rounded-xl px-4 py-3">
            Elige un evento arriba para ver su lista de compradores.
          </p>
        ) : (
          <>
            <form onSubmit={onSearchSubmit} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder="Buscar comprador…"
                aria-label="Buscar comprador por nombre, teléfono o número de pedido"
                className="w-full pl-9 pr-3 py-3 bg-[#252320] border border-[#3D3936] rounded-xl text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
              />
            </form>
            {rosterErrorMessage && (
              <div className="text-sm text-red-400 mb-3 flex items-center gap-3">
                {rosterErrorMessage}
                <button onClick={() => void loadRoster(selected, false)} className="underline shrink-0">
                  Reintentar
                </button>
              </div>
            )}
            {!activeRoster && !rosterErrorMessage && (
              <div className="space-y-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-[#252320] border border-[#3D3936] animate-pulse" />
                ))}
              </div>
            )}
            {activeRoster && filtered.length === 0 && (
              <p className="text-sm text-[#6B6560]">
                {activeRoster.tickets.length === 0 ? "Este evento aún no tiene boletos vendidos." : "Sin resultados."}
              </p>
            )}
            <ul className="space-y-2">
              {filtered.map((t) => (
                <li key={t.token}>
                  <button
                    onClick={() => void openTicket(t.token)}
                    className="w-full flex items-center gap-3 text-left bg-[#252320] border border-[#3D3936] hover:border-[#FF6B35]/50 rounded-xl px-4 py-3 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[#FFF8F0] font-medium">{t.buyerName || "Sin nombre"}</p>
                      <p className="truncate text-xs text-[#6B6560]">
                        {t.tierName && <span className="text-[#FFB800] font-semibold">{t.tierName} · </span>}
                        #{t.orderNumber ?? "—"}
                        {t.buyerPhone ? ` · ${t.buyerPhone}` : ""}
                      </p>
                    </div>
                    <StatusChip ticket={t} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-3"
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
        >
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-[#3D3936] bg-[#252320] shadow-2xl">
            <SheetView
              sheet={sheet}
              selected={selected}
              admitCount={admitCount}
              setAdmitCount={setAdmitCount}
              admitting={admitting}
              onAdmit={admit}
              onDismiss={dismiss}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChip({ ticket }: { ticket: DoorTicket }) {
  const remaining = ticketRemaining(ticket);
  let cls = "bg-[#3D3936] text-[#B8B0A8]";
  let text = people(ticket.quantity);
  if (ticket.status === "void") {
    cls = "bg-red-500/15 text-red-400";
    text = "Anulado";
  } else if (remaining === 0) {
    cls = "bg-[#4CAF50]/15 text-[#4CAF50]";
    text = ticket.quantity > 1 ? `Adentro (${ticket.quantity})` : "Adentro";
  } else if (ticket.admitted > 0) {
    cls = "bg-[#FFB800]/15 text-[#FFB800]";
    text = `${ticket.admitted}/${ticket.quantity} adentro`;
  }
  return <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums ${cls}`}>{text}</span>;
}

function SheetView({
  sheet,
  selected,
  admitCount,
  setAdmitCount,
  admitting,
  onAdmit,
  onDismiss,
}: {
  sheet: Sheet;
  selected: string;
  admitCount: number;
  setAdmitCount: (n: number) => void;
  admitting: boolean;
  onAdmit: (base: TicketSheet, count: number) => void;
  onDismiss: () => void;
}) {
  if (sheet.kind === "loading") {
    return (
      <div className="px-6 py-12 text-center">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mx-auto mb-3" />
        <p className="text-[#B8B0A8]">Verificando boleto…</p>
      </div>
    );
  }

  if (sheet.kind === "admitted") {
    return (
      <button onClick={onDismiss} className="block w-full bg-[#2E7D32] px-6 py-10 text-center text-white">
        <CheckCircle2 className="w-20 h-20 mx-auto mb-3" />
        <p className="text-3xl font-black tracking-wide">ADMITIDO</p>
        <p className="mt-2 text-2xl font-semibold">Pasan {people(sheet.admitted)}</p>
        {sheet.ticket.tierName && (
          <p className="mt-1 text-xl font-black uppercase tracking-wide">{sheet.ticket.tierName}</p>
        )}
        <p className="mt-1 text-white/80">{sheet.ticket.buyerName || ""}</p>
        {sheet.remaining > 0 && (
          <p className="mt-4 rounded-lg bg-black/20 px-3 py-2 text-sm">
            Quedan {sheet.remaining} en este boleto para más tarde
          </p>
        )}
        <p className="mt-5 text-xs text-white/70">Toca para seguir escaneando</p>
      </button>
    );
  }

  if (sheet.kind === "invalid") {
    return (
      <div>
        <div className="bg-[#B3261E] px-6 py-6 text-center text-white">
          <XCircle className="w-14 h-14 mx-auto mb-2" />
          <p className="text-2xl font-black tracking-wide">{sheet.title}</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[#FFF8F0] text-center">{sheet.detail}</p>
          {sheet.relogin ? (
            <Link
              href="/auth/login?redirect=/admin/boletos"
              className="block w-full min-h-[52px] py-3.5 text-center bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-lg font-bold rounded-xl"
            >
              Iniciar sesión
            </Link>
          ) : (
            <button
              onClick={onDismiss}
              autoFocus
              className="w-full min-h-[52px] bg-[#3D3936] hover:bg-[#4A4542] text-white text-lg font-bold rounded-xl"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    );
  }

  const t = sheet.ticket;
  const remaining = ticketRemaining(t);
  const isVoid = t.status === "void";
  const isUsed = !isVoid && remaining === 0;
  const wrongEvent =
    !isVoid && !isUsed && selected !== ALL_EVENTS && selected !== "" && !!t.event && t.event.id !== selected;
  const canAdmit = !isVoid && !isUsed;

  const header = isVoid
    ? { cls: "bg-[#B3261E]", icon: <XCircle className="w-14 h-14 mx-auto mb-2" />, title: "BOLETO ANULADO" }
    : isUsed
      ? { cls: "bg-[#B3261E]", icon: <XCircle className="w-14 h-14 mx-auto mb-2" />, title: "YA FUE USADO" }
      : wrongEvent
        ? { cls: "bg-[#B7791F]", icon: <AlertTriangle className="w-14 h-14 mx-auto mb-2" />, title: "OTRO EVENTO" }
        : { cls: "bg-[#2E7D32]", icon: <CheckCircle2 className="w-14 h-14 mx-auto mb-2" />, title: "VÁLIDO" };

  return (
    <div>
      <div className={`${header.cls} px-6 py-5 text-center text-white`}>
        {header.icon}
        <p className="text-2xl font-black tracking-wide">{header.title}</p>
      </div>

      <div className="p-5 space-y-3">
        {t.tierName && (
          <p
            className="rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/40 px-4 py-2 text-center text-xl font-black uppercase tracking-wide text-[#FFB800] break-words"
            data-testid="door-tier"
          >
            {t.tierName}
          </p>
        )}
        <div>
          <p className="text-2xl font-bold text-[#FFF8F0] leading-tight break-words">{t.buyerName || "Sin nombre"}</p>
          {t.event && (
            <p className="text-sm text-[#B8B0A8] mt-1">
              {t.event.title}
              {t.event.startsAt ? ` · ${fmtDate(t.event.startsAt)}` : ""}
            </p>
          )}
          <p className="text-xs text-[#6B6560] mt-0.5">
            Pedido #{t.orderNumber ?? "—"}
            {t.buyerPhone ? ` · ${t.buyerPhone}` : ""}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-[#1F1D1A] px-4 py-3">
          <span className="text-sm text-[#B8B0A8]">Boleto para</span>
          <span className="text-xl font-bold text-[#FFF8F0] tabular-nums">{people(t.quantity)}</span>
        </div>

        {isUsed && (
          <p className="text-sm text-[#FF8A80]">
            Entró a las {fmtTime(t.checkedInAt)} ({agoText(t.checkedInAt, sheet.at)}) · {t.admitted} de {t.quantity}
          </p>
        )}
        {!isUsed && !isVoid && t.admitted > 0 && (
          <p className="text-sm text-[#FFB800]">
            Ya entraron {t.admitted} de {t.quantity} (último ingreso {fmtTime(t.checkedInAt)}). Quedan {remaining}.
          </p>
        )}
        {wrongEvent && (
          <p className="text-sm text-[#FFB800]">
            Este boleto NO es para el evento seleccionado en la puerta.
          </p>
        )}
        {!wrongEvent && canAdmit && sheet.farFromNow && t.event?.startsAt && (
          <p className="text-sm text-[#FFB800]">Ojo: este boleto es para el {fmtDate(t.event.startsAt)}.</p>
        )}
        {t.oversold && (
          <p className="text-sm text-[#FFB800]">⚠️ Venta sobre cupo — confirmar con gerencia.</p>
        )}
        {sheet.error && <p className="text-sm text-red-400">{sheet.error}</p>}

        {canAdmit && remaining > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-[#B8B0A8]">¿Cuántos entran ahora?</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdmitCount(Math.max(1, admitCount - 1))}
                disabled={admitCount <= 1}
                aria-label="Menos personas"
                className="w-11 h-11 rounded-xl bg-[#3D3936] text-white flex items-center justify-center disabled:opacity-40"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center text-2xl font-bold text-[#FFF8F0] tabular-nums">{admitCount}</span>
              <button
                onClick={() => setAdmitCount(Math.min(remaining, admitCount + 1))}
                disabled={admitCount >= remaining}
                aria-label="Más personas"
                className="w-11 h-11 rounded-xl bg-[#3D3936] text-white flex items-center justify-center disabled:opacity-40"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 space-y-2">
          {canAdmit && !wrongEvent && (
            <button
              onClick={() => onAdmit(sheet, admitCount)}
              disabled={admitting}
              autoFocus
              className="w-full min-h-[60px] bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-60 text-white text-2xl font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {admitting ? <Loader2 className="w-6 h-6 animate-spin" /> : `Admitir ${admitCount} →`}
            </button>
          )}
          <button
            onClick={onDismiss}
            disabled={admitting}
            autoFocus={!canAdmit || wrongEvent}
            className={`w-full min-h-[52px] rounded-xl font-bold disabled:opacity-60 ${
              canAdmit && !wrongEvent
                ? "text-[#B8B0A8] hover:bg-[#3D3936]"
                : "bg-[#3D3936] hover:bg-[#4A4542] text-white text-lg"
            }`}
          >
            {canAdmit && !wrongEvent ? "Cancelar" : "Siguiente"}
          </button>
          {canAdmit && wrongEvent && (
            <button
              onClick={() => onAdmit(sheet, admitCount)}
              disabled={admitting}
              className="w-full min-h-[44px] text-sm text-[#FFB800] underline disabled:opacity-60"
            >
              {admitting ? "Registrando…" : `Admitir de todos modos (${admitCount})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
