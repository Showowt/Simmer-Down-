"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Check,
  X,
  UtensilsCrossed,
  UserX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LOCATIONS } from "@/lib/data";

interface Reservation {
  id: string;
  location_id: string | null;
  date: string; // YYYY-MM-DD
  time: string | null;
  guest_count: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  special_requests: string | null;
  status: string | null;
  created_at: string | null;
}

type Filter = "upcoming" | "today" | "past" | "all";

const SV_TZ = "America/El_Salvador";

// SV-local YYYY-MM-DD for "today"
function svToday(): string {
  const shifted = new Date(Date.now() - 6 * 3600 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function locationName(id: string | null): string {
  if (!id) return "—";
  const loc = LOCATIONS.find((l) => l.id === id || l.slug === id);
  return loc?.shortName || loc?.name || id;
}

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: SV_TZ,
  }).format(new Date(`${d}T12:00:00Z`));
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20" },
  confirmed: { label: "Confirmada", cls: "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20" },
  seated: { label: "Sentada", cls: "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20" },
  cancelled: { label: "Cancelada", cls: "bg-[#C73E1D]/10 text-[#C73E1D] border-[#C73E1D]/20" },
  no_show: { label: "No llegó", cls: "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20" },
};

export default function AdminReservationsPage() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (error) throw error;
      setRows((data as Reservation[]) || []);
      setError(null);
    } catch {
      setError("No se pudieron cargar las reservaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
    const supabase = createClient();
    const ch = supabase
      .channel("reservations-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () =>
        fetchReservations(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchReservations]);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    // optimistic
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reservations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    } catch {
      setError("No se pudo actualizar. Reintenta.");
      fetchReservations();
    } finally {
      setBusyId(null);
    }
  };

  const today = svToday();
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "all") return true;
      if (filter === "today") return r.date === today;
      if (filter === "upcoming") return r.date >= today && r.status !== "cancelled";
      if (filter === "past") return r.date < today;
      return true;
    });
  }, [rows, filter, today]);

  const stats = useMemo(() => {
    const todays = rows.filter((r) => r.date === today && r.status !== "cancelled");
    const upcoming = rows.filter((r) => r.date >= today && r.status !== "cancelled");
    const covers = todays.reduce((s, r) => s + (r.guest_count || 0), 0);
    return { today: todays.length, covers, upcoming: upcoming.length, total: rows.length };
  }, [rows, today]);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "upcoming", label: "Próximas" },
    { id: "today", label: "Hoy" },
    { id: "past", label: "Pasadas" },
    { id: "all", label: "Todas" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#FF6B35]" /> Reservaciones
          </h1>
          <p className="text-[#6B6560]">Log completo · se actualiza en vivo</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Reservas hoy", value: stats.today, sub: `${stats.covers} personas` },
          { label: "Próximas", value: stats.upcoming, sub: "activas" },
          { label: "Total histórico", value: stats.total, sub: "reservaciones" },
          { label: "En vivo", value: "●", sub: "actualización automática", live: true },
        ].map((s, i) => (
          <div key={i} className="bg-[#252320] border border-[#3D3936] p-5">
            <p
              className={`text-2xl font-bold tabular-nums ${s.live ? "text-[#4CAF50]" : "text-[#FFF8F0]"}`}
            >
              {s.value}
            </p>
            <p className="text-sm text-[#FFF8F0] mt-1">{s.label}</p>
            <p className="text-xs text-[#6B6560]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 text-sm font-medium border transition ${
              filter === f.id
                ? "bg-[#FF6B35] border-[#FF6B35] text-white"
                : "bg-[#252320] border-[#3D3936] text-[#B8B0A8] hover:border-[#FF6B35]/50"
            }`}
          >
            {f.label}
            {f.id === "upcoming" && ` (${stats.upcoming})`}
            {f.id === "today" && ` (${stats.today})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : error ? (
        <div className="bg-[#252320] border border-red-500/30 p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <CalendarCheck className="w-12 h-12 text-[#6B6560] mx-auto mb-3" />
          <p className="text-[#B8B0A8]">No hay reservaciones en esta vista.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const st = STATUS[r.status || "confirmed"] || STATUS.confirmed;
            const isCancelled = r.status === "cancelled" || r.status === "no_show";
            return (
              <div
                key={r.id}
                className={`bg-[#252320] border border-[#3D3936] p-5 ${isCancelled ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* When */}
                  <div className="lg:w-48 shrink-0">
                    <p className="text-[#FFF8F0] font-semibold capitalize">{fmtDate(r.date)}</p>
                    <div className="flex items-center gap-3 text-sm text-[#B8B0A8] mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {r.time || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {r.guest_count ?? "—"}
                      </span>
                    </div>
                  </div>

                  {/* Who */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#FFF8F0] font-medium">{r.customer_name || "—"}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B6560] mt-1">
                      {r.customer_phone && (
                        <a href={`tel:${r.customer_phone}`} className="flex items-center gap-1 text-[#FF6B35] hover:underline">
                          <Phone className="w-3.5 h-3.5" /> {r.customer_phone}
                        </a>
                      )}
                      {r.customer_email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3.5 h-3.5" /> {r.customer_email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {locationName(r.location_id)}
                      </span>
                    </div>
                    {r.special_requests && (
                      <p className="flex items-start gap-1.5 text-sm text-[#FBBF24] mt-2">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        {r.special_requests}
                      </p>
                    )}
                  </div>

                  {/* Status + actions */}
                  <div className="lg:w-64 shrink-0 flex flex-col gap-2 lg:items-end">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium border ${st.cls}`}>
                      {st.label}
                    </span>
                    <div className="flex gap-1.5 flex-wrap lg:justify-end">
                      {r.status !== "confirmed" && (
                        <button
                          onClick={() => updateStatus(r.id, "confirmed")}
                          disabled={busyId === r.id}
                          title="Confirmar"
                          className="p-2 bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20 border border-[#4CAF50]/20 transition disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {r.status !== "seated" && (
                        <button
                          onClick={() => updateStatus(r.id, "seated")}
                          disabled={busyId === r.id}
                          title="Marcar como sentada"
                          className="p-2 bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20 border border-[#FF6B35]/20 transition disabled:opacity-50"
                        >
                          <UtensilsCrossed className="w-4 h-4" />
                        </button>
                      )}
                      {r.status !== "no_show" && (
                        <button
                          onClick={() => updateStatus(r.id, "no_show")}
                          disabled={busyId === r.id}
                          title="No llegó"
                          className="p-2 bg-[#6B6560]/10 text-[#B8B0A8] hover:bg-[#6B6560]/20 border border-[#6B6560]/20 transition disabled:opacity-50"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      {r.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(r.id, "cancelled")}
                          disabled={busyId === r.id}
                          title="Cancelar"
                          className="p-2 bg-[#C73E1D]/10 text-[#C73E1D] hover:bg-[#C73E1D]/20 border border-[#C73E1D]/20 transition disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
