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
  Search,
  Users,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";

// ─────────────────────────────────────────────
// DB types matching the events schema
// ─────────────────────────────────────────────
interface DbEvent {
  id: string;
  title: string;
  title_es: string | null;
  slug: string | null;
  description: string | null;
  description_es: string | null;
  location_id: string | null;
  custom_venue: string | null;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  has_capacity_limit: boolean;
  max_capacity: number | null;
  current_rsvps: number;
  rsvp_enabled: boolean;
  is_featured: boolean;
  is_published: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface LocationOption {
  id: string;
  name: string;
}

type FilterMode = "all" | "published" | "draft" | "featured";

const emptyEvent: Partial<DbEvent> = {
  title: "",
  title_es: "",
  slug: "",
  description: "",
  description_es: "",
  location_id: null,
  custom_venue: "",
  starts_at: "",
  ends_at: "",
  image_url: null,
  thumbnail_url: null,
  has_capacity_limit: false,
  max_capacity: null,
  current_rsvps: 0,
  rsvp_enabled: false,
  is_featured: false,
  is_published: true,
  tags: [],
};

// ─────────────────────────────────────────────
// Helpers: datetime-local <-> ISO
// ─────────────────────────────────────────────
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

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function AdminEventsPage() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<DbEvent> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  // ── Fetch data ──────────────────────────────
  useEffect(() => {
    fetchEvents();
    fetchLocations();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchErr } = await supabase
        .from("events")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("starts_at", { ascending: false });

      if (fetchErr) throw fetchErr;
      setEvents((data as DbEvent[]) || []);
    } catch (err) {
      console.error("[AdminEventsPage] fetchEvents:", err);
      setError("Error al cargar los eventos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchErr } = await supabase
        .from("locations")
        .select("id, name")
        .order("name", { ascending: true });

      if (fetchErr) throw fetchErr;
      setLocations((data as LocationOption[]) || []);
    } catch (err) {
      console.error("[AdminEventsPage] fetchLocations:", err);
    }
  };

  // ── CRUD ────────────────────────────────────
  const saveEvent = async () => {
    if (!editing?.title || !editing?.starts_at) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const payload = {
        title: editing.title,
        title_es: editing.title_es || editing.title,
        slug: editing.slug || generateSlug(editing.title),
        description: editing.description || editing.description_es || "",
        description_es: editing.description_es || editing.description || "",
        location_id: editing.location_id || null,
        custom_venue: editing.custom_venue || null,
        starts_at: editing.starts_at,
        ends_at: editing.ends_at || null,
        image_url: editing.image_url || null,
        thumbnail_url: editing.thumbnail_url || editing.image_url || null,
        has_capacity_limit: !!editing.has_capacity_limit,
        max_capacity: editing.has_capacity_limit
          ? editing.max_capacity || null
          : null,
        rsvp_enabled: !!editing.rsvp_enabled,
        is_featured: !!editing.is_featured,
        is_published: editing.is_published !== false,
        tags: editing.tags || [],
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { data, error: insertErr } = await supabase
          .from("events")
          .insert([payload])
          .select()
          .single();

        if (insertErr) throw insertErr;
        setEvents([data as DbEvent, ...events]);
      } else if (editing.id) {
        const { error: updateErr } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editing.id);

        if (updateErr) throw updateErr;
        setEvents(
          events.map((e) =>
            e.id === editing.id
              ? ({ ...e, ...payload, id: editing.id } as DbEvent)
              : e,
          ),
        );
      }

