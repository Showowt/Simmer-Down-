"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Tag,
  Calendar,
  Star,
  Percent,
  DollarSign,
  Package,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Special, MenuItem } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";

const discountTypes = [
  { value: "percentage", label: "Porcentaje", icon: Percent },
  { value: "fixed", label: "Precio fijo", icon: DollarSign },
  { value: "bundle", label: "Combo", icon: Package },
];

const daysOfWeek = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

const emptySpecial: Partial<Special> = {
  title: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  original_price: null,
  special_price: null,
  menu_items: [],
  start_date: new Date().toISOString().split("T")[0],
  end_date: null,
  days_of_week: null,
  active: true,
  featured: false,
  image_url: null,
};

export default function AdminSpecialsPage() {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSpecial, setEditingSpecial] = useState<Partial<Special> | null>(
    null,
  );
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "featured"
  >("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSpecials();
    fetchMenuItems();
  }, []);

  const fetchSpecials = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("specials")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSpecials(data || []);
    } catch (err) {
      console.log("Specials table may not exist yet");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price")
        .eq("available", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      console.log("Menu items fetch error");
    }
  };

  const saveSpecial = async () => {
    if (!editingSpecial?.title || !editingSpecial?.discount_value) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const payload = {
        ...editingSpecial,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("specials")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setSpecials([data, ...specials]);
      } else {
        const { error } = await supabase
          .from("specials")
          .update(payload)
          .eq("id", editingSpecial.id);

        if (error) throw error;
        setSpecials(
          specials.map((s) =>
            s.id === editingSpecial.id
              ? ({ ...s, ...editingSpecial } as Special)
              : s,
          ),
        );
      }

      setEditingSpecial(null);
      setIsNew(false);
    } catch (err) {
      console.error("Failed to save special:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSpecial = async (id: string) => {
    if (!confirm("¿Eliminar esta promoción?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("specials").delete().eq("id", id);

      if (error) throw error;
      setSpecials(specials.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete");
    }
  };

  const toggleFeatured = async (special: Special) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("specials")
        .update({ featured: !special.featured })
        .eq("id", special.id);

      if (error) throw error;
      setSpecials(
        specials.map((s) =>
          s.id === special.id ? { ...s, featured: !s.featured } : s,
        ),
      );
    } catch (err) {
      console.error("Failed to update");
    }
  };

  const toggleActive = async (special: Special) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("specials")
        .update({ active: !special.active })
        .eq("id", special.id);

      if (error) throw error;
      setSpecials(
        specials.map((s) =>
          s.id === special.id ? { ...s, active: !s.active } : s,
        ),
      );
    } catch (err) {
      console.error("Failed to update");
    }
  };

  const toggleDay = (day: number) => {
    const currentDays = editingSpecial?.days_of_week || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    setEditingSpecial({
      ...editingSpecial,
      days_of_week: newDays.length > 0 ? newDays : null,
    });
  };

  const toggleMenuItem = (itemId: string) => {
    const currentItems = editingSpecial?.menu_items || [];
    const newItems = currentItems.includes(itemId)
      ? currentItems.filter((id) => id !== itemId)
      : [...currentItems, itemId];
    setEditingSpecial({
      ...editingSpecial,
      menu_items: newItems.length > 0 ? newItems : null,
    });
  };

  const filteredSpecials = specials.filter((s) => {
    if (filter === "active" && !s.active) return false;
    if (filter === "inactive" && s.active) return false;
    if (filter === "featured" && !s.featured) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const getDiscountDisplay = (special: Special) => {
    switch (special.discount_type) {
      case "percentage":
        return `${special.discount_value}% OFF`;
      case "fixed":
        return `$${special.special_price?.toFixed(2)}`;
      case "bundle":
        return "Combo";
      default:
        return "";
    }
  };

  const isSpecialActive = (special: Special): boolean => {
    if (!special.active) return false;
    const now = new Date();
    const start = new Date(special.start_date);
    const end = special.end_date ? new Date(special.end_date) : null;
    if (now < start) return false;
    if (end && now > end) return false;
    if (special.days_of_week && !special.days_of_week.includes(now.getDay()))
      return false;
    return true;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">
            Especiales y Promociones
          </h1>
          <p className="text-[#6B6560]">
            Gestiona ofertas y descuentos especiales
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSpecial(emptySpecial);
            setIsNew(true);
          }}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nueva Promoción
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar promociones..."
            className="w-full pl-10 pr-4 py-2 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-4 py-2 focus:border-[#FF6B35] focus:outline-none"
        >
          <option value="all">Todas ({specials.length})</option>
          <option value="active">
            Activas ({specials.filter((s) => s.active).length})
          </option>
          <option value="inactive">
            Inactivas ({specials.filter((s) => !s.active).length})
          </option>
          <option value="featured">
            Destacadas ({specials.filter((s) => s.featured).length})
          </option>
        </select>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : specials.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Tag className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8] mb-2">No hay promociones aún</p>
          <button
            onClick={() => {
              setEditingSpecial(emptySpecial);
              setIsNew(true);
            }}
            className="text-[#FF6B35] hover:underline"
          >
            Crear tu primera promoción
          </button>
        </div>
      ) : filteredSpecials.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <p className="text-[#B8B0A8]">No se encontraron promociones</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecials.map((special) => (
            <div
              key={special.id}
              className={`bg-[#252320] border border-[#3D3936] overflow-hidden ${
                !special.active ? "opacity-60" : ""
              }`}
            >
              <div className="relative h-40 bg-[#1F1D1A]">
                {special.image_url ? (
                  <img
                    src={special.image_url}
                    alt={special.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-12 h-12 text-[#3D3936]" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className="bg-[#FF6B35] text-white px-3 py-1 text-sm font-bold">
                    {getDiscountDisplay(special)}
                  </span>
                  {special.featured && (
                    <span className="bg-[#FFB800] text-black px-2 py-1 text-sm">
                      <Star className="w-4 h-4" />
                    </span>
                  )}
                </div>
                {isSpecialActive(special) && (
                  <span className="absolute top-2 right-2 bg-[#4CAF50] text-white px-2 py-1 text-xs font-medium">
                    En Vivo
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-[#FFF8F0] text-lg mb-1">
                  {special.title}
                </h3>
                {special.description && (
                  <p className="text-sm text-[#6B6560] line-clamp-2 mb-3">
                    {special.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-[#6B6560] mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(special.start_date).toLocaleDateString("es", {
                      month: "short",
                      day: "numeric",
                    })}
                    {special.end_date &&
                      ` - ${new Date(special.end_date).toLocaleDateString("es", { month: "short", day: "numeric" })}`}
                  </span>
                  {special.days_of_week && (
                    <span className="ml-2">
                      (
                      {special.days_of_week
                        .map((d) => daysOfWeek[d].label)
                        .join(", ")}
                      )
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#3D3936]">
                  <button
                    onClick={() => toggleFeatured(special)}
                    className={`p-2 transition ${
                      special.featured
                        ? "text-[#FFB800] bg-[#FFB800]/10"
                        : "text-[#6B6560] hover:bg-[#3D3936]"
                    }`}
                    title={special.featured ? "Quitar destacado" : "Destacar"}
                  >
                    <Star
                      className={`w-4 h-4 ${special.featured ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => toggleActive(special)}
                    className={`flex-1 py-2 text-xs font-medium transition ${
                      special.active
                        ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                        : "bg-[#6B6560]/10 text-[#6B6560]"
                    }`}
                  >
                    {special.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSpecial(special);
                      setIsNew(false);
                    }}
                    className="p-2 hover:bg-[#3D3936] transition"
                  >
                    <Edit2 className="w-4 h-4 text-[#6B6560]" />
                  </button>
                  <button
                    onClick={() => deleteSpecial(special.id)}
                    className="p-2 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingSpecial && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3D3936] flex items-center justify-between sticky top-0 bg-[#252320]">
              <h2 className="text-lg font-semibold text-[#FFF8F0]">
                {isNew ? "Nueva Promoción" : "Editar Promoción"}
              </h2>
              <button
                onClick={() => {
                  setEditingSpecial(null);
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
                  value={editingSpecial.title || ""}
                  onChange={(e) =>
                    setEditingSpecial({
                      ...editingSpecial,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="2x1 en Pizzas Grandes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingSpecial.description || ""}
                  onChange={(e) =>
                    setEditingSpecial({
                      ...editingSpecial,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={2}
                  placeholder="Lleva 2 pizzas grandes al precio de 1..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Tipo de descuento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {discountTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setEditingSpecial({
                            ...editingSpecial,
                            discount_type:
                              type.value as Special["discount_type"],
                          })
                        }
                        className={`p-3 flex flex-col items-center gap-2 border transition ${
                          editingSpecial.discount_type === type.value
                            ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                            : "border-[#3D3936] text-[#6B6560] hover:border-[#6B6560]"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {editingSpecial.discount_type === "percentage" && (
                  <div>
                    <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                      Descuento (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editingSpecial.discount_value || ""}
                      onChange={(e) =>
                        setEditingSpecial({
                          ...editingSpecial,
                          discount_value: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                      placeholder="20"
                    />
                  </div>
                )}
                {editingSpecial.discount_type === "fixed" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                        Precio original
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingSpecial.original_price || ""}
                        onChange={(e) =>
                          setEditingSpecial({
                            ...editingSpecial,
                            original_price: parseFloat(e.target.value) || null,
                          })
                        }
                        className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                        placeholder="29.99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                        Precio especial *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingSpecial.special_price || ""}
                        onChange={(e) =>
                          setEditingSpecial({
                            ...editingSpecial,
                            special_price: parseFloat(e.target.value) || null,
                            discount_value: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                        placeholder="19.99"
                      />
                    </div>
                  </>
                )}
                {editingSpecial.discount_type === "bundle" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                      Precio del combo *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingSpecial.special_price || ""}
                      onChange={(e) =>
                        setEditingSpecial({
                          ...editingSpecial,
                          special_price: parseFloat(e.target.value) || null,
                          discount_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                      placeholder="24.99"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    value={editingSpecial.start_date || ""}
                    onChange={(e) =>
                      setEditingSpecial({
                        ...editingSpecial,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Fecha fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={editingSpecial.end_date || ""}
                    onChange={(e) =>
                      setEditingSpecial({
                        ...editingSpecial,
                        end_date: e.target.value || null,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Días válidos (vacío = todos los días)
                </label>
                <div className="flex gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition ${
                        editingSpecial.days_of_week?.includes(day.value)
                          ? "bg-[#FF6B35] text-white"
                          : "bg-[#1F1D1A] border border-[#3D3936] text-[#6B6560] hover:border-[#FF6B35]"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {menuItems.length > 0 &&
                editingSpecial.discount_type === "bundle" && (
                  <div>
                    <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                      Items incluidos en el combo
                    </label>
                    <div className="bg-[#1F1D1A] border border-[#3D3936] max-h-40 overflow-y-auto">
                      {menuItems.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-[#3D3936] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={
                              editingSpecial.menu_items?.includes(item.id) ??
                              false
                            }
                            onChange={() => toggleMenuItem(item.id)}
                            className="w-4 h-4 accent-[#FF6B35]"
                          />
                          <span className="text-sm text-[#FFF8F0] flex-1">
                            {item.name}
                          </span>
                          <span className="text-sm text-[#6B6560]">
                            ${item.price.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Imagen promocional
                </label>
                <ImageUpload
                  value={editingSpecial.image_url || null}
                  onChange={(url) =>
                    setEditingSpecial({ ...editingSpecial, image_url: url })
                  }
                  folder="specials"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSpecial.featured ?? false}
                    onChange={(e) =>
                      setEditingSpecial({
                        ...editingSpecial,
                        featured: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">
                    Destacar en homepage
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSpecial.active ?? true}
                    onChange={(e) =>
                      setEditingSpecial({
                        ...editingSpecial,
                        active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">Activo</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-[#3D3936] flex justify-end gap-3 sticky bottom-0 bg-[#252320]">
              <button
                onClick={() => {
                  setEditingSpecial(null);
                  setIsNew(false);
                }}
                className="px-4 py-2 text-[#B8B0A8] hover:bg-[#3D3936] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveSpecial}
                disabled={
                  saving ||
                  !editingSpecial.title ||
                  !editingSpecial.discount_value
                }
                className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 font-medium flex items-center gap-2 transition"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
