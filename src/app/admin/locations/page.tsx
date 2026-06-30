"use client";

import { useEffect, useState } from "react";
import {
  Save,
  MapPin,
  Phone,
  Truck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LocationRow {
  id: string;
  name: string;
  slug: string | null;
  address_line1: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  operating_hours: Record<string, unknown> | null;
  is_active: boolean;
  is_accepting_orders: boolean;
  delivery_enabled: boolean;
  delivery_fee: number | null;
  minimum_order_amount: number | null;
  estimated_prep_time_minutes: number | null;
  temporarily_closed: boolean;
  closed_message: string | null;
  image_exterior_url: string | null;
}

interface LocationEditState {
  is_accepting_orders: boolean;
  delivery_enabled: boolean;
  temporarily_closed: boolean;
  closed_message: string;
  delivery_fee: string;
  minimum_order_amount: string;
  estimated_prep_time_minutes: string;
  phone: string;
  whatsapp_number: string;
}

function buildEditState(loc: LocationRow): LocationEditState {
  return {
    is_accepting_orders: loc.is_accepting_orders,
    delivery_enabled: loc.delivery_enabled,
    temporarily_closed: loc.temporarily_closed,
    closed_message: loc.closed_message || "",
    delivery_fee: loc.delivery_fee != null ? String(loc.delivery_fee) : "",
    minimum_order_amount:
      loc.minimum_order_amount != null
        ? String(loc.minimum_order_amount)
        : "",
    estimated_prep_time_minutes:
      loc.estimated_prep_time_minutes != null
        ? String(loc.estimated_prep_time_minutes)
        : "",
    phone: loc.phone || "",
    whatsapp_number: loc.whatsapp_number || "",
  };
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<
    Record<string, LocationEditState>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("locations")
        .select(
          "id, name, slug, address_line1, city, region, phone, email, whatsapp_number, operating_hours, is_active, is_accepting_orders, delivery_enabled, delivery_fee, minimum_order_amount, estimated_prep_time_minutes, temporarily_closed, closed_message, image_exterior_url"
        )
        .order("name", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as LocationRow[];
      setLocations(rows);

      const states: Record<string, LocationEditState> = {};
      for (const loc of rows) {
        states[loc.id] = buildEditState(loc);
      }
      setEditStates(states);
    } catch (err) {
      console.error("[AdminLocations] Error al cargar ubicaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateEditState = (
    id: string,
    updates: Partial<LocationEditState>
  ) => {
    setEditStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  const saveLocation = async (loc: LocationRow) => {
    const state = editStates[loc.id];
    if (!state) return;

    setSavingId(loc.id);
    setSavedId(null);

    try {
      const supabase = createClient();

      const payload: Record<string, unknown> = {
        is_accepting_orders: state.is_accepting_orders,
        delivery_enabled: state.delivery_enabled,
        temporarily_closed: state.temporarily_closed,
        closed_message: state.temporarily_closed
          ? state.closed_message || null
          : null,
        delivery_fee:
          state.delivery_fee !== ""
            ? parseFloat(state.delivery_fee)
            : null,
        minimum_order_amount:
          state.minimum_order_amount !== ""
            ? parseFloat(state.minimum_order_amount)
            : null,
        estimated_prep_time_minutes:
          state.estimated_prep_time_minutes !== ""
            ? parseInt(state.estimated_prep_time_minutes, 10)
            : null,
        phone: state.phone || null,
        whatsapp_number: state.whatsapp_number || null,
      };

      const { error } = await supabase
        .from("locations")
        .update(payload)
        .eq("id", loc.id);

      if (error) throw error;

      setLocations((prev) =>
        prev.map((l) =>
          l.id === loc.id
            ? {
                ...l,
                is_accepting_orders: state.is_accepting_orders,
                delivery_enabled: state.delivery_enabled,
                temporarily_closed: state.temporarily_closed,
                closed_message: state.temporarily_closed
                  ? state.closed_message || null
                  : null,
                delivery_fee:
                  state.delivery_fee !== ""
                    ? parseFloat(state.delivery_fee)
                    : null,
                minimum_order_amount:
                  state.minimum_order_amount !== ""
                    ? parseFloat(state.minimum_order_amount)
                    : null,
                estimated_prep_time_minutes:
                  state.estimated_prep_time_minutes !== ""
                    ? parseInt(state.estimated_prep_time_minutes, 10)
                    : null,
                phone: state.phone || null,
                whatsapp_number: state.whatsapp_number || null,
              }
            : l
        )
      );

      setSavedId(loc.id);
      setTimeout(() => setSavedId(null), 2500);
    } catch (err) {
      console.error("[AdminLocations] Error al guardar:", err);
    } finally {
      setSavingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#FFF8F0]">Ubicaciones</h1>
        <p className="text-[#6B6560]">
          Administra la configuracion de cada sucursal
        </p>
      </div>

      {/* Cargando */}
      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <MapPin className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8]">No hay ubicaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {locations.map((loc) => {
            const state = editStates[loc.id];
            const isExpanded = expandedId === loc.id;

            return (
              <div
                key={loc.id}
                className={`bg-[#252320] border border-[#3D3936] overflow-hidden ${
                  !loc.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Cabecera de tarjeta */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#3D3936]/30 transition"
                  onClick={() => toggleExpand(loc.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#FFF8F0] text-lg">
                        {loc.name}
                      </h3>
                      <p className="text-sm text-[#6B6560]">
                        {[loc.address_line1, loc.city]
                          .filter(Boolean)
                          .join(", ") || "Sin direccion"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Badges de estado */}
                    <div className="hidden sm:flex items-center gap-2">
                      {loc.temporarily_closed && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Cerrado temporal
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 ${
                          loc.is_active
                            ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                            : "bg-[#6B6560]/10 text-[#6B6560]"
                        }`}
                      >
                        {loc.is_active ? "Activo" : "Inactivo"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 ${
                          loc.is_accepting_orders
                            ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                            : "bg-[#6B6560]/10 text-[#6B6560]"
                        }`}
                      >
                        {loc.is_accepting_orders
                          ? "Aceptando ordenes"
                          : "No acepta ordenes"}
                      </span>
                      {loc.delivery_enabled && (
                        <span className="text-xs bg-[#FF6B35]/10 text-[#FF6B35] px-2 py-0.5 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          Delivery
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#6B6560]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#6B6560]" />
                    )}
                  </div>
                </div>

                {/* Panel expandible de edicion */}
                {isExpanded && state && (
                  <div className="border-t border-[#3D3936] p-6 space-y-6">
                    {/* Toggles */}
                    <div>
                      <h4 className="text-sm font-medium text-[#6B6560] mb-4">
                        Estado de operacion
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-[#1F1D1A] border border-[#3D3936] cursor-pointer hover:border-[#6B6560] transition">
                          <div className="flex items-center gap-3">
                            {state.is_accepting_orders ? (
                              <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
                            ) : (
                              <XCircle className="w-5 h-5 text-[#6B6560]" />
                            )}
                            <div>
                              <span className="text-[#FFF8F0] font-medium">
                                Aceptando ordenes
                              </span>
                              <p className="text-xs text-[#6B6560]">
                                Permite recibir nuevas ordenes
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={state.is_accepting_orders}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                is_accepting_orders: e.target.checked,
                              })
                            }
                            className="w-5 h-5 accent-[#FF6B35]"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-[#1F1D1A] border border-[#3D3936] cursor-pointer hover:border-[#6B6560] transition">
                          <div className="flex items-center gap-3">
                            <Truck
                              className={`w-5 h-5 ${
                                state.delivery_enabled
                                  ? "text-[#FF6B35]"
                                  : "text-[#6B6560]"
                              }`}
                            />
                            <div>
                              <span className="text-[#FFF8F0] font-medium">
                                Delivery habilitado
                              </span>
                              <p className="text-xs text-[#6B6560]">
                                Ofrece servicio de entrega a domicilio
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={state.delivery_enabled}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                delivery_enabled: e.target.checked,
                              })
                            }
                            className="w-5 h-5 accent-[#FF6B35]"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-[#1F1D1A] border border-[#3D3936] cursor-pointer hover:border-[#6B6560] transition">
                          <div className="flex items-center gap-3">
                            <AlertTriangle
                              className={`w-5 h-5 ${
                                state.temporarily_closed
                                  ? "text-red-400"
                                  : "text-[#6B6560]"
                              }`}
                            />
                            <div>
                              <span className="text-[#FFF8F0] font-medium">
                                Cerrado temporalmente
                              </span>
                              <p className="text-xs text-[#6B6560]">
                                Marca esta sucursal como temporalmente cerrada
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={state.temporarily_closed}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                temporarily_closed: e.target.checked,
                              })
                            }
                            className="w-5 h-5 accent-[#FF6B35]"
                          />
                        </label>

                        {state.temporarily_closed && (
                          <div className="ml-8">
                            <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                              Mensaje de cierre
                            </label>
                            <input
                              type="text"
                              value={state.closed_message}
                              onChange={(e) =>
                                updateEditState(loc.id, {
                                  closed_message: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                              placeholder="Cerrado por mantenimiento hasta el lunes"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Configuracion de delivery y operacion */}
                    <div>
                      <h4 className="text-sm font-medium text-[#6B6560] mb-4">
                        Configuracion de delivery y operacion
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-[#6B6560]" />
                            Tarifa de delivery ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={state.delivery_fee}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                delivery_fee: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-[#6B6560]" />
                            Orden minima ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={state.minimum_order_amount}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                minimum_order_amount: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#6B6560]" />
                            Tiempo de preparacion (min)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={state.estimated_prep_time_minutes}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                estimated_prep_time_minutes: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                            placeholder="30"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contacto */}
                    <div>
                      <h4 className="text-sm font-medium text-[#6B6560] mb-4">
                        Informacion de contacto
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#6B6560]" />
                            Telefono
                          </label>
                          <input
                            type="tel"
                            value={state.phone}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                            placeholder="+503 2455-4899"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-[#6B6560]" />
                            WhatsApp
                          </label>
                          <input
                            type="tel"
                            value={state.whatsapp_number}
                            onChange={(e) =>
                              updateEditState(loc.id, {
                                whatsapp_number: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                            placeholder="+50312345678"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Boton guardar */}
                    <div className="flex justify-end pt-4 border-t border-[#3D3936]">
                      <button
                        onClick={() => saveLocation(loc)}
                        disabled={savingId === loc.id}
                        className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 font-medium flex items-center gap-2 transition"
                      >
                        {savingId === loc.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                        ) : savedId === loc.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {savedId === loc.id ? "Guardado" : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