      setEditing(null);
      setIsNew(false);
    } catch (err) {
      console.error("[AdminEventsPage] saveEvent:", err);
      alert(
        "Error al guardar: " +
          (err instanceof Error ? err.message : "desconocido"),
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("¿Eliminar este evento? Esta acción no se puede deshacer."))
      return;

    try {
      const supabase = createClient();
      const { error: deleteErr } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (deleteErr) throw deleteErr;
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      console.error("[AdminEventsPage] deleteEvent:", err);
      alert("Error al eliminar el evento.");
    }
  };

  const togglePublished = async (event: DbEvent) => {
    try {
      const supabase = createClient();
      const next = !event.is_published;
      const { error: updateErr } = await supabase
        .from("events")
        .update({ is_published: next, updated_at: new Date().toISOString() })
        .eq("id", event.id);

      if (updateErr) throw updateErr;
      setEvents(
        events.map((e) =>
          e.id === event.id ? { ...e, is_published: next } : e,
        ),
      );
    } catch (err) {
      console.error("[AdminEventsPage] togglePublished:", err);
    }
  };

  const toggleFeatured = async (event: DbEvent) => {
    try {
      const supabase = createClient();
      const next = !event.is_featured;
      const { error: updateErr } = await supabase
        .from("events")
        .update({ is_featured: next, updated_at: new Date().toISOString() })
        .eq("id", event.id);

      if (updateErr) throw updateErr;
      setEvents(
        events.map((e) =>
          e.id === event.id ? { ...e, is_featured: next } : e,
        ),
      );
    } catch (err) {
      console.error("[AdminEventsPage] toggleFeatured:", err);
    }
  };

  // ── Filter + Search ─────────────────────────
  const filteredEvents = events.filter((e) => {
    if (filter === "published" && !e.is_published) return false;
    if (filter === "draft" && e.is_published) return false;
    if (filter === "featured" && !e.is_featured) return false;
    if (
      search &&
      !e.title.toLowerCase().includes(search.toLowerCase()) &&
      !(e.title_es || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // ── Location name resolver ──────────────────
  const getLocationName = (locationId: string | null): string | null => {
    if (!locationId) return null;
    const loc = locations.find((l) => l.id === locationId);
    return loc ? loc.name : null;
  };

  // ── Render ──────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Eventos</h1>
          <p className="text-[#6B6560]">
            Gestiona los eventos del restaurante
          </p>
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

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar eventos..."
            className="w-full pl-10 pr-4 py-2 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
          className="bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-4 py-2 focus:border-[#FF6B35] focus:outline-none"
        >
          <option value="all">Todos ({events.length})</option>
          <option value="published">
            Publicados ({events.filter((e) => e.is_published).length})
          </option>
          <option value="draft">
            Borradores ({events.filter((e) => !e.is_published).length})
          </option>
          <option value="featured">
            Destacados ({events.filter((e) => e.is_featured).length})
          </option>
        </select>
      </div>

      {/* Content States */}
      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : error ? (
        <div className="bg-[#252320] border border-red-500/30 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="text-[#FF6B35] hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Calendar className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8] mb-2">No hay eventos aun</p>
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
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <p className="text-[#B8B0A8]">No se encontraron eventos</p>
        </div>
      ) : (
        /* Event Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-[#252320] border border-[#3D3936] overflow-hidden ${
                !event.is_published ? "opacity-60" : ""
              }`}
            >
              {/* Card Image */}
              <div className="relative h-40 bg-[#1F1D1A]">
                {event.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-[#3D3936]" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  {event.is_featured && (
                    <span className="bg-[#FFB800] text-black px-2 py-1 text-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Destacado
                    </span>
                  )}
                  {!event.is_published && (
                    <span className="bg-[#6B6560] text-white px-2 py-1 text-xs font-medium">
                      Borrador
                    </span>
                  )}
                </div>
                {event.rsvp_enabled && (
                  <span className="absolute top-2 right-2 bg-[#4CAF50] text-white px-2 py-1 text-xs font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    RSVP
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h3 className="font-semibold text-[#FFF8F0] text-lg mb-1 truncate">
                  {event.title}
                </h3>
                {event.description_es && (
                  <p className="text-sm text-[#6B6560] line-clamp-2 mb-3">
                    {event.description_es}
                  </p>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-[#6B6560] mb-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    {formatEventDate(event.starts_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {formatEventTime(event.starts_at)}
                    {event.ends_at &&
                      ` - ${formatEventTime(event.ends_at)}`}
                  </span>
                  {(event.custom_venue ||
                    getLocationName(event.location_id)) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {event.custom_venue ||
                        getLocationName(event.location_id)}
                    </span>
                  )}
                  {event.rsvp_enabled && (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      {event.current_rsvps || 0} RSVP
                      {event.has_capacity_limit && event.max_capacity
                        ? ` / ${event.max_capacity} cupos`
                        : "s"}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-[#3D3936] text-[#B8B0A8] px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#3D3936]">
                  <button
                    onClick={() => toggleFeatured(event)}
                    className={`p-2 transition ${
                      event.is_featured
                        ? "text-[#FFB800] bg-[#FFB800]/10"
                        : "text-[#6B6560] hover:bg-[#3D3936]"
                    }`}
                    title={
                      event.is_featured ? "Quitar destacado" : "Destacar"
                    }
                  >
                    <Star
                      className={`w-4 h-4 ${event.is_featured ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => togglePublished(event)}
                    className={`flex-1 py-2 text-xs font-medium transition ${
                      event.is_published
                        ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                        : "bg-[#6B6560]/10 text-[#6B6560]"
                    }`}
                    title={
                      event.is_published
                        ? "Despublicar"
                        : "Publicar"
                    }
                  >
                    {event.is_published ? (
                      <span className="flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" /> Publicado
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <EyeOff className="w-3 h-3" /> Borrador
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(event);
                      setIsNew(false);
                    }}
                    className="p-2 hover:bg-[#3D3936] transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-[#6B6560]" />
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-2 hover:bg-red-500/10 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────── */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Title EN */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Titulo (EN) *
                </label>
                <input
                  type="text"
                  value={editing.title || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="Jazz Night"
                />
              </div>

              {/* Title ES */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Titulo (ES)
                </label>
                <input
                  type="text"
                  value={editing.title_es || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title_es: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="Noche de Jazz"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={editing.slug || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, slug: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="se genera automaticamente del titulo"
                />
                <p className="text-xs text-[#6B6560] mt-1">
                  Dejar vacio para generar automaticamente
                </p>
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Descripcion (EN)
                </label>
                <textarea
                  value={editing.description || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Describe the event..."
                />
              </div>

              {/* Description ES */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Descripcion (ES)
                </label>
                <textarea
                  value={editing.description_es || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      description_es: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Describe el evento..."
                />
              </div>

              {/* Start / End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(editing.starts_at)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        starts_at: fromLocalInput(e.target.value),
                      })
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
                      setEditing({
                        ...editing,
                        ends_at: fromLocalInput(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  />
                </div>
              </div>

              {/* Location + Custom Venue */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Ubicacion
                  </label>
                  <select
                    value={editing.location_id || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        location_id: e.target.value || null,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  >
                    <option value="">-- Sin ubicacion fija --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Venue personalizado
                  </label>
                  <input
                    type="text"
                    value={editing.custom_venue || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        custom_venue: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="Simmer Down San Benito"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Imagen principal
                </label>
                <ImageUpload
                  value={editing.image_url || null}
                  onChange={(url) =>
                    setEditing({ ...editing, image_url: url })
                  }
                  folder="events"
                />
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Miniatura (thumbnail)
                </label>
                <ImageUpload
                  value={editing.thumbnail_url || null}
                  onChange={(url) =>
                    setEditing({ ...editing, thumbnail_url: url })
                  }
                  folder="events"
                />
                <p className="text-xs text-[#6B6560] mt-1">
                  Si no se sube, se usara la imagen principal
                </p>
              </div>

              {/* RSVP + Capacity */}
              <div className="border border-[#3D3936] p-4 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editing.rsvp_enabled}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        rsvp_enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm font-medium text-[#B8B0A8]">
                    Habilitar RSVP / Reservaciones
                  </span>
                </label>

                {editing.rsvp_enabled && (
                  <div className="space-y-4 pl-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editing.has_capacity_limit}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            has_capacity_limit: e.target.checked,
                            max_capacity: e.target.checked
                              ? editing.max_capacity || 50
                              : null,
                          })
                        }
                        className="w-4 h-4 accent-[#FF6B35]"
                      />
                      <span className="text-sm text-[#B8B0A8]">
                        Limitar capacidad
                      </span>
                    </label>

                    {editing.has_capacity_limit && (
                      <div>
                        <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                          Capacidad maxima
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editing.max_capacity || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              max_capacity:
                                parseInt(e.target.value) || null,
                            })
                          }
                          className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                          placeholder="50"
                        />
                      </div>
                    )}

                    {!isNew && (
                      <div className="flex items-center gap-2 text-sm text-[#6B6560]">
                        <Users className="w-4 h-4" />
                        <span>
                          RSVPs actuales: {editing.current_rsvps || 0}
                          {editing.has_capacity_limit &&
                            editing.max_capacity &&
                            ` / ${editing.max_capacity}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Etiquetas (separadas por coma)
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
                  placeholder="musica, en vivo, jazz"
                />
              </div>

              {/* Toggles: Featured + Published */}
              <div className="flex items-center gap-6 pt-2 border-t border-[#3D3936]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editing.is_featured}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        is_featured: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">
                    Destacar en portada
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_published !== false}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        is_published: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">Publicado</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#3D3936] flex justify-end gap-3 sticky bottom-0 bg-[#252320]">
              <button
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
                className="px-4 py-2 text-[#B8B0A8] hover:bg-[#3D3936] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveEvent}
                disabled={saving || !editing.title || !editing.starts_at}
                className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 font-medium flex items-center gap-2 transition"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
