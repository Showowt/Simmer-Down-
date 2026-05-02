'use client';

/**
 * SpecialsManager — client-side CRUD UI for /admin/specials.
 * Drop 009 — template pattern. Replicate for events/inquiries/locations/settings.
 */

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

type Special = {
  id: string;
  title: string;
  description: string | null;
  discount_type: 'percent' | 'fixed' | 'combo';
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  image_url: string | null;
  location_ids: string[] | null;
  created_at: string;
};

type Props = {
  initialSpecials: Special[];
  locations: { id: string; name: string }[];
};

export default function SpecialsManager({ initialSpecials, locations }: Props) {
  const supabase = createClient();
  const [specials, setSpecials] = useState(initialSpecials);
  const [editing, setEditing] = useState<Special | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = async () => {
    const { data } = await supabase
      .from('specials')
      .select('*')
      .order('active', { ascending: false })
      .order('created_at', { ascending: false });
    setSpecials((data as Special[]) ?? []);
  };

  const toggleActive = (special: Special) => {
    startTransition(async () => {
      await supabase
        .from('specials')
        .update({ active: !special.active })
        .eq('id', special.id);
      await refresh();
    });
  };

  const remove = async (special: Special) => {
    if (!confirm(`¿Eliminar la promoción "${special.title}"? Esta acción no se puede deshacer.`)) return;
    await supabase.from('specials').delete().eq('id', special.id);
    await refresh();
  };

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-[#E85D04] hover:bg-[#d45503] text-white font-semibold rounded-lg px-4 py-2"
        >
          + Nueva promoción
        </button>
      </div>

      {showForm && (
        <SpecialForm
          special={editing}
          locations={locations}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async () => { setShowForm(false); setEditing(null); await refresh(); }}
        />
      )}

      <div className="grid gap-3">
        {specials.length === 0 && (
          <p className="text-neutral-500 text-sm">Todavía no hay promociones.</p>
        )}

        {specials.map((s) => {
          const scope = s.location_ids
            ? s.location_ids.length + ' ubicaciones'
            : 'Todas las ubicaciones';
          return (
            <div
              key={s.id}
              className={`bg-neutral-900 border rounded-xl p-4 flex items-start justify-between gap-4 ${
                s.active ? 'border-[#E85D04]/40' : 'border-neutral-800 opacity-60'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{s.title}</h3>
                  <span className="text-xs text-neutral-500">· {scope}</span>
                  {s.active && (
                    <span className="text-xs bg-green-500/10 text-green-400 rounded-full px-2 py-0.5">
                      Activa
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-400">{s.description}</p>
                <p className="text-sm text-[#E85D04] mt-1">
                  {s.discount_type === 'percent'
                    ? `${s.discount_value}% de descuento`
                    : s.discount_type === 'fixed'
                      ? `$${s.discount_value} de descuento`
                      : 'Combo especial'}
                </p>
                {(s.starts_at || s.ends_at) && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {s.starts_at && `Desde ${new Date(s.starts_at).toLocaleDateString('es-SV')}`}
                    {s.starts_at && s.ends_at && ' · '}
                    {s.ends_at && `Hasta ${new Date(s.ends_at).toLocaleDateString('es-SV')}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(s)}
                  className="text-xs bg-neutral-800 hover:bg-neutral-700 rounded px-3 py-1.5"
                >
                  {s.active ? 'Pausar' : 'Activar'}
                </button>
                <button
                  onClick={() => { setEditing(s); setShowForm(true); }}
                  className="text-xs bg-neutral-800 hover:bg-neutral-700 rounded px-3 py-1.5"
                >
                  Editar
                </button>
                <button
                  onClick={() => remove(s)}
                  className="text-xs text-red-400 hover:bg-red-500/10 rounded px-3 py-1.5"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────── FORM ───────────────────────────

function SpecialForm({
  special,
  locations,
  onClose,
  onSaved,
}: {
  special: Special | null;
  locations: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({
    title: special?.title ?? '',
    description: special?.description ?? '',
    discount_type: special?.discount_type ?? 'percent',
    discount_value: special?.discount_value ?? 10,
    starts_at: special?.starts_at?.slice(0, 16) ?? '',
    ends_at: special?.ends_at?.slice(0, 16) ?? '',
    active: special?.active ?? true,
    location_ids: special?.location_ids ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      active: form.active,
      location_ids: form.location_ids && form.location_ids.length ? form.location_ids : null,
    };

    const { error } = special
      ? await supabase.from('specials').update(payload).eq('id', special.id)
      : await supabase.from('specials').insert(payload);

    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onSaved();
  };

  const toggleLocation = (id: string) => {
    setForm((f) => {
      const current = f.location_ids ?? [];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...f, location_ids: next.length === 0 ? null : next };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="font-[Bebas_Neue] text-2xl mb-4">
          {special ? 'Editar promoción' : 'Nueva promoción'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Título *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              placeholder="2x1 en pizzas medianas"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Descripción</label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              rows={3}
              placeholder="Válido de lunes a jueves…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Tipo de descuento</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as Special['discount_type'] })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
                <option value="combo">Combo especial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Valor</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Inicia</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Termina</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-2">
              Ubicaciones ({form.location_ids ? `${form.location_ids.length} seleccionadas` : 'Todas'})
            </label>
            <div className="grid grid-cols-2 gap-2">
              {locations.map((l) => (
                <label key={l.id} className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.location_ids ?? []).includes(l.id)}
                    onChange={() => toggleLocation(l.id)}
                  />
                  <span className="text-sm">{l.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Si no seleccionás ninguna, la promoción aplica a todas las ubicaciones.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="text-sm">Activa</span>
          </label>

          {err && <div className="bg-red-950/50 border border-red-900 rounded-lg p-3 text-sm text-red-300">{err}</div>}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button type="button" onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 rounded-lg px-4 py-2 text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="bg-[#E85D04] hover:bg-[#d45503] disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-semibold">
            {saving ? 'Guardando…' : special ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </div>
      </form>
    </div>
  );
}
