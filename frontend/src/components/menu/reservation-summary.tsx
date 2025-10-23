"use client"

import { useState } from "react"

interface ReservationSummaryProps {
  reservation: any
  onClose: () => void
}

export default function ReservationSummary({ reservation, onClose }: ReservationSummaryProps) {
  const [selectedEntrance, setSelectedEntrance] = useState("Seleccionar entrada")
  const [showSurvey, setShowSurvey] = useState(false)

  return (
    <aside className="w-96 bg-white border-l border-border overflow-auto p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Resumen de recerva</h2>
        <button
          onClick={onClose}
          className="text-foreground-secondary hover:text-foreground transition-smooth text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Entrance Selection */}
      <div className="mb-6">
        <select
          value={selectedEntrance}
          onChange={(e) => setSelectedEntrance(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer"
        >
          <option>Seleccionar entrada</option>
          <option>Entrada 1</option>
          <option>Entrada 2</option>
        </select>
      </div>

      {/* Reservation Details */}
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Menú:</span>
          <span className="font-medium text-foreground">{reservation.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Comedor:</span>
          <span className="font-medium text-foreground">Torre Pacifico</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Fecha y hora:</span>
          <span className="font-medium text-foreground">26/09/2025 1:00 PM</span>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex justify-between items-center mb-6 pb-6 border-b border-border">
        <span className="text-foreground-secondary">Subtotal:</span>
        <span className="text-xl font-bold text-primary">S/ {reservation.price.toFixed(2)}</span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        <button className="w-full bg-error hover:bg-error/90 text-white font-semibold py-3 rounded-lg transition-smooth">
          Proceder al pago
        </button>
        <button className="w-full bg-error/20 hover:bg-error/30 text-error font-semibold py-3 rounded-lg transition-smooth">
          Seguir comprando
        </button>
      </div>

      {/* Survey Section */}
      <div className="bg-background-secondary rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Encuesta rápido</h3>
        <p className="text-sm text-foreground-secondary mb-4">Porque nos importa tu opinión</p>
        <p className="text-sm font-medium text-foreground mb-4">
          ¿Qué plato te gustaría que incluyamos la próxima semana?
        </p>

        <div className="space-y-3 mb-4">
          {["Lomo saltado", "Crema de champiñones", "Ají de gallina"].map((option) => (
            <label key={option} className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border cursor-pointer" />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-warning hover:bg-warning/90 text-foreground font-semibold py-2 rounded-lg transition-smooth text-sm">
            Saltar
          </button>
          <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg transition-smooth text-sm">
            Votar
          </button>
        </div>
      </div>
    </aside>
  )
}
