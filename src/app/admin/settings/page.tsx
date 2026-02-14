"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Building2,
  Truck,
  Bell,
  Share2,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RestaurantSettings } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";

const defaultSettings: RestaurantSettings = {
  id: "",
  name: "Simmer Down",
  tagline: "Artisan Pizza",
  logo_url: null,
  phone: null,
  email: null,
  min_order_amount: 10,
  delivery_fee: 3,
  free_delivery_threshold: 35,
  tax_rate: 0,
  currency: "USD",
  timezone: "America/El_Salvador",
  social_facebook: null,
  social_instagram: null,
  social_twitter: null,
  social_whatsapp: null,
  notifications_email: true,
  notifications_sms: false,
  notifications_push: true,
  online_ordering_enabled: true,
  delivery_enabled: true,
  pickup_enabled: true,
  created_at: "",
  updated_at: "",
};

type SettingsTab = "restaurant" | "delivery" | "notifications" | "social";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("restaurant");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No settings found, use defaults
          console.log("No settings found, using defaults");
        } else {
          throw fetchError;
        }
      }

      if (data) {
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (err) {
      console.log("Settings table may not exist:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const supabase = createClient();

      const payload = {
        ...settings,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error: updateError } = await supabase
          .from("settings")
          .update(payload)
          .eq("id", settings.id);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("settings")
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) setSettings(data);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(
        "Error al guardar. Verifica que la tabla settings existe en la base de datos.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof RestaurantSettings>(
    key: K,
    value: RestaurantSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: "restaurant", label: "Restaurante", icon: Building2 },
    { key: "delivery", label: "Delivery", icon: Truck },
    { key: "notifications", label: "Notificaciones", icon: Bell },
    { key: "social", label: "Redes Sociales", icon: Share2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Configuracion</h1>
          <p className="text-[#6B6560]">
            Administra la configuracion del restaurante
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 text-white px-6 py-2 font-medium flex items-center gap-2 transition"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Guardado" : "Guardar Cambios"}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#252320] border border-[#3D3936] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-[#FF6B35] text-white"
                  : "text-[#6B6560] hover:text-[#FFF8F0] hover:bg-[#3D3936]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-[#252320] border border-[#3D3936] p-6">
        {activeTab === "restaurant" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Nombre del Restaurante
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => updateSetting("name", e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Eslogan
                </label>
                <input
                  type="text"
                  value={settings.tagline || ""}
                  onChange={(e) =>
                    updateSetting("tagline", e.target.value || null)
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="Artisan Pizza"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                Logo
              </label>
              <ImageUpload
                value={settings.logo_url}
                onChange={(url) => updateSetting("logo_url", url)}
                folder="branding"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={settings.phone || ""}
                  onChange={(e) =>
                    updateSetting("phone", e.target.value || null)
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="+503 2445-5999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) =>
                    updateSetting("email", e.target.value || null)
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="info@simmerdown.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Moneda
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting("currency", e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="SVC">Colon (C)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Zona horaria
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSetting("timezone", e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                >
                  <option value="America/El_Salvador">
                    El Salvador (GMT-6)
                  </option>
                  <option value="America/Guatemala">Guatemala (GMT-6)</option>
                  <option value="America/Bogota">Colombia (GMT-5)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#3D3936] pt-6">
              <h3 className="text-lg font-medium text-[#FFF8F0] mb-4">
                Opciones de servicio
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.online_ordering_enabled}
                    onChange={(e) =>
                      updateSetting("online_ordering_enabled", e.target.checked)
                    }
                    className="w-5 h-5 accent-[#FF6B35]"
                  />
                  <div>
                    <span className="text-[#FFF8F0] font-medium">
                      Ordenes en linea
                    </span>
                    <p className="text-xs text-[#6B6560]">
                      Permite a clientes ordenar desde el sitio web
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.delivery_enabled}
                    onChange={(e) =>
                      updateSetting("delivery_enabled", e.target.checked)
                    }
                    className="w-5 h-5 accent-[#FF6B35]"
                  />
                  <div>
                    <span className="text-[#FFF8F0] font-medium">Delivery</span>
                    <p className="text-xs text-[#6B6560]">
                      Ofrece servicio de entrega a domicilio
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pickup_enabled}
                    onChange={(e) =>
                      updateSetting("pickup_enabled", e.target.checked)
                    }
                    className="w-5 h-5 accent-[#FF6B35]"
                  />
                  <div>
                    <span className="text-[#FFF8F0] font-medium">
                      Recoger en tienda
                    </span>
                    <p className="text-xs text-[#6B6560]">
                      Permite a clientes recoger sus ordenes
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Orden minima ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.min_order_amount}
                  onChange={(e) =>
                    updateSetting(
                      "min_order_amount",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                />
                <p className="text-xs text-[#6B6560] mt-1">
                  Monto minimo para realizar una orden
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Tarifa de delivery ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.delivery_fee}
                  onChange={(e) =>
                    updateSetting(
                      "delivery_fee",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                />
                <p className="text-xs text-[#6B6560] mt-1">
                  Costo base de entrega
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Delivery gratis desde ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.free_delivery_threshold || ""}
                  onChange={(e) =>
                    updateSetting(
                      "free_delivery_threshold",
                      parseFloat(e.target.value) || null,
                    )
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="0 = nunca gratis"
                />
                <p className="text-xs text-[#6B6560] mt-1">
                  Delivery gratis si la orden supera este monto
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                Tasa de impuesto (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.tax_rate}
                onChange={(e) =>
                  updateSetting("tax_rate", parseFloat(e.target.value) || 0)
                }
                className="w-full max-w-xs px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
              />
              <p className="text-xs text-[#6B6560] mt-1">
                IVA u otro impuesto aplicable (0 = sin impuesto)
              </p>
            </div>

            <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 p-4">
              <h4 className="text-[#FF6B35] font-medium mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Resumen de configuracion
              </h4>
              <ul className="text-sm text-[#B8B0A8] space-y-1">
                <li>Orden minima: ${settings.min_order_amount.toFixed(2)}</li>
                <li>Tarifa delivery: ${settings.delivery_fee.toFixed(2)}</li>
                {settings.free_delivery_threshold && (
                  <li>
                    Delivery gratis en ordenes mayores a $
                    {settings.free_delivery_threshold.toFixed(2)}
                  </li>
                )}
                {settings.tax_rate > 0 && (
                  <li>Impuesto: {settings.tax_rate}%</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#FFF8F0] mb-4">
                Canales de notificacion
              </h3>
              <p className="text-sm text-[#6B6560] mb-6">
                Selecciona como deseas recibir notificaciones de nuevas ordenes
                y consultas
              </p>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-[#1F1D1A] border border-[#3D3936] cursor-pointer hover:border-[#6B6560] transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF6B35]/10 flex items-center justify-center">
                      <span className="text-lg">✉️</span>
                    </div>
                    <div>
                      <span className="text-[#FFF8F0] font-medium block">
                        Email
                      </span>
                      <span className="text-xs text-[#6B6560]">
                        Recibe notificaciones por correo electronico
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications_email}
                    onChange={(e) =>
                      updateSetting("notifications_email", e.target.checked)
                    }
                    className="w-5 h-5 accent-[#FF6B35]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-[#1F1D1A] border border-[#3D3936] cursor-pointer hover:border-[#6B6560] transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#4CAF50]/10 flex items-center justify-center">
                      <span className="text-lg">📱</span>
                    </div>
                    <div>
                      <span className="text-[#FFF8F0] font-medium block">
                        SMS
                      </span>
                      <span className="text-xs text-[#6B6560]">
                        Recibe notificaciones por mensaje de texto
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications_sms}
                    onChange={(e) =>
                      updateSetting("notifications_sms", e.target.checked)
                    }
                    className="w-5 h-5 accent-[#FF6B35]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-[#1F1D1A] border border-[#3D3936] cursor-pointer hover:border-[#6B6560] transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FFB800]/10 flex items-center justify-center">
                      <span className="text-lg">🔔</span>
                    </div>
                    <div>
                      <span className="text-[#FFF8F0] font-medium block">
                        Push
                      </span>
                      <span className="text-xs text-[#6B6560]">
                        Recibe notificaciones push en el navegador
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications_push}
                    onChange={(e) =>
                      updateSetting("notifications_push", e.target.checked)
                    }
                    className="w-5 h-5 accent-[#FF6B35]"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-6">
            <p className="text-sm text-[#6B6560]">
              Agrega los enlaces a tus redes sociales. Estos se mostraran en el
              pie de pagina del sitio.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                  <span className="text-lg">📘</span> Facebook
                </label>
                <input
                  type="url"
                  value={settings.social_facebook || ""}
                  onChange={(e) =>
                    updateSetting("social_facebook", e.target.value || null)
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="https://facebook.com/simmerdown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                  <span className="text-lg">📸</span> Instagram
                </label>
                <input
                  type="url"
                  value={settings.social_instagram || ""}
                  onChange={(e) =>
                    updateSetting("social_instagram", e.target.value || null)
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="https://instagram.com/simmerdown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                  <span className="text-lg">🐦</span> Twitter / X
                </label>
                <input
                  type="url"
                  value={settings.social_twitter || ""}
                  onChange={(e) =>
                    updateSetting("social_twitter", e.target.value || null)
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="https://twitter.com/simmerdown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2 flex items-center gap-2">
                  <span className="text-lg">💬</span> WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.social_whatsapp || ""}
                  onChange={(e) =>
                    updateSetting("social_whatsapp", e.target.value || null)
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="+50312345678"
                />
                <p className="text-xs text-[#6B6560] mt-1">
                  Numero de telefono con codigo de pais
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
