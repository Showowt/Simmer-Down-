'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * SIMMER DOWN - MOBILE RESERVATION WIZARD
 *
 * Flow: Location -> Date -> Time/Party -> Contact -> Confirm
 * Pattern: Full-screen steps, one decision per screen
 * Confirmation: WhatsApp + Calendar .ics
 */

// ============================================================================
// TYPES
// ============================================================================

interface ReservationLocation {
  id: string
  name: string
  slug: string
  address: string
  city: string
  phone: string
  whatsapp: string
  hours: { open: string; close: string; days: string }
  capacity: number
}

interface TimeSlot {
  time: string
  available: boolean
  tables: number
}

interface ReservationData {
  location: ReservationLocation | null
  date: Date | null
  time: string
  partySize: number
  name: string
  phone: string
  email: string
  notes: string
}

// ============================================================================
// DATA
// ============================================================================

const LOCATIONS: ReservationLocation[] = [
  {
    id: 'santa-ana',
    name: 'Santa Ana',
    slug: 'santa-ana',
    address: 'Frente a Catedral',
    city: 'Santa Ana',
    phone: '+503 2455-4899',
    whatsapp: '+50324554899',
    hours: { open: '11:00', close: '21:00', days: 'Lun-Dom' },
    capacity: 60,
  },
  {
    id: 'lago-coatepeque',
    name: 'Lago de Coatepeque',
    slug: 'lago-coatepeque',
    address: 'Orilla del Lago',
    city: 'Coatepeque',
    phone: '+503 2441-6688',
    whatsapp: '+50324416688',
    hours: { open: '10:00', close: '20:00', days: 'Lun-Dom' },
    capacity: 80,
  },
  {
    id: 'san-benito',
    name: 'San Benito',
    slug: 'san-benito',
    address: 'Zona Rosa',
    city: 'San Salvador',
    phone: '+503 2263-1234',
    whatsapp: '+50322631234',
    hours: { open: '11:00', close: '23:00', days: 'Lun-Dom' },
    capacity: 45,
  },
  {
    id: 'surf-city',
    name: 'Surf City',
    slug: 'surf-city',
    address: 'El Tunco',
    city: 'La Libertad',
    phone: '+503 2389-6666',
    whatsapp: '+50323896666',
    hours: { open: '08:00', close: '22:00', days: 'Lun-Dom' },
    capacity: 50,
  },
  {
    id: 'simmer-garden',
    name: 'Simmer Garden',
    slug: 'simmer-garden',
    address: 'Juayua',
    city: 'Sonsonate',
    phone: '+503 2452-2233',
    whatsapp: '+50324522233',
    hours: { open: '09:00', close: '18:00', days: 'Sab-Dom' },
    capacity: 100,
  },
]

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateTimeSlots(location: ReservationLocation): TimeSlot[] {
  const slots: TimeSlot[] = []
  const [openH] = location.hours.open.split(':').map(Number)
  const [closeH] = location.hours.close.split(':').map(Number)

  for (let h = openH; h < closeH; h++) {
    for (const m of ['00', '30']) {
      const time = `${h.toString().padStart(2, '0')}:${m}`
      const available = Math.random() > 0.2
      const tables = available ? Math.floor(Math.random() * 5) + 1 : 0
      slots.push({ time, available, tables })
    }
  }

  return slots
}

function formatDate(date: Date, lang: 'es' | 'en'): string {
  return date.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function generateCalendarLink(data: ReservationData): string {
  if (!data.location || !data.date) return '#'

  const startDate = new Date(data.date)
  const [hours, minutes] = data.time.split(':').map(Number)
  startDate.setHours(hours, minutes, 0)

  const endDate = new Date(startDate)
  endDate.setHours(endDate.getHours() + 2)

  const formatICS = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const event = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatICS(startDate)}`,
    `DTEND:${formatICS(endDate)}`,
    `SUMMARY:Reservacion Simmer Down ${data.location.name}`,
    `DESCRIPTION:Reservacion para ${data.partySize} personas`,
    `LOCATION:${data.location.address}, ${data.location.city}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n')

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(event)}`
}

function generateWhatsAppMessage(data: ReservationData): string {
  if (!data.location || !data.date) return ''

  const message = `*Nueva Reservacion - Simmer Down*

