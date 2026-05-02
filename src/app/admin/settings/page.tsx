"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Settings,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SettingRow {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string | null;
}

type ValueType = "string" | "number" | "boolean" | "json";

function detectValueType(value: unknown): ValueType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return "json";
  }
  if (Array.isArray(value)) return "json";
  return "string";
}

function formatValueForEdit(value: unknown, type: ValueType): string {
  if (value === null || value === undefined) return "";
  if (type === "json") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function parseEditedValue(raw: string, type: ValueType): unknown {
  if (type === "boolean") return raw === "true";
  if (type === "number") {
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  }
  if (type === "json") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

interface EditableSettingState {
  editValue: string;
  type: ValueType;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editStates, setEditStates] = useState<
    Record<string, EditableSettingState>
  >({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("settings")
        .select("key, value, description, updated_at")
        .order("key", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as SettingRow[];
      setSettings(rows);

      const states: Record<string, EditableSettingState> = {};
      for (const row of rows) {
        const type = detectValueType(row.value);
        states[row.key] = {
          editValue: formatValueForEdit(row.value, type),
          type,
          saving: false,
          saved: false,
          error: null,
        };
      }
      setEditStates(states);
    } catch (err) {
      console.error("[AdminSettings] Error al cargar configuracion:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateEditState = (
    key: string,
    updates: Partial<EditableSettingState>
  ) => {
    setEditStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const saveSetting = async (row: SettingRow) => {
    const state = editStates[row.key];
    if (!state) return;

    updateEditState(row.key, { saving: true, error: null, saved: false });

    try {
      const supabase = createClient();
      const parsedValue = parseEditedValue(state.editValue, state.type);

      const { error } = await supabase
        .from("settings")
        .update({
          value: parsedValue,
          updated_at: new Date().toISOString(),
        })
        .eq("key", row.key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) =>
          s.key === row.key
            ? { ...s, value: parsedValue, updated_at: new Date().toISOString() }
            : s
        )
      );

      updateEditState(row.key, { saving: false, saved: true });
      setTimeout(
        () => updateEditState(row.key, { saved: false }),
        2500
      );
    } catch (err) {
      console.error("[AdminSettings] Error al guardar:", err);
      updateEditState(row.key, {
        saving: false,
        error:
          err instanceof Error
            ? err.message
            : "Error al guardar esta configuracion",
      });
    }
  };

  const toggleBoolean = async (row: SettingRow) => {
    const state = editStates[row.key];
    if (!state || state.type !== "boolean") return;

    const newVal = state.editValue !== "true";
    updateEditState(row.key, {
      editValue: String(newVal),
      saving: true,
      error: null,
      saved: false,
    });

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("settings")
        .update({
          value: newVal,
          updated_at: new Date().toISOString(),
        })
        .eq("key", row.key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) =>
          s.key === row.key
            ? { ...s, value: newVal, updated_at: new Date().toISOString() }
            : s
        )
      );

      updateEditState(row.key, { saving: false, saved: true });
      setTimeout(
        () => updateEditState(row.key, { saved: false }),
        2500
      );
    } catch (err) {
      console.error("[AdminSettings] Error al guardar:", err);
      updateEditState(row.key, {
        editValue: String(!newVal),
        saving: false,
        error:
          err instanceof Error
            ? err.message
            : "Error al guardar",
      });
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#FFF8F0]">Configuracion</h1>
        <p className="text-[#6B6560]">
          Ajustes generales del sistema
        </p>
      </div>

      {/* Cargando */}
      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : settings.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Settings className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8]">No hay configuraciones registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((row) => {
            const state = editStates[row.key];
            if (!state) return null;

            return (
              <div
                key={row.key}
                className="bg-[#252320] border border-[#3D3936] p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Clave y descripcion */}
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-[#FF6B35] text-sm font-mono bg-[#FF6B35]/10 px-2 py-0.5">
                        {row.key}
                      </code>
                      <span className="text-xs text-[#6B6560] uppercase">
                        {state.type === "json"
                          ? "JSON"
                          : state.type === "boolean"
                          ? "Booleano"
                          : state.type === "number"
                          ? "Numero"
                          : "Texto"}
                      </span>
                    </div>
                    {row.description && (
                      <p className="text-sm text-[#6B6560] mb-3">
                        {row.description}
                      </p>
                    )}
                    {row.updated_at && (
                      <p className="text-xs text-[#6B6560]/60 mb-3">
                        Ultima actualizacion:{" "}
                        {new Date(row.updated_at).toLocaleString("es", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}

                    {/* Campo de edicion segun tipo */}
                    {state.type === "boolean" ? (
                      <button
                        onClick={() => toggleBoolean(row)}
                        disabled={state.saving}
                        className="flex items-center gap-3 group disabled:opacity-50"
                      >
                        {state.editValue === "true" ? (
                          <ToggleRight className="w-10 h-6 text-[#4CAF50]" />
                        ) : (
                          <ToggleLeft className="w-10 h-6 text-[#6B6560]" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            state.editValue === "true"
                              ? "text-[#4CAF50]"
                              : "text-[#6B6560]"
                          }`}
                        >
                          {state.editValue === "true"
                            ? "Activado"
                            : "Desactivado"}
                        </span>
                        {state.saving && (
                          <div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent animate-spin" />
                        )}
                        {state.saved && (
                          <Check className="w-4 h-4 text-[#4CAF50]" />
                        )}
                      </button>
                    ) : state.type === "number" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="any"
                          value={state.editValue}
                          onChange={(e) =>
                            updateEditState(row.key, {
                              editValue: e.target.value,
                            })
                          }
                          className="w-full max-w-xs px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none font-mono"
                        />
                        <button
                          onClick={() => saveSetting(row)}
                          disabled={state.saving}
                          className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 font-medium flex items-center gap-2 transition flex-shrink-0"
                        >
                          {state.saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                          ) : state.saved ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : state.type === "json" ? (
                      <div className="space-y-2">
                        <textarea
                          value={state.editValue}
                          onChange={(e) =>
                            updateEditState(row.key, {
                              editValue: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none font-mono text-sm resize-y"
                          rows={Math.min(
                            Math.max(state.editValue.split("\n").length, 3),
                            12
                          )}
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => saveSetting(row)}
                            disabled={state.saving}
                            className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 font-medium flex items-center gap-2 transition text-sm"
                          >
                            {state.saving ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                            ) : state.saved ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {state.saved ? "Guardado" : "Guardar"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* string */
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={state.editValue}
                          onChange={(e) =>
                            updateEditState(row.key, {
                              editValue: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                        />
                        <button
                          onClick={() => saveSetting(row)}
                          disabled={state.saving}
                          className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 font-medium flex items-center gap-2 transition flex-shrink-0"
                        >
                          {state.saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                          ) : state.saved ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Error */}
                    {state.error && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {state.error}
                      </div>
                    )}
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
