"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  KeyRound,
  Check,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Copy,
} from "lucide-react";

interface StaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "owner", label: "Propietario" },
  { value: "manager", label: "Gerente" },
  { value: "location_manager", label: "Gerente de sucursal" },
  { value: "staff", label: "Personal" },
];

const roleLabel = (r: string | null) =>
  ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r ?? "—";

function genPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const pick = (set: string, n: number) => {
    const out: string[] = [];
    const rnd = new Uint32Array(n);
    crypto.getRandomValues(rnd);
    for (let i = 0; i < n; i++) out.push(set[rnd[i] % set.length]);
    return out;
  };
  // Guarantee at least one uppercase + one digit, then fill to length 12.
  const chars = [...pick(upper, 1), ...pick(digits, 1), ...pick(all, 10)];
  // Fisher–Yates shuffle with crypto randomness.
  for (let i = chars.length - 1; i > 0; i--) {
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const passwordOk = (p: string) => p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);

function fmtDate(s: string | null): string {
  if (!s) return "Nunca";
  return new Date(s).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [resetFor, setResetFor] = useState<StaffUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al cargar");
      setUsers(json.data ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (kind: "ok" | "err", msg: string) => {
    setBanner({ kind, msg });
    setTimeout(() => setBanner(null), 4000);
  };

  const toggleActive = async (u: StaffUser) => {
    setBusyId(u.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          staffId: u.id,
          isActive: !u.is_active,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error");
      flash("ok", json.message);
      await load();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF6B35]" /> Usuarios
          </h1>
          <p className="text-[#6B6560]">
            Accesos al panel de administración
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2.5 text-[#B8B0A8] border border-[#3D3936] hover:bg-[#3D3936] transition"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2.5 font-medium transition"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Flash banner */}
      {banner && (
        <div
          className={`mb-4 p-3 border flex items-center gap-2 text-sm ${
            banner.kind === "ok"
              ? "bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#4CAF50]"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {banner.kind === "ok" ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {banner.msg}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : loadError ? (
        <div className="bg-[#252320] border border-red-500/30 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-[#B8B0A8] mb-4">{loadError}</p>
          <button
            onClick={load}
            className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium transition"
          >
            Reintentar
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Users className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8]">Aún no hay usuarios registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-[#252320] border border-[#3D3936] p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#FFF8F0] font-medium">
                    {u.first_name} {u.last_name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5">
                    <ShieldCheck className="w-3 h-3" /> {roleLabel(u.role)}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 ${
                      u.is_active
                        ? "text-[#4CAF50] bg-[#4CAF50]/10"
                        : "text-[#6B6560] bg-[#6B6560]/10"
                    }`}
                  >
                    {u.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-sm text-[#B8B0A8] truncate mt-0.5">{u.email}</p>
                <p className="text-xs text-[#6B6560] mt-0.5">
                  Último ingreso: {fmtDate(u.last_login_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setResetFor(u)}
                  className="flex items-center gap-2 text-sm px-3 py-2 text-[#B8B0A8] border border-[#3D3936] hover:bg-[#3D3936] transition"
                >
                  <KeyRound className="w-4 h-4" /> Contraseña
                </button>
                <button
                  onClick={() => toggleActive(u)}
                  disabled={busyId === u.id}
                  className={`text-sm px-3 py-2 font-medium transition disabled:opacity-50 ${
                    u.is_active
                      ? "text-red-400 border border-red-500/30 hover:bg-red-500/10"
                      : "text-[#4CAF50] border border-[#4CAF50]/30 hover:bg-[#4CAF50]/10"
                  }`}
                >
                  {busyId === u.id
                    ? "..."
                    : u.is_active
                    ? "Desactivar"
                    : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(msg) => {
            setShowCreate(false);
            flash("ok", msg);
            load();
          }}
        />
      )}

      {resetFor && (
        <ResetPasswordModal
          user={resetFor}
          onClose={() => setResetFor(null)}
          onDone={(msg) => {
            setResetFor(null);
            flash("ok", msg);
          }}
        />
      )}
    </div>
  );
}

// ── Create-user modal ─────────────────────────────────────────
function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (msg: string) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    /\S+@\S+\.\S+/.test(email) &&
    passwordOk(password);

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          role,
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al crear");
      onCreated(json.message || "Usuario creado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Nuevo Usuario" onClose={onClose}>
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nombre">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputCls}
            placeholder="María"
          />
        </Field>
        <Field label="Apellido">
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputCls}
            placeholder="Pérez"
          />
        </Field>
      </div>
      <Field label="Correo (para iniciar sesión)">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="persona@grupokase.com"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Teléfono (opcional)">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            placeholder="7000-0000"
          />
        </Field>
        <Field label="Rol">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputCls}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Contraseña temporal">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="Mínimo 8, una mayúscula y un número"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#B8B0A8]"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setPassword(genPassword());
              setShowPw(true);
            }}
            className="px-3 text-sm text-[#FF6B35] border border-[#FF6B35]/30 hover:bg-[#FF6B35]/10 transition whitespace-nowrap"
          >
            Generar
          </button>
          <button
            type="button"
            disabled={!password}
            onClick={() => {
              navigator.clipboard?.writeText(password);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="px-3 text-sm text-[#B8B0A8] border border-[#3D3936] hover:bg-[#3D3936] transition disabled:opacity-40"
            title="Copiar"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-[#6B6560] mt-1.5">
          Comparte la contraseña con la persona (WhatsApp). Podrá cambiarla en el
          panel con “Cambiar Contraseña”.
        </p>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-[#B8B0A8] hover:text-[#FFF8F0] transition"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={!canSubmit || saving}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 font-medium flex items-center gap-2 transition"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          Crear Usuario
        </button>
      </div>
    </ModalShell>
  );
}

// ── Reset-password modal ──────────────────────────────────────
function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: StaffUser;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          staffId: user.id,
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error");
      onDone(json.message || "Contraseña actualizada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Contraseña · ${user.first_name} ${user.last_name}`}
      onClose={onClose}
    >
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      <Field label="Nueva contraseña">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="Mínimo 8, una mayúscula y un número"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#B8B0A8]"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setPassword(genPassword());
              setShowPw(true);
            }}
            className="px-3 text-sm text-[#FF6B35] border border-[#FF6B35]/30 hover:bg-[#FF6B35]/10 transition whitespace-nowrap"
          >
            Generar
          </button>
          <button
            type="button"
            disabled={!password}
            onClick={() => {
              navigator.clipboard?.writeText(password);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="px-3 text-sm text-[#B8B0A8] border border-[#3D3936] hover:bg-[#3D3936] transition disabled:opacity-40"
            title="Copiar"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-[#B8B0A8] hover:text-[#FFF8F0] transition"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={!passwordOk(password) || saving}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 font-medium flex items-center gap-2 transition"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          Guardar
        </button>
      </div>
    </ModalShell>
  );
}

// ── Small shared UI bits ──────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:border-[#FF6B35] focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-[#B8B0A8] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#252320] border border-[#3D3936] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#3D3936] sticky top-0 bg-[#252320]">
          <h2 className="text-lg font-bold text-[#FFF8F0]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#6B6560] hover:text-[#FFF8F0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}
