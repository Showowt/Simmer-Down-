"use client";

/**
 * Admin — Calendario de Adviento (client request, 2026-11-25).
 *
 * 12 drawers, one per December date. Staff upload each drawer's prize image
 * (straight to the private `advent` bucket via a signed upload slot), set an
 * optional title/description, and switch the campaign on. The public page
 * only reveals a drawer from 00:00 El Salvador time on its date; "Vista
 * previa" opens /adviento?vista=<date> to see any day ahead of time.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarHeart,
  Eye,
  ExternalLink,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ADVENT_BUCKET,
  ADVENT_IMAGE_TYPES,
  ADVENT_MAX_IMAGE_BYTES,
  addDays,
  formatAdventShort,
  type AdminAdventDay,
  type AdminAdventPayload,
  type AdventImageType,
} from "@/lib/advent";

interface ApiResult<T> {
  data: T | null;
  error: string | null;
  message: string;
}

interface Draft {
  date: string;
  title: string;
  description: string;
}

type CardNotice = { kind: "ok" | "error"; text: string } | null;

function draftOf(d: AdminAdventDay): Draft {
  return { date: d.date, title: d.title ?? "", description: d.description ?? "" };
}

async function callApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  let json: ApiResult<T> | null = null;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    json = null;
  }
  if (!res.ok || !json || json.data === null) {
    throw new Error(json?.message || `Error ${res.status}`);
  }
  return json.data;
}

export default function AdminAdventPage() {
  const [payload, setPayload] = useState<AdminAdventPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [busy, setBusy] = useState<Record<number, "save" | "upload" | "remove" | undefined>>({});
  const [notices, setNotices] = useState<Record<number, CardNotice>>({});
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const apply = useCallback((next: AdminAdventPayload, onlyDay?: number) => {
    setPayload(next);
    setDrafts((prev) => {
      const out: Record<number, Draft> = { ...prev };
      for (const d of next.days) {
        if (onlyDay === undefined || d.day === onlyDay || !out[d.day]) out[d.day] = draftOf(d);
      }
      return out;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      apply(await callApi<AdminAdventPayload>("/api/admin/advent"));
    } catch (error) {
      console.error("[AdminAdvent] load", error);
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar el calendario.");
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    void load();
  }, [load]);

  const setNotice = (day: number, notice: CardNotice) =>
    setNotices((prev) => ({ ...prev, [day]: notice }));

  const toggleLive = async () => {
    if (!payload) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      const next = await callApi<AdminAdventPayload>("/api/admin/advent", {
        method: "PATCH",
        body: JSON.stringify({ kind: "settings", is_live: !payload.isLive }),
      });
      setPayload(next);
    } catch (error) {
      console.error("[AdminAdvent] toggle", error);
      setSwitchError(error instanceof Error ? error.message : "No se pudo cambiar.");
    } finally {
      setSwitching(false);
    }
  };

  const saveDay = async (d: AdminAdventDay) => {
    const draft = drafts[d.day];
    if (!draft) return;
    setBusy((b) => ({ ...b, [d.day]: "save" }));
    setNotice(d.day, null);
    try {
      const next = await callApi<AdminAdventPayload>("/api/admin/advent", {
        method: "PATCH",
        body: JSON.stringify({
          kind: "day",
          day: d.day,
          unlock_date: draft.date,
          title: draft.title,
          description: draft.description,
        }),
      });
      apply(next, d.day);
      setNotice(d.day, { kind: "ok", text: "Guardado." });
    } catch (error) {
      console.error("[AdminAdvent] save", error);
      setNotice(d.day, { kind: "error", text: error instanceof Error ? error.message : "No se pudo guardar." });
    } finally {
      setBusy((b) => ({ ...b, [d.day]: undefined }));
    }
  };

  const uploadImage = async (d: AdminAdventDay, file: File) => {
    if (!(ADVENT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setNotice(d.day, { kind: "error", text: "Usa una imagen JPG, PNG o WebP." });
      return;
    }
    if (file.size > ADVENT_MAX_IMAGE_BYTES) {
      setNotice(d.day, { kind: "error", text: "La imagen pesa más de 5 MB. Expórtala más liviana (JPG)." });
      return;
    }
    setBusy((b) => ({ ...b, [d.day]: "upload" }));
    setNotice(d.day, null);
    try {
      const slot = await callApi<{ path: string; token: string }>("/api/admin/advent/upload", {
        method: "POST",
        body: JSON.stringify({ day: d.day, contentType: file.type as AdventImageType }),
      });
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(ADVENT_BUCKET)
        .uploadToSignedUrl(slot.path, slot.token, file, { contentType: file.type });
      if (upErr) throw new Error("No se pudo subir la imagen. Revisa tu conexión e inténtalo de nuevo.");
      const next = await callApi<AdminAdventPayload>("/api/admin/advent", {
        method: "PATCH",
        body: JSON.stringify({ kind: "day", day: d.day, image_path: slot.path }),
      });
      setPayload(next);
      setNotice(d.day, { kind: "ok", text: "Imagen guardada." });
    } catch (error) {
      console.error("[AdminAdvent] upload", error);
      setNotice(d.day, { kind: "error", text: error instanceof Error ? error.message : "No se pudo subir la imagen." });
    } finally {
      setBusy((b) => ({ ...b, [d.day]: undefined }));
    }
  };

  const removeImage = async (d: AdminAdventDay) => {
    setConfirmRemove(null);
    setBusy((b) => ({ ...b, [d.day]: "remove" }));
    setNotice(d.day, null);
    try {
      const next = await callApi<AdminAdventPayload>("/api/admin/advent", {
        method: "PATCH",
        body: JSON.stringify({ kind: "day", day: d.day, image_path: null }),
      });
      setPayload(next);
      setNotice(d.day, { kind: "ok", text: "Imagen quitada." });
    } catch (error) {
      console.error("[AdminAdvent] remove", error);
      setNotice(d.day, { kind: "error", text: error instanceof Error ? error.message : "No se pudo quitar." });
    } finally {
      setBusy((b) => ({ ...b, [d.day]: undefined }));
    }
  };

  const warnings = useMemo(() => {
    if (!payload) return [];
    const soon = addDays(payload.today, 3);
    return payload.days.filter((d) => !d.imagePath && d.state !== "past" && d.date <= soon);
  }, [payload]);

  const withImage = payload?.days.filter((d) => d.imagePath).length ?? 0;
  const firstDate = payload?.days.reduce<string | null>((m, d) => (m === null || d.date < m ? d.date : m), null) ?? null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
            <CalendarHeart className="w-6 h-6 text-[#FF6B35]" />
            Calendario de Adviento
          </h1>
          <p className="text-[#6B6560] max-w-2xl">
            12 sorpresas de diciembre. Sube la imagen del premio de cada casilla: el sitio la muestra solo a partir
            de su fecha (00:00, hora de El Salvador). Antes de esa fecha nadie puede verla.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="self-start inline-flex items-center gap-2 border border-[#3D3936] px-3 py-2 text-sm text-[#FFF8F0] hover:border-[#FF6B35] transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {loadError && (
        <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="w-4 h-4" />
          {loadError}
          <button type="button" onClick={() => void load()} className="underline font-semibold">
            Reintentar
          </button>
        </div>
      )}

      {loading && !payload ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[420px] animate-pulse bg-[#1F1D1A] border border-[#3D3936]" />
          ))}
        </div>
      ) : payload ? (
        <>
          {/* Switch + numbers */}
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-[#1F1D1A] border border-[#3D3936] p-5" data-testid="advent-switch-card">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6B6560]">En el sitio</p>
                  <p className={`text-lg font-semibold ${payload.isLive ? "text-[#4CAF50]" : "text-[#FFF8F0]"}`} data-testid="advent-live-state">
                    {payload.isLive ? "Encendido — visible para los clientes" : "Apagado — los clientes no lo ven"}
                  </p>
                  <p className="mt-1 text-xs text-[#6B6560] max-w-md">
                    Encendido muestra el regalo flotante en todo el sitio y el botón «🎁 Navidad» en el menú. La
                    página simmerdownsv.com/adviento existe siempre; apagado, todas las casillas se ven cerradas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleLive()}
                  disabled={switching}
                  data-testid="advent-toggle"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold transition disabled:opacity-60 ${
                    payload.isLive
                      ? "border border-[#3D3936] text-[#FFF8F0] hover:border-red-400"
                      : "bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
                  }`}
                >
                  {switching && <Loader2 className="w-4 h-4 animate-spin" />}
                  {payload.isLive ? "Apagar" : "Encender en el sitio"}
                </button>
              </div>
              {switchError && <p className="mt-3 text-sm text-red-300">{switchError}</p>}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/adviento" target="_blank" className="inline-flex items-center gap-1.5 text-[#FF6B35] hover:underline">
                  <ExternalLink className="w-4 h-4" /> Ver la página
                </Link>
                {firstDate && (
                  <Link href={`/adviento?vista=${firstDate}`} target="_blank" className="inline-flex items-center gap-1.5 text-[#FF6B35] hover:underline">
                    <Eye className="w-4 h-4" /> Vista previa del {formatAdventShort(firstDate, "es")}
                  </Link>
                )}
              </div>
            </div>
            <div className="bg-[#1F1D1A] border border-[#3D3936] p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#6B6560]">Aperturas</p>
                <p className="text-3xl font-bold text-[#FFF8F0]" data-testid="advent-total-opens">{payload.totalOpens}</p>
                <p className="text-xs text-[#6B6560]">personas distintas que abrieron una casilla</p>
              </div>
              <div>
                <p className="text-sm text-[#6B6560]">Con imagen</p>
                <p className={`text-3xl font-bold ${withImage === 12 ? "text-[#4CAF50]" : "text-[#FFF8F0]"}`}>{withImage}/12</p>
                <p className="text-xs text-[#6B6560]">casillas listas</p>
              </div>
            </div>
          </div>

          {warnings.length > 0 && (
            <div role="alert" className="mb-6 border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-4 py-3 text-sm text-[#FDE68A]">
              {warnings.map((d) => (
                <p key={d.day} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {d.state === "today"
                    ? `La casilla ${d.day} está abierta HOY y no tiene imagen — los clientes ven «se está envolviendo».`
                    : `La casilla ${d.day} se abre el ${formatAdventShort(d.date, "es")} y todavía no tiene imagen.`}
                </p>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {payload.days.map((d) => {
              const draft = drafts[d.day] ?? draftOf(d);
              const dirty =
                draft.date !== d.date ||
                draft.title !== (d.title ?? "") ||
                draft.description !== (d.description ?? "");
              const state = busy[d.day];
              const notice = notices[d.day];
              const inputId = `advent-file-${d.day}`;
              return (
                <div key={d.day} className="bg-[#1F1D1A] border border-[#3D3936] flex flex-col" data-testid={`advent-admin-day-${d.day}`}>
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#3D3936]">
                    <p className="font-semibold text-[#FFF8F0]">Casilla {d.day}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 ${
                          d.state === "today"
                            ? "bg-[#4CAF50]/20 text-[#4CAF50]"
                            : d.state === "past"
                              ? "bg-[#3D3936] text-[#A8A29E]"
                              : "bg-[#FF6B35]/15 text-[#FF6B35]"
                        }`}
                      >
                        {d.state === "today" ? "Abierta hoy" : d.state === "past" ? "Ya pasó" : `Se abre ${formatAdventShort(d.date, "es")}`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#A8A29E]" title="Personas distintas que la abrieron">
                        <Eye className="w-3.5 h-3.5" /> {d.opens}
                      </span>
                    </div>
                  </div>

                  <div className="relative bg-black aspect-[4/5]">
                    {d.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.imageUrl} alt={`Premio casilla ${d.day}`} className="absolute inset-0 w-full h-full object-contain" />
                    ) : (
                      <label
                        htmlFor={inputId}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#3D3936] hover:border-[#FF6B35] cursor-pointer text-center px-6 transition"
                      >
                        <ImagePlus className="w-10 h-10 text-[#6B6560]" />
                        <span className="text-sm text-[#FFF8F0]">Subir imagen del premio</span>
                        <span className="text-xs text-[#6B6560]">JPG, PNG o WebP · máx. 5 MB · vertical 1080×1350 se ve mejor</span>
                      </label>
                    )}
                    {state === "upload" || state === "remove" ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
                      </div>
                    ) : null}
                    <input
                      id={inputId}
                      type="file"
                      accept={ADVENT_IMAGE_TYPES.join(",")}
                      className="hidden"
                      disabled={state !== undefined}
                      data-testid={`advent-file-${d.day}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void uploadImage(d, file);
                      }}
                    />
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {d.imageUrl && (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <label
                          htmlFor={inputId}
                          className="inline-flex items-center gap-1.5 border border-[#3D3936] px-3 py-1.5 text-[#FFF8F0] hover:border-[#FF6B35] cursor-pointer transition"
                        >
                          <Upload className="w-4 h-4" /> Cambiar imagen
                        </label>
                        {confirmRemove === d.day ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-[#A8A29E]">¿Quitar?</span>
                            <button type="button" onClick={() => void removeImage(d)} className="text-red-300 font-semibold hover:underline">
                              Sí, quitar
                            </button>
                            <button type="button" onClick={() => setConfirmRemove(null)} className="text-[#A8A29E] hover:underline">
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRemove(d.day)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#A8A29E] hover:text-red-300 transition"
                          >
                            <Trash2 className="w-4 h-4" /> Quitar
                          </button>
                        )}
                      </div>
                    )}

                    <label className="text-xs text-[#A8A29E]">
                      Fecha en que se abre
                      <input
                        type="date"
                        value={draft.date}
                        min="2026-11-01"
                        max="2027-01-31"
                        onChange={(e) => setDrafts((p) => ({ ...p, [d.day]: { ...draft, date: e.target.value } }))}
                        className="mt-1 w-full bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none [color-scheme:dark]"
                      />
                    </label>
                    <label className="text-xs text-[#A8A29E]">
                      Título (opcional)
                      <input
                        type="text"
                        value={draft.title}
                        maxLength={120}
                        placeholder="Ej: Reto del chocolate caliente"
                        onChange={(e) => setDrafts((p) => ({ ...p, [d.day]: { ...draft, title: e.target.value } }))}
                        className="mt-1 w-full bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                      />
                    </label>
                    <label className="text-xs text-[#A8A29E]">
                      Texto debajo de la imagen (opcional)
                      <textarea
                        value={draft.description}
                        maxLength={600}
                        rows={3}
                        placeholder="Ej: Válido solo hoy en las 5 sucursales."
                        onChange={(e) => setDrafts((p) => ({ ...p, [d.day]: { ...draft, description: e.target.value } }))}
                        className="mt-1 w-full bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none resize-y"
                      />
                    </label>

                    {notice && (
                      <p role="status" className={`text-sm ${notice.kind === "ok" ? "text-[#4CAF50]" : "text-red-300"}`}>
                        {notice.text}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <Link
                        href={`/adviento?vista=${d.date}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm text-[#FF6B35] hover:underline"
                      >
                        <Eye className="w-4 h-4" /> Vista previa
                      </Link>
                      <button
                        type="button"
                        onClick={() => void saveDay(d)}
                        disabled={!dirty || state !== undefined}
                        data-testid={`advent-save-${d.day}`}
                        className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] disabled:text-[#6B6560] text-white px-4 py-2 text-sm font-medium transition"
                      >
                        {state === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
