'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Save, MapPin, Phone, Clock, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Location } from '@/lib/types'

const emptyLocation: Partial<Location> = {
  name: '',
  address: '',
  phone: '',
  hours_weekday: '',
  hours_saturday: '',
  hours_sunday: '',
  delivery_available: true,
  status: 'active',
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLocation, setEditingLocation] = useState<Partial<Location> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      // Map database fields to our Location type
      interface DBLocation {
        id: string
        name: string
        address: string
        phone?: string
        hours_weekday?: string
        hours_weekend?: string
        hours_saturday?: string
        hours_sunday?: string
        delivery_available: boolean
        is_open?: boolean
        lat?: number
        lng?: number
        created_at: string
      }

      const mapped = ((data || []) as DBLocation[]).map((loc): Location => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        phone: loc.phone,
        hours_weekday: loc.hours_weekday,
        hours_saturday: loc.hours_weekend || loc.hours_saturday,
        hours_sunday: loc.hours_weekend || loc.hours_sunday,
        delivery_available: loc.delivery_available,
        status: loc.is_open ? 'active' : 'inactive',
        lat: loc.lat,
        lng: loc.lng,
        created_at: loc.created_at,
      }))

      setLocations(mapped)
    } catch (err) {
      console.log('Locations table may not exist')
    } finally {
      setLoading(false)
    }
  }

  const saveLocation = async () => {
    if (!editingLocation?.name || !editingLocation?.address) return

    setSaving(true)
    try {
      const supabase = createClient()

      // Map to database fields
      const dbData = {
        name: editingLocation.name,
        address: editingLocation.address,
        phone: editingLocation.phone,
        hours_weekday: editingLocation.hours_weekday,
        hours_weekend: editingLocation.hours_saturday, // Use weekend for both
        is_open: editingLocation.status === 'active',
        delivery_available: editingLocation.delivery_available,
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('locations')
          .insert([dbData])
          .select()
          .single()

        if (error) throw error
        setLocations([...locations, {
          ...data,
          status: data.is_open ? 'active' : 'inactive',
        } as Location])
      } else {
        const { error } = await supabase
          .from('locations')
          .update(dbData)
          .eq('id', editingLocation.id)

        if (error) throw error
        setLocations(locations.map((l) =>
          l.id === editingLocation.id
            ? { ...l, ...editingLocation } as Location
            : l
        ))
      }

      setEditingLocation(null)
      setIsNew(false)
    } catch (err) {
      console.error('Failed to save location:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteLocation = async (id: string) => {
    if (!confirm('¿Eliminar esta ubicación?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('locations').delete().eq('id', id)

      if (error) throw error
      setLocations(locations.filter((l) => l.id !== id))
    } catch (err) {
      console.error('Failed to delete')
    }
  }

  const toggleStatus = async (location: Location) => {
    const newStatus = location.status === 'active' ? 'inactive' : 'active'

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('locations')
        .update({ is_open: newStatus === 'active' })
        .eq('id', location.id)

      if (error) throw error
      setLocations(locations.map((l) =>
        l.id === location.id ? { ...l, status: newStatus } : l
      ))
    } catch (err) {
      console.error('Failed to update')
    }
  }

  const toggleDelivery = async (location: Location) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('locations')
        .update({ delivery_available: !location.delivery_available })
        .eq('id', location.id)

      if (error) throw error
      setLocations(locations.map((l) =>
        l.id === location.id ? { ...l, delivery_available: !l.delivery_available } : l
      ))
    } catch (err) {
      console.error('Failed to update')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Ubicaciones</h1>
          <p className="text-[#6B6560]">Administra las sucursales de Simmer Down</p>
        </div>
        <button
          onClick={() => {
            setEditingLocation(emptyLocation)
            setIsNew(true)
          }}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nueva Ubicación
        </button>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <MapPin className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8] mb-2">No hay ubicaciones aún</p>
          <button
            onClick={() => {
              setEditingLocation(emptyLocation)
              setIsNew(true)
            }}
            className="text-[#FF6B35] hover:underline"
          >
            Agregar tu primera ubicación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`bg-[#252320] border border-[#3D3936] p-6 ${
                location.status !== 'active' ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#FFF8F0] text-lg">{location.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 ${
                        location.status === 'active'
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                          : 'bg-[#6B6560]/10 text-[#6B6560]'
                      }`}
                    >
                      {location.status === 'active' ? 'Abierto' : 'Cerrado'}
                    </span>
                    {location.delivery_available && (
                      <span className="text-xs bg-[#FF6B35]/10 text-[#FF6B35] px-2 py-0.5 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Delivery
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingLocation(location)
                      setIsNew(false)
                    }}
                    className="p-2 hover:bg-[#3D3936] transition"
                  >
                    <Edit2 className="w-4 h-4 text-[#6B6560]" />
                  </button>
                  <button
                    onClick={() => deleteLocation(location.id)}
                    className="p-2 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 text-[#B8B0A8]">
                  <MapPin className="w-4 h-4 text-[#6B6560] mt-0.5 flex-shrink-0" />
                  <span>{location.address}</span>
                </div>
                {location.phone && (
                  <div className="flex items-center gap-2 text-[#B8B0A8]">
                    <Phone className="w-4 h-4 text-[#6B6560]" />
                    <a href={`tel:${location.phone}`} className="hover:text-[#FF6B35]">
                      {location.phone}
                    </a>
                  </div>
                )}
                {location.hours_weekday && (
                  <div className="flex items-start gap-2 text-[#6B6560]">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>Lun-Jue: {location.hours_weekday}</p>
                      {location.hours_saturday && <p>Vie-Sáb: {location.hours_saturday}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-[#3D3936]">
                <button
                  onClick={() => toggleStatus(location)}
                  className={`flex-1 py-2 text-sm font-medium transition ${
                    location.status === 'active'
                      ? 'bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20'
                      : 'bg-[#3D3936] text-[#6B6560] hover:bg-[#4A4744]'
                  }`}
                >
                  {location.status === 'active' ? 'Marcar Cerrado' : 'Marcar Abierto'}
                </button>
                <button
                  onClick={() => toggleDelivery(location)}
                  className={`flex-1 py-2 text-sm font-medium transition ${
                    location.delivery_available
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20'
                      : 'bg-[#3D3936] text-[#6B6560] hover:bg-[#4A4744]'
                  }`}
                >
                  {location.delivery_available ? 'Deshabilitar Delivery' : 'Habilitar Delivery'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3D3936] flex items-center justify-between sticky top-0 bg-[#252320]">
              <h2 className="text-lg font-semibold text-[#FFF8F0]">
                {isNew ? 'Nueva Ubicación' : 'Editar Ubicación'}
              </h2>
              <button
                onClick={() => {
                  setEditingLocation(null)
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
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editingLocation.name || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="Santa Ana"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Dirección *
                </label>
                <textarea
                  value={editingLocation.address || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={2}
                  placeholder="1ra Calle Pte y Callejuela Sur Catedral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editingLocation.phone || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="+503 2445-5999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Horario Lun-Jue
                </label>
                <input
                  type="text"
                  value={editingLocation.hours_weekday || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, hours_weekday: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="11am - 9pm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Horario Vie-Sáb
                </label>
                <input
                  type="text"
                  value={editingLocation.hours_saturday || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, hours_saturday: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                  placeholder="11am - 10pm"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLocation.status === 'active'}
                    onChange={(e) => setEditingLocation({
                      ...editingLocation,
                      status: e.target.checked ? 'active' : 'inactive'
                    })}
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">Abierto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLocation.delivery_available ?? true}
                    onChange={(e) => setEditingLocation({
                      ...editingLocation,
                      delivery_available: e.target.checked
                    })}
                    className="w-4 h-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm text-[#B8B0A8]">Delivery disponible</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-[#3D3936] flex justify-end gap-3 sticky bottom-0 bg-[#252320]">
              <button
                onClick={() => {
                  setEditingLocation(null)
                  setIsNew(false)
                }}
                className="px-4 py-2 text-[#B8B0A8] hover:bg-[#3D3936] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveLocation}
                disabled={saving || !editingLocation.name || !editingLocation.address}
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
