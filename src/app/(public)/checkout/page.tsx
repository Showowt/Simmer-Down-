"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  User,
  Mail,
  FileText,
  Truck,
  Store,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  Wallet,
  Tag,
  Clock,
  Check,
  X,
  Loader2,
  Info,
} from "lucide-react";
import Link from "next/link";

import { useCartStore } from "@/store/cart";
import { useI18n, translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface Location {
  id: string;
  name: string;
  slug: string;
  address_line1: string;
  city: string;
  is_accepting_orders: boolean;
  delivery_enabled: boolean;
  delivery_fee: number;
  estimated_prep_time_minutes: number | null;
}

interface AppliedPromo {
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  description: string | null;
}

const fallbackLocations: Location[] = [
  {
    id: "santa-ana",
    name: "Santa Ana",
    slug: "santa-ana",
    address_line1: "1ra Calle Pte y Callejuela Sur Catedral",
    city: "Santa Ana",
    is_accepting_orders: true,
    delivery_enabled: true,
    delivery_fee: 3.99,
    estimated_prep_time_minutes: 20,
  },
  {
    id: "coatepeque",
    name: "Lago de Coatepeque",
    slug: "coatepeque",
    address_line1: "Calle Principal al Lago #119",
    city: "Coatepeque",
    is_accepting_orders: true,
    delivery_enabled: true,
    delivery_fee: 4.99,
    estimated_prep_time_minutes: 25,
  },
  {
    id: "san-benito",
    name: "San Benito",
    slug: "san-benito",
    address_line1: "Boulevard del Hipódromo",
    city: "San Salvador",
    is_accepting_orders: true,
    delivery_enabled: true,
    delivery_fee: 2.99,
    estimated_prep_time_minutes: 20,
  },
  {
    id: "surf-city",
    name: "Surf City",
    slug: "surf-city",
    address_line1: "Hotel Casa Santa Emilia",
    city: "La Libertad",
    is_accepting_orders: true,
    delivery_enabled: true,
    delivery_fee: 5.99,
    estimated_prep_time_minutes: 25,
  },
  {
    id: "simmer-garden",
    name: "Simmer Garden",
    slug: "simmer-garden",
    address_line1: "Kilómetro 91.5, San José La Majada",
    city: "Juayúa, Sonsonate",
    is_accepting_orders: true,
    delivery_enabled: true,
    delivery_fee: 4.99,
    estimated_prep_time_minutes: 25,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [locations, setLocations] = useState<Location[]>(fallbackLocations);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  // Promo code state
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  useEffect(() => {
    setMounted(true);
    async function fetchLocations() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("locations")
          .select(
            "id, name, slug, address_line1, city, is_accepting_orders, delivery_enabled, delivery_fee, estimated_prep_time_minutes",
          )
          .eq("is_active", true)
          .eq("is_accepting_orders", true)
          .order("name");

        if (error) throw error;
        if (data && data.length > 0) {
          setLocations(data);
          setSelectedLocation(data[0].id);
        } else {
          setSelectedLocation(fallbackLocations[0].id);
        }
      } catch {
        setSelectedLocation(fallbackLocations[0].id);
      }
    }
    fetchLocations();
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#2D2A26] pt-32">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#3D3936] w-1/3" />
            <div className="h-48 bg-[#3D3936]" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const subtotal = getSubtotal();
  const currentLocation = locations.find((l) => l.id === selectedLocation);
  const locationDeliveryFee =
    orderType === "delivery" && currentLocation?.delivery_enabled
      ? currentLocation.delivery_fee || 3.99
      : 0;
  const deliveryFee = subtotal >= 25 ? 0 : locationDeliveryFee;
  const discountAmount = appliedPromo?.discount_amount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Delivery/prep time estimate
  const prepTime = currentLocation?.estimated_prep_time_minutes ?? 20;
  const deliveryBuffer = 15;

  const applyPromoCode = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    setPromoError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("promo_codes")
        .select("id, code, discount_type, discount_value, min_order_amount, is_active, expires_at, description")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setPromoError("Codigo no valido o expirado");
        setPromoLoading(false);
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError("Codigo no valido o expirado");
        setPromoLoading(false);
        return;
      }

      // Check minimum order amount
      if (data.min_order_amount && subtotal < data.min_order_amount) {
        setPromoError(`Pedido minimo de $${data.min_order_amount.toFixed(2)} para este codigo`);
        setPromoLoading(false);
        return;
      }

      // Calculate discount
      let calculatedDiscount = 0;
      const discountValue = data.discount_value ?? 0;

      if (data.discount_type === "percent") {
        calculatedDiscount = (subtotal * discountValue) / 100;
      } else {
        // fixed
        calculatedDiscount = discountValue;
      }

      // Never discount more than subtotal
      calculatedDiscount = Math.min(calculatedDiscount, subtotal);

      setAppliedPromo({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: discountValue,
        discount_amount: calculatedDiscount,
        description: data.description,
      });
      setPromoError("");
    } catch {
      setPromoError("Error al validar el codigo. Intenta de nuevo.");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const createOrder = async () => {
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId: selectedLocation,
        orderType,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || null,
        deliveryAddress: orderType === "delivery" ? formData.address : null,
        deliveryCity: orderType === "delivery" ? formData.city : null,
        notes: formData.notes || null,
        promoCode: appliedPromo?.code || null,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          description: i.description || undefined,
        })),
      }),
    });
    const body = await response.json();
    if (!response.ok || !body?.success || !body?.order) {
      const msg =
        Array.isArray(body?.errors) && body.errors.length > 0
          ? body.errors.map((e: { message: string }) => e.message).join(". ")
          : body?.message || "Error al crear el pedido";
      throw new Error(msg);
    }
    return body.order as {
      id: string;
      orderNumber: string;
      total: number;
      subtotal: number;
      deliveryFee: number;
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedLocation) {
      setError(t(translations.checkout.selectLocation));
      setLoading(false);
      return;
    }

    try {
      const order = await createOrder();
      clearCart();
      router.push(`/orders?id=${order.id}&number=${order.orderNumber}`);
    } catch (err) {
      console.error("[CheckoutPage] submit error", err);
      setError(
        err instanceof Error
          ? err.message
          : "Hubo un problema al procesar tu pedido",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[#B8B0A8] hover:text-[#FFF8F0] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t(translations.checkout.backToCart)}
          </Link>
          <h1 className="font-display text-3xl text-[#FFF8F0]">
            {t(translations.checkout.title)}
          </h1>
          <p className="text-[#6B6560]">{t(translations.checkout.completeOrder)}</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[#C73E1D]/10 border border-[#C73E1D]/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-[#C73E1D] flex-shrink-0" />
            <p className="text-[#FFF8F0] text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
              {t(translations.checkout.orderType)}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`p-4 border-2 flex items-center justify-center gap-3 transition-all min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                  orderType === "delivery"
                    ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "border-[#3D3936] text-[#B8B0A8] hover:border-[#6B6560]"
                }`}
              >
                <Truck className="w-5 h-5" />
                <span className="font-medium">{t(translations.checkout.deliveryType)}</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`p-4 border-2 flex items-center justify-center gap-3 transition-all min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                  orderType === "pickup"
                    ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "border-[#3D3936] text-[#B8B0A8] hover:border-[#6B6560]"
                }`}
              >
                <Store className="w-5 h-5" />
                <span className="font-medium">{t(translations.checkout.pickup)}</span>
              </button>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
              {t(translations.checkout.location)}
            </h2>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560] pointer-events-none" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition appearance-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} - {loc.city}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560] pointer-events-none" />
            </div>

            {/* Delivery/Prep Time Estimate */}
            {selectedLocation && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#B8B0A8] bg-[#1F1D1A] border border-[#3D3936] px-4 py-3">
                <Clock className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
                {orderType === "delivery" ? (
                  <span>
                    {t(translations.checkout.estimatedDelivery)}{" "}
                    <span className="text-[#FFF8F0] font-medium">
                      {prepTime}-{prepTime + deliveryBuffer} {t(translations.checkout.min)}
                    </span>
                  </span>
                ) : (
                  <span>
                    {t(translations.checkout.estimatedPrep)}{" "}
                    <span className="text-[#FFF8F0] font-medium">
                      {prepTime}-{prepTime + 10} {t(translations.checkout.min)}
                    </span>
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
              {t(translations.checkout.contactInfo)}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  {t(translations.checkout.name)} *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                    placeholder={t(translations.checkout.yourName)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  {t(translations.checkout.phone)} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                    placeholder="+503 XXXX-XXXX"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  {t(translations.checkout.email)} ({t(translations.checkout.emailOptional)})
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delivery address */}
          {orderType === "delivery" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#252320] border border-[#3D3936] p-6"
            >
              <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
                {t(translations.checkout.deliveryAddress)}
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-[#6B6560]" />
                  <textarea
                    id="address"
                    required
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition resize-none"
                    rows={2}
                    placeholder={t(translations.checkout.addressPlaceholder)}
                  />
                </div>
                <input
                  id="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition"
                  placeholder={t(translations.checkout.city)}
                />
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
              {t(translations.checkout.specialInstructions)}
            </h2>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-[#6B6560]" />
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition resize-none"
                rows={2}
                placeholder={t(translations.checkout.instructionsPlaceholder)}
              />
            </div>
          </motion.div>

          {/* Payment method — cash only (card coming soon via PowerTranz HPP) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
              {t(translations.checkout.paymentMethod)}
            </h2>
            <div className="p-4 border-2 border-[#FF6B35] bg-[#FF6B35]/10 flex items-center gap-3 min-h-[56px]">
              <Wallet className="w-5 h-5 text-[#FF6B35]" />
              <span className="font-medium text-[#FF6B35]">
                {orderType === "delivery"
                  ? t(translations.checkout.payOnDelivery)
                  : t(translations.checkout.payAtStore)}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#B8B0A8]">
              {orderType === "delivery"
                ? "Paga en efectivo o POS al recibir tu pedido / Pay cash or POS on delivery"
                : "Paga en el local al recoger tu pedido / Pay at the store when you pick up"}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#6B6560]">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Pago con tarjeta pr&oacute;ximamente / Card payment coming soon</span>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            <h2 className="font-display text-lg text-[#FFF8F0] mb-4">
              {t(translations.cart.orderSummary)}
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#B8B0A8]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-[#FFF8F0]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-[#3D3936] pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">{t(translations.cart.subtotal)}</span>
                  <span className="text-[#FFF8F0]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">{t(translations.cart.delivery)}</span>
                  <span className="text-[#FFF8F0]">
                    {deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                {orderType === 'delivery' && deliveryFee === 0 && subtotal >= 25 ? (
                  <p className="text-xs text-green-400">
                    Envio gratis en pedidos mayores a $25 / Free delivery on orders over $25
                  </p>
                ) : orderType === 'delivery' && subtotal > 0 && subtotal < 25 ? (
                  <p className="text-xs text-[#6B6560]">
                    Envio gratis en pedidos mayores a $25 / Free delivery on orders over $25
                  </p>
                ) : null}
                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">
                      {t(translations.checkout.discount)} ({appliedPromo.code})
                    </span>
                    <span className="text-green-400">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#3D3936]">
                  <span className="text-[#FFF8F0]">{t(translations.cart.total)}</span>
                  <span className="text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Promo Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-[#252320] border border-[#3D3936] p-6"
          >
            {!appliedPromo ? (
              <>
                <button
                  type="button"
                  onClick={() => setPromoExpanded(!promoExpanded)}
                  className="flex items-center gap-2 text-sm text-[#B8B0A8] hover:text-[#FF6B35] transition-colors w-full"
                >
                  <Tag className="w-4 h-4" />
                  <span>{t(translations.checkout.promoCode)}</span>
                  <ChevronDown
                    className={`w-4 h-4 ml-auto transition-transform ${
                      promoExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {promoExpanded && (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyPromoCode();
                          }
                        }}
                        placeholder={t(translations.checkout.enterCode)}
                        className="flex-1 px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition text-sm uppercase"
                        disabled={promoLoading}
                      />
                      <button
                        type="button"
                        onClick={applyPromoCode}
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-5 py-3 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed min-w-[100px] justify-center"
                      >
                        {promoLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          t(translations.checkout.apply)
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-sm text-[#C73E1D] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {promoError}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">
                    {t(translations.checkout.codeApplied)} — {appliedPromo.code}
                    {appliedPromo.discount_type === "percent"
                      ? ` (-${appliedPromo.discount_value}%)`
                      : ` (-$${appliedPromo.discount_amount.toFixed(2)})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removePromoCode}
                  className="text-[#6B6560] hover:text-[#C73E1D] transition-colors p-1"
                  aria-label={t(translations.checkout.removeCode)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>

          {/* Submit */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] text-white py-4 font-bold text-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2A26] active:scale-[0.98] disabled:cursor-not-allowed min-h-[56px]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                {t(translations.checkout.processing)}
              </>
            ) : (
              <>
                {t(translations.checkout.confirmOrder)} &middot; ${total.toFixed(2)}
              </>
            )}
          </motion.button>
        </form>
      </div>

    </div>
  );
}
