"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Star,
  Calendar,
  Clock,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";

// ─────────────────────────────────────────────
// Real production events schema
// ─────────────────────────────────────────────
type Recurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

interface DbEvent {
  id: string;
  title: string;
  title_es?: string | null;
  slug?: string | null;
  description?: string | null;
  description_es?: string | null;
  location_id?: string | null;
  custom_venue?: string | null;
  starts_at: string;
  ends_at?: string | null;
  recurrence?: Recurrence | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  is_featured?: boolean;
  is_published?: boolean;
  tags?: string[] | null;
  rsvp_enabled?: boolean;
  created_at?: string;
}

interface LocationOption {
  id: string;
  name: string;
  slug: string;
}

const emptyEvent: Partial<DbEvent> = {
  title: "",
  description_es: "",
  custom_venue: "Simmer Down San Benito",
  starts_at: "",
  ends_at: "",
  recurrence: "none",
  image_url: null,
  is_featured: false,
  is_published: true,
  tags: [],
  rsvp_enabled: false,
};

// Convert "YYYY-MM-DDTHH:MM" (datetime-local) <-> ISO
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(s: string): string {
  if (!s) return "";
  return new Date(s).toISOString();
}

function formatEventDate(iso: string, recurrence?: Recurrence | null): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  if (recurrence && recurrence !== "none") return `Cada ${recurrence}`;
  return d.toLocaleDateString("es-SV", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-SV", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DbEvent> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [eventsRes, locsRes] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("starts_at", { ascending: true }),
        supabase
          .from("locations")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("name"),
      ]);
      if (!eventsRes.error && eventsRes.data) setEvents(eventsRes.data as DbEvent[]);
      if (!locsRes.error && locsRes.data) setLocations(locsRes.data as LocationOption[]);
      setLoading(false);
    })();
  }, []);

  const saveEvent = async () => {
    if (!editing?.title || !editing?.starts_at) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        title: editing.title,
        title_es: editing.title_es || editing.title,
        slug:
          editing.slug ||
          (editing.title || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 60),
        description: editing.description || editing.description_es || "",
        description_es: editing.description_es || editing.description || "",
        location_id: editing.location_id || null,
        custom_venue: editing.custom_venue || null,
        starts_at: editing.starts_at,
        ends_at: editing.ends_at || null,
        recurrence: (editing.recurrence || "none") as Recurrence,
        image_url: editing.image_url || null,
        thumbnail_url: editing.image_url || null,
        is_featured: !!editing.is_featured,
        is_published: editing.is_published !== false,
        tags: editing.tags || [],
        rsvp_enabled: !!editing.rsvp_enabled,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("events")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setEvents([data as DbEvent, ...events]);
      } else if (editing.id) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        setEvents(events.map((e) => (e.id === editing.id ? { ...e, ...payload, id: editing.id! } : e)));
      }

      setEditing(null);
      setIsNew(false);
    } catch (err) {
      console.error("Failed to save event:", err);
      alert("Error al guardar: " + (err instanceof Error ? err.message : "unknown"));
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) setEvents(events.filter((e) => e.id !== id));
  };

  const toggleFeatured = async (event: DbEvent) => {
    const supabase = createClient();
    const next = !event.is_featured;
    const { error } = await supabase
      .from("events")
      .update({ is_featured: next })
      .eq("id", event.id);
    if (!error) setEvents(events.map((e) => (e.id === event.id ? { ...e, is_featured: next } : e)));
  };

  const togglePublished = async (event: DbEvent) => {
    const supabase = createClient();
    const next = !event.is_published;
    const { error } = await supabase
      .from("events")
      .update({ is_published: next })
      .eq("id", event.id);
    if (!error) setEvents(events.map((e) => (e.id === event.id ? { ...e, is_published: next } : e)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Eventos</h1>
          <p className="text-[#6B6560]">Administra los eventos del sitio</p>
        </div>
        <button
          onClick={() => {
            setEditing({ ...emptyEvent });
            setIsNew(true);
          }}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Evento
        </button>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Calendar className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8] mb-2">No hay eventos aún</p>
          <button
            onClick={() => {
              setEditing({ ...emptyEvent });
              setIsNew(true);
            }}
            className="text-[#FF6B35] hover:underline"
          >
            Crear tu primer evento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-[#252320] border border-[#3D3936] p-4 flex gap-4 ${
                !event.is_published ? "opacity-50" : ""
              }`}
            >
              <div className="w-32 h-24 bg-[#1F1D1A] flex-shrink-0 overflow-hidden">
                {event.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-[#3D3936]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[#FFF8F0]">{event.title}</h3>
                      {event.is_featured && (
                        <Star className="w-4 h-4 text-[#FFB800] fill-[#FFB800]" />
                      )}
                      {event.recurrence && event.recurrence !== "none" && (
                        <span className="text-xs bg-[#3D3936] text-[#C9A84C] px-2 py-0.5 capitalize">
                          {event.recurrence}
                        </span>
                      )}
                      {(event.tags || []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-[#3D3936] text-[#B8B0A8] px-2 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-[#6B6560] line-clamp-1 mb-2">
                      {event.description_es || event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#6B6560] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatEventDate(event.starts_at, event.recurrence)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatEventTime(event.starts_at)}
                      </span>
                      {event.custom_venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.custom_venue}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleFeatured(event)}
                      className={`p-2 transition ${
                        event.is_featured
                          ? "text-[#FFB800] bg-[#FFB800]/10"
                          : "text-[#6B6560] hover:bg-[#3D3936]"
                      }`}
                      title={event.is_featured ? "Quitar destacado" : "Destacar"}
                    >
                      <Star className={`w-4 h-4 ${event.is_featured ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={() => togglePublished(event)}
                      className={`p-2 transition ${
                        event.is_published
                          ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                          : "bg-[#6B6560]/10 text-[#6B6560]"
                      }`}
                      title={event.is_published ? "Publicado" : "Borrador"}
                    >
                      {event.is_published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(event);
                        setIsNew(false);
                      }}
                      className="p-2 hover:bg-[#3D3936] transition"
                    >
                      <Edit2 className="w-4 h-4 text-[#6B6560]" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3D3936] flex items-center justify-between sticky top-0 bg-[#252320] z-10">
              <h2 className="text-lg font-semibold text-[#FFF8F0]">
                {isNew ? "Nuevo Evento" : "Editar Evento"}
              </h2>
              <button
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
                className="p-2 hover:bg-[#3D3936]"
              >
                <X className="w-5 h-5 text-[#6B6560]" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={editing.title || ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="Noche de Jazz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Descripción (ES)
                </label>
                <textarea
                  value={editing.description_es || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description_es: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Describe el evento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(editing.starts_at)}
                    onChange={(e) =>
                      setEditing({ ...editing, starts_at: fromLocalInput(e.target.value) })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(editing.ends_at)}
                    onChange={(e) =>
                      setEditing({ ...editing, ends_at: fromLocalInput(e.target.value) })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Ubicación
                  </label>
                  <select
                    value={editing.location_id || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, location_id: e.target.value || null })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  >
                    <option value="">— Sin ubicación fija —</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Venue (texto libre)
                  </label>
                  <input
                    type="text"
                    value={editing.custom_venue || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, custom_venue: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="Simmer Down San Benito"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Recurrencia
                  </label>
                  <select
                    value={editing.recurrence || "none"}
                    onChange={(e) =>
                      setEditing({ ...editing, recurrence: e.target.value as Recurrence })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  >
                    <option value="none">Una sola vez</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Tags (coma separados)
                  </label>
                  <input
                    type="text"
                    value={(editing.tags || []).join(", ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="music, live, cover-5"
                  />
                  <p className="text-xs text-[#6B6560] mt-1">
                    Usa <code className="text-[#C9A84C]">cover-5</code> /{" "}
                    <code className="text-[#C9A84C]">preventa-8</code> para mostrar precio
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Imagen del evento
                </label>
                <ImageUpload
                  value={editing.image_url || ""}
                  onChange={(url: string | null) =>
                    setEditing({ ...editing, image_url: url || null })
                  }
                />
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-[#3D3936]">
                <label className="flex items-center gap-2 text-[#B8B0A8] text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editing.is_featured}
                    onChange={(e) =>
                      setEditing({ ...editing, is_featured: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  Destacado (portada eventos)
                </label>
                <label className="flex items-center gap-2 text-[#B8B0A8] text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_published !== false}
                    onChange={(e) =>
                      setEditing({ ...editing, is_published: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  Publicado
                </label>
                <label className="flex items-center gap-2 text-[#B8B0A8] text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editing.rsvp_enabled}
                    onChange={(e) =>
                      setEditing({ ...editing, rsvp_enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  Reservaciones abiertas
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-[#3D3936] flex gap-3 sticky bottom-0 bg-[#252320]">
              <button
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
                className="flex-1 px-4 py-3 border border-[#3D3936] text-[#B8B0A8] hover:bg-[#1F1D1A] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveEvent}
                disabled={saving || !editing.title || !editing.starts_at}
                className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] disabled:cursor-not-allowed text-white px-4 py-3 font-medium flex items-center justify-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