Ubicacion: ${data.location.name}
Fecha: ${formatDate(data.date, 'es')}
Hora: ${data.time}
Personas: ${data.partySize}

Nombre: ${data.name}
Telefono: ${data.phone}
${data.notes ? `Notas: ${data.notes}` : ''}

Confirmacion pendiente.`

  return encodeURIComponent(message)
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <span className="progress-text">Paso {step} de {total}</span>

      <style jsx>{`
        .progress-container {
          padding: 1rem;
          background: rgba(31, 29, 26, 0.95);
        }

        .progress-bar {
          height: 4px;
          background: rgba(61, 57, 54, 0.5);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF6B35, #E55A2B);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.75rem;
          color: rgba(184, 176, 168, 0.6);
        }
      `}</style>
    </div>
  )
}

function LocationStep({
  locations,
  selected,
  onSelect,
}: {
  locations: ReservationLocation[]
  selected: ReservationLocation | null
  onSelect: (location: ReservationLocation) => void
}) {
  return (
    <div className="step-content">
      <h1 className="step-title">Donde nos vemos?</h1>
      <p className="step-subtitle">Selecciona tu ubicacion preferida</p>

      <div className="locations-grid">
        {locations.map((loc) => (
          <button
            key={loc.id}
            className={`location-card ${selected?.id === loc.id ? 'selected' : ''}`}
            onClick={() => onSelect(loc)}
          >
            <div className="location-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="location-info">
              <h3 className="location-name">{loc.name}</h3>
              <p className="location-address">{loc.address}, {loc.city}</p>
              <p className="location-hours">{loc.hours.open} - {loc.hours.close}</p>
            </div>
            {selected?.id === loc.id && (
              <span className="check-icon">&#10003;</span>
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        .step-content {
          padding: 1.5rem;
          min-height: calc(100vh - 200px);
        }

        .step-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #FFF8F0;
          margin: 0 0 0.5rem;
          letter-spacing: -1px;
          font-family: var(--font-playfair), Georgia, serif;
        }

        .step-subtitle {
          font-size: 1rem;
          color: rgba(184, 176, 168, 0.7);
          margin: 0 0 2rem;
        }

        .locations-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .location-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(37, 35, 32, 0.8);
          border: 2px solid rgba(61, 57, 54, 0.5);
          border-radius: 16px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .location-card:active {
          transform: scale(0.98);
        }

        .location-card.selected {
          background: rgba(255, 107, 53, 0.15);
          border-color: #FF6B35;
        }

        .location-icon {
          color: #C9A84C;
          flex-shrink: 0;
        }

        .location-card.selected .location-icon {
          color: #FF6B35;
        }

        .location-info {
          flex: 1;
        }

        .location-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #FFF8F0;
          margin: 0 0 0.25rem;
        }

        .location-address {
          font-size: 0.875rem;
          color: rgba(184, 176, 168, 0.7);
          margin: 0 0 0.25rem;
        }

        .location-hours {
          font-size: 0.75rem;
          color: rgba(184, 176, 168, 0.4);
          margin: 0;
        }

        .check-icon {
          font-size: 1.5rem;
          color: #FF6B35;
        }
      `}</style>
    </div>
  )
}

