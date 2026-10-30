"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Flame,
  Calendar,
  CalendarCheck,
  MessageSquare,
  MapPin,
  Tag,
  Settings,
  Camera,
  KeyRound,
  Users,
  Gift,
  BedDouble,
  LayoutTemplate,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/reservations", label: "Reservaciones", icon: CalendarCheck },
  { href: "/admin/mesas", label: "Salón · Mesas", icon: MapPin },
  { href: "/admin/habitaciones", label: "Habitaciones", icon: BedDouble },
  { href: "/admin/carta", label: "Carta y Precios", icon: UtensilsCrossed },
  { href: "/admin/contenido", label: "Contenido Web", icon: LayoutTemplate },
  { href: "/admin/fotos", label: "Fotos", icon: Camera },
  { href: "/admin/specials", label: "Especiales", icon: Tag },
  { href: "/admin/events", label: "Eventos", icon: Calendar },
  { href: "/admin/inquiries", label: "Consultas", icon: MessageSquare },
  { href: "/admin/simmerlovers", label: "SimmerLovers", icon: Flame },
  { href: "/admin/premios", label: "Premios y Puntos", icon: Gift },
  { href: "/admin/locations", label: "Ubicaciones", icon: MapPin },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Pending estadía requests — a request the Telegram missed still gets seen
  // here on the next login. Refreshes on every in-admin navigation; fail-soft.
  const [roomPending, setRoomPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/room-bookings?count=pending", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && typeof j?.data?.pending === "number") setRoomPending(j.data.pending);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[#1F1D1A]">
      {/* Mobile header */}
      <div className="lg:hidden bg-[#252320] border-b border-[#3D3936] px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg text-[#FFF8F0] flex items-center gap-2">
          <Flame className="w-6 h-6 text-[#FF6B35]" /> Admin
        </span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[#FFF8F0]"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#252320] border-r border-[#3D3936] transform transition-transform lg:transform-none flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-6 border-b border-[#3D3936] hidden lg:block flex-shrink-0">
            <Link href="/admin" className="flex items-center gap-2">
              <Flame className="w-7 h-7 text-[#FF6B35]" />
              <span className="font-bold text-xl text-[#FFF8F0]">
                Simmer Down
              </span>
            </Link>
            <p className="text-sm text-[#6B6560] mt-1">
              Panel de Administración
            </p>
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition ${
                    isActive
                      ? "bg-[#FF6B35] text-white"
                      : "text-[#B8B0A8] hover:bg-[#3D3936] hover:text-[#FFF8F0]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {item.href === "/admin/habitaciones" && roomPending > 0 ? (
                    <span
                      className={`ml-auto text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                        isActive ? "bg-white/20 text-white" : "bg-[#FFB800]/15 text-[#FFB800]"
                      }`}
                    >
                      {roomPending}
                    </span>
                  ) : (
                    isActive && <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-[#3D3936]">
            <div className="px-4 py-2 mb-2">
              <p className="text-xs text-[#6B6560]">Conectado como</p>
              <p className="text-sm text-[#B8B0A8] truncate">{userEmail}</p>
            </div>
            <Link
              href="/auth/reset-password"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 w-full text-[#B8B0A8] hover:bg-[#3D3936] hover:text-[#FFF8F0] transition"
            >
              <KeyRound className="w-5 h-5" />
              Cambiar Contraseña
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-[#B8B0A8] hover:bg-[#3D3936] hover:text-[#FFF8F0] transition"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 w-full text-[#6B6560] hover:text-[#B8B0A8] text-sm transition mt-2"
            >
              ← Volver al Sitio
            </Link>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
