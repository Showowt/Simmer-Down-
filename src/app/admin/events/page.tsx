'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Save, Star, Calendar, Clock, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Event } from '@/lib/types'
import ImageUpload from '@/components/admin/ImageUpload'

const categories = ['Música', 'Taller', 'Degustación', 'Familia', 'Especial', 'General']

const emptyEvent: Partial<Event> = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  image_url: null,
  category: 'General',
  price: null,
  featured: false,
  active: true,
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.log('Events table may not exist yet')
    } finally {
      setLoading(false)
    }
  }

  const saveEvent = async () => {
    if (!editingEvent?.title || !editingEvent?.date || !editingEvent?.time) return

    setSaving(true)
    try {
      const supabase = createClient()

      if (isNew) {
        const { data, error } = await supabase
          .from('events')
          .insert([editingEvent])
          .select()
          .single()

        if (error) throw error
        setEvents([data, ...events])
      } else {
        const { error } = await supabase
          .from('events')
          .update(editingEvent)
          .eq('id', editingEvent.id)

        if (error) throw error
        setEvents(events.map((e) => (e.id === editingEvent.id ? { ...e, ...editingEvent } as Event : e)))
      }

      setEditingEvent(null)
      setIsNew(false)
    } catch (err) {
      console.error('Failed to save event:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('events').delete().eq('id', id)

      if (error) throw error
      setEvents(events.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Failed to delete')
    }
  }

  const toggleFeatured = async (event: Event) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('events')
        .update({ featured: !event.featured })
        .eq('id', event.id)

      if (error) throw error
      setEvents(events.map((e) => (e.id === event.id ? { ...e, featured: !e.featured } : e)))
    } catch (err) {
      console.error('Failed to update')
    }
  }

  const toggleActive = async (event: Event) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('events')
        .update({ active: !event.active })
        .eq('id', event.id)

      if (error) throw error
      setEvents(events.map((e) => (e.id === event.id ? { ...e, active: !e.active } : e)))
    } catch (err) {
      console.error('Failed to update')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Eventos</h1>
          <p className="text-[#6B6560]">Administra los eventos del sitio</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(emptyEvent)
            setIsNew(true)
          }}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Evento
        </button>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Calendar className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8] mb-2">No hay eventos aún</p>
          <button
            onClick={() => {
              setEditingEvent(emptyEvent)
              setIsNew(true)
            }}
            className="text-[#FF6B35] hover:underline"
          >
            Crear tu primer evento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-[#252320] border border-[#3D3936] p-4 flex gap-4 ${
                !event.active ? 'opacity-50' : ''
              }`}
            >
              <div className="w-32 h-24 bg-[#1F1D1A] flex-shrink-0 overflow-hidden">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-[#3D3936]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#FFF8F0]">{event.title}</h3>
                      {event.featured && (
                        <Star className="w-4 h-4 text-[#FFB800] fill-[#FFB800]" />
                      )}
                      <span className="text-xs bg-[#3D3936] text-[#B8B0A8] px-2 py-0.5">
                        {event.category}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6560] line-clamp-1 mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#6B6560]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                      {event.price && (
                        <span className="text-[#FF6B35] font-medium">
                          {event.price}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeatured(event)}
                      className={`p-2 transition ${
                        event.featured
                          ? 'text-[#FFB800] bg-[#FFB800]/10'
                          : 'text-[#6B6560] hover:bg-[#3D3936]'
                      }`}
                      title={event.featured ? 'Quitar destacado' : 'Destacar'}
                    >
                      <Star className={`w-4 h-4 ${event.featured ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => toggleActive(event)}
                      className={`px-3 py-1 text-xs font-medium transition ${
                        event.active
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                          : 'bg-[#6B6560]/10 text-[#6B6560]'
                      }`}
                    >
                      {event.active ? 'Activo' : 'Oculto'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingEvent(event)
                        setIsNew(false)
                      }}
                      className="p-2 hover:bg-[#3D3936] transition"
                    >
                      <Edit2 className="w-4 h-4 text-[#6B6560]" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3D3936] flex items-center justify-between sticky top-0 bg-[#252320]">
              <h2 className="text-lg font-semibold text-[#FFF8F0]">
                {isNew ? 'Nuevo Evento' : 'Editar Evento'}
              </h2>
              <button
                onClick={() => {
                  setEditingEvent(null)
                  setIsNew(false)
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
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="Jazz & Pizza Night"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Describe el evento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Fecha *
                  </label>
                  <input
                    type="text"
                    value={editingEvent.date || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="Feb 15, 2025 o Cada Viernes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Hora *
                  </label>
                  <input
                    type="text"
                    value={editingEvent.time || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="7:00 PM - 11:00 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={editingEvent.location || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="San Benito"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                    Precio
                  </label>
                  <input
                    type="text"
                    value={editingEvent.price || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value || null })}
                    className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    placeholder="$45 (vacío = gratis)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Categoría
                </label>
                <select
                  value={editingEvent.category || 'General'}
                  onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Imagen
                </label>
                <ImageUpload
                  value={editingEvent.image_url || null}
                  onChange={(url) => setEditingEvent({ ...editingEvent, image_url: url })}
                  folder="events"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEvent.featured ?? false}
                    onChange={(e) => setEditingEvent({ ...editingEvent, featured: e.target.checked })}
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">Evento destacado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEvent.active ?? true}
                    onChange={(e) => setEditingEvent({ ...editingEvent, active: e.target.checked })}
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">Visible en el sitio</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-[#3D3936] flex justify-end gap-3 sticky bottom-0 bg-[#252320]">
              <button
                onClick={() => {
                  setEditingEvent(null)
                  setIsNew(false)
                }}
                className="px-4 py-2 text-[#B8B0A8] hover:bg-[#3D3936] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveEvent}
                disabled={saving || !editingEvent.title || !editingEvent.date || !editingEvent.time}
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
  )
}