function DateStep({
  selected,
  onSelect,
}: {
  selected: Date | null
  onSelect: (date: Date) => void
}) {
  const today = new Date()
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    return date
  })

  const formatDay = (date: Date) =>
    date.toLocaleDateString('es-SV', { weekday: 'short' }).toUpperCase()

  const formatNum = (date: Date) => date.getDate()

  const isSelected = (date: Date) =>
    selected?.toDateString() === date.toDateString()

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString()

  return (
    <div className="step-content">
      <h1 className="step-title">Cuando?</h1>
      <p className="step-subtitle">Selecciona la fecha</p>

      <div className="dates-scroll">
        {dates.map((date, i) => (
          <button
            key={i}
            className={`date-card ${isSelected(date) ? 'selected' : ''} ${isToday(date) ? 'today' : ''}`}
            onClick={() => onSelect(date)}
          >
            <span className="date-day">{formatDay(date)}</span>
            <span className="date-num">{formatNum(date)}</span>
            {isToday(date) && <span className="date-label">HOY</span>}
          </button>
        ))}
      </div>

      {selected && (
        <div className="selected-date">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="selected-icon">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
          </svg>
          <span className="selected-text">{formatDate(selected, 'es')}</span>
        </div>
      )}

      <style jsx>{`
        .step-content {
          padding: 1.5rem;
          min-height: calc(100vh - 200px);
        }

        .step-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #FFF8F0;
          margin: 0 0 0.5rem;
          letter-spacing: -1px;
          font-family: var(--font-playfair), Georgia, serif;
        }

        .step-subtitle {
          font-size: 1rem;
          color: rgba(184, 176, 168, 0.7);
          margin: 0 0 2rem;
        }

        .dates-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 1rem;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .dates-scroll::-webkit-scrollbar {
          display: none;
        }

        .date-card {
          min-width: 70px;
          padding: 1rem 0.75rem;
          background: rgba(37, 35, 32, 0.8);
          border: 2px solid rgba(61, 57, 54, 0.5);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .date-card:active {
          transform: scale(0.95);
        }

        .date-card.selected {
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          border-color: #FF6B35;
        }

        .date-card.today {
          border-color: rgba(255, 107, 53, 0.5);
        }

        .date-day {
          font-size: 0.625rem;
          font-weight: 600;
          color: rgba(184, 176, 168, 0.6);
          margin-bottom: 0.25rem;
        }

        .date-card.selected .date-day {
          color: rgba(255, 255, 255, 0.9);
        }

        .date-num {
          font-size: 1.5rem;
          font-weight: 800;
          color: #FFF8F0;
        }

        .date-label {
          font-size: 0.5rem;
          font-weight: 700;
          color: #FF6B35;
          margin-top: 0.25rem;
        }

        .date-card.selected .date-label {
          color: white;
        }

        .selected-date {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 12px;
        }

        .selected-icon {
          color: #C9A84C;
          flex-shrink: 0;
        }

        .selected-text {
          font-size: 1rem;
          font-weight: 600;
          color: #FFF8F0;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  )
}

function TimePartyStep({
  location,
  selectedTime,
  partySize,
  onSelectTime,
  onSelectParty,
}: {
  location: ReservationLocation
  date: Date
  selectedTime: string
  partySize: number
  onSelectTime: (time: string) => void
  onSelectParty: (size: number) => void
}) {
  const timeSlots = generateTimeSlots(location)

  return (
    <div className="step-content">
      <h1 className="step-title">A que hora?</h1>
      <p className="step-subtitle">Selecciona hora y numero de personas</p>

      {/* Party Size */}
      <div className="section">
        <h3 className="section-label">Personas</h3>
        <div className="party-scroll">
          {PARTY_SIZES.map((size) => (
            <button
              key={size}
              className={`party-btn ${partySize === size ? 'selected' : ''}`}
              onClick={() => onSelectParty(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div className="section">
        <h3 className="section-label">Hora disponible</h3>
        <div className="times-grid">
          {timeSlots.map((slot) => (
            <button
              key={slot.time}
              className={`time-btn ${selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
              onClick={() => slot.available && onSelectTime(slot.time)}
              disabled={!slot.available}
            >
              {slot.time}
              {slot.available && (
                <span className="tables-count">{slot.tables} mesas</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .step-content {
          padding: 1.5rem;
          min-height: calc(100vh - 200px);
        }

        .step-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #FFF8F0;
          margin: 0 0 0.5rem;
          letter-spacing: -1px;
          font-family: var(--font-playfair), Georgia, serif;
        }

        .step-subtitle {
          font-size: 1rem;
          color: rgba(184, 176, 168, 0.7);
          margin: 0 0 2rem;
        }

        .section {
          margin-bottom: 2rem;
        }

        .section-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: rgba(184, 176, 168, 0.8);
          margin: 0 0 1rem;
        }

        .party-scroll {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .party-scroll::-webkit-scrollbar {
          display: none;
        }

        .party-btn {
          min-width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid rgba(61, 57, 54, 0.6);
          background: transparent;
          color: #FFF8F0;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .party-btn.selected {
          background: #FF6B35;
          border-color: #FF6B35;
        }

        .times-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .time-btn {
          padding: 0.75rem;
          background: rgba(37, 35, 32, 0.8);
          border: 2px solid rgba(61, 57, 54, 0.5);
          border-radius: 12px;
          color: #FFF8F0;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s ease;
        }

        .time-btn:active:not(.disabled) {
          transform: scale(0.95);
        }

        .time-btn.selected {
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          border-color: #FF6B35;
        }

        .time-btn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .tables-count {
          font-size: 0.625rem;
          font-weight: 500;
          color: rgba(184, 176, 168, 0.6);
        }

        .time-btn.selected .tables-count {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  )
}

function ContactStep({
  data,
  onChange,
}: {
  data: ReservationData
  onChange: (field: keyof ReservationData, value: string) => void
}) {
  return (
    <div className="step-content">
      <h1 className="step-title">Como te contactamos?</h1>
      <p className="step-subtitle">Informacion para confirmar tu reservacion</p>

      <div className="form">
        <div className="field">
          <label>Nombre completo *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className="field">
          <label>Telefono / WhatsApp *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+503 0000-0000"
            required
          />
        </div>

        <div className="field">
          <label>Correo electronico</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="tu@email.com"
          />
        </div>

        <div className="field">
          <label>Notas especiales</label>
          <textarea
            value={data.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Cumpleanos, alergias, silla para bebe..."
            rows={3}
          />
        </div>
      </div>

      <style jsx>{`
        .step-content {
          padding: 1.5rem;
          min-height: calc(100vh - 200px);
        }

        .step-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #FFF8F0;
          margin: 0 0 0.5rem;
          letter-spacing: -1px;
          font-family: var(--font-playfair), Georgia, serif;
        }

        .step-subtitle {
          font-size: 1rem;
          color: rgba(184, 176, 168, 0.7);
          margin: 0 0 2rem;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field label {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(184, 176, 168, 0.8);
        }

        .field input,
        .field textarea {
          padding: 1rem;
          background: rgba(37, 35, 32, 0.8);
          border: 2px solid rgba(61, 57, 54, 0.5);
          border-radius: 12px;
          color: #FFF8F0;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #FF6B35;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: rgba(184, 176, 168, 0.3);
        }

        .field textarea {
          resize: none;
          font-family: inherit;
        }
      `}</style>
    </div>
  )
}

function ConfirmationScreen({ data }: { data: ReservationData }) {
  if (!data.location || !data.date) return null

  const calendarLink = generateCalendarLink(data)
  const whatsappMessage = generateWhatsAppMessage(data)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Simmer Down ${data.location.name}, ${data.location.address}, ${data.location.city}`
  )}`

  return (
    <div className="confirmation">
      <div className="success-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="#4CAF50">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>

      <h1 className="title">Reservacion Confirmada!</h1>
      <p className="subtitle">Te enviamos un mensaje de WhatsApp con los detalles</p>

      <div className="details-card">
        <div className="detail-row">
          <span className="detail-label">Ubicacion</span>
          <span className="detail-value">{data.location.name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Fecha</span>
          <span className="detail-value">{formatDate(data.date, 'es')}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Hora</span>
          <span className="detail-value">{data.time}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Personas</span>
          <span className="detail-value">{data.partySize}</span>
        </div>
      </div>

      <div className="actions">
        <a
          href={calendarLink}
          download="simmerdown-reservacion.ics"
          className="action-btn calendar"
        >
          Agregar a Calendario
        </a>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn maps"
        >
          Como Llegar
        </a>

        <a
          href={`https://wa.me/${data.location.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn whatsapp"
        >
          Abrir WhatsApp
        </a>
      </div>

      <Link href="/" className="home-link">
        Volver al inicio
      </Link>

      <style jsx>{`
        .confirmation {
          padding: 2rem 1.5rem;
          text-align: center;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .success-icon {
          margin-bottom: 1rem;
          animation: pop 0.5s ease;
        }

        @keyframes pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #FFF8F0;
          margin: 0 0 0.5rem;
          font-family: var(--font-playfair), Georgia, serif;
        }

        .subtitle {
          font-size: 1rem;
          color: rgba(184, 176, 168, 0.7);
          margin: 0 0 2rem;
        }

        .details-card {
          width: 100%;
          background: rgba(37, 35, 32, 0.8);
          border: 1px solid rgba(61, 57, 54, 0.5);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 2rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(61, 57, 54, 0.3);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 0.875rem;
          color: rgba(184, 176, 168, 0.5);
        }

        .detail-value {
          font-size: 1rem;
          font-weight: 600;
          color: #FFF8F0;
        }

        .actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          transition: transform 0.2s ease;
        }

        .action-btn:active {
          transform: scale(0.98);
        }

        .action-btn.calendar {
          background: rgba(201, 168, 76, 0.15);
          color: #C9A84C;
          border: 1px solid rgba(201, 168, 76, 0.3);
        }

        .action-btn.maps {
          background: rgba(66, 133, 244, 0.15);
          color: #4285F4;
          border: 1px solid rgba(66, 133, 244, 0.3);
        }

        .action-btn.whatsapp {
          background: #25D366;
          color: white;
        }

        .home-link {
          color: rgba(184, 176, 168, 0.5);
          text-decoration: none;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ReservarPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<ReservationData>({
    location: null,
    date: null,
    time: '',
    partySize: 2,
    name: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [confirmed, setConfirmed] = useState(false)

  const canProceed = () => {
    switch (step) {
      case 1: return data.location !== null
      case 2: return data.date !== null
      case 3: return data.time !== '' && data.partySize > 0
      case 4: return data.name.trim() !== '' && data.phone.trim() !== ''
      default: return false
    }
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      setConfirmed(true)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  if (confirmed) {
    return (
      <div className="page">
        <ConfirmationScreen data={data} />
        <style jsx>{`
          .page {
            min-height: 100vh;
            min-height: 100dvh;
            background: #2D2A26;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <button onClick={handleBack} className="back-btn" disabled={step === 1}>
          {step > 1 && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          )}
        </button>
        <span className="header-title">Reservar Mesa</span>
        <Link href="/" className="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </Link>
      </header>

      {/* Progress */}
      <ProgressBar step={step} total={4} />

      {/* Step Content */}
      {step === 1 && (
        <LocationStep
          locations={LOCATIONS}
          selected={data.location}
          onSelect={(loc) => setData({ ...data, location: loc })}
        />
      )}

      {step === 2 && (
        <DateStep
          selected={data.date}
          onSelect={(date) => setData({ ...data, date })}
        />
      )}

      {step === 3 && data.location && data.date && (
        <TimePartyStep
          location={data.location}
          date={data.date}
          selectedTime={data.time}
          partySize={data.partySize}
          onSelectTime={(time) => setData({ ...data, time })}
          onSelectParty={(size) => setData({ ...data, partySize: size })}
        />
      )}

      {step === 4 && (
        <ContactStep
          data={data}
          onChange={(field, value) => setData({ ...data, [field]: value })}
        />
      )}

      {/* Fixed Bottom Button */}
      <div className="bottom-action">
        <button
          className="next-btn"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {step === 4 ? 'Confirmar Reservacion' : 'Continuar'}
        </button>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #2D2A26;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(31, 29, 26, 0.98);
          border-bottom: 1px solid rgba(61, 57, 54, 0.5);
        }

        .back-btn,
        .close-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #FFF8F0;
          cursor: pointer;
        }

        .back-btn:disabled {
          opacity: 0;
        }

        .close-btn {
          text-decoration: none;
          color: #FFF8F0;
        }

        .header-title {
          font-weight: 700;
          font-size: 1rem;
          color: #FFF8F0;
        }

        .bottom-action {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          padding-bottom: calc(1rem + env(safe-area-inset-bottom));
          background: linear-gradient(to top, #2D2A26 80%, transparent);
        }

        .next-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .next-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .next-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  )
}
