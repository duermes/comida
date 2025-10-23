"use client"

import { useState } from "react"
import MenuGrid from "@/components/menu/menu-grid"
import MenuFilters from "@/components/menu/menu-filters"
import ReservationSummary from "@/components/menu/reservation-summary"

export default function MenuPage() {
  const [selectedSede, setSelectedSede] = useState("Pacifico")
  const [selectedCategory, setSelectedCategory] = useState("Menú universitario")
  const [reservation, setReservation] = useState<any>(null)

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 bg-gradient-to-r from-warning to-accent-green rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">Oferta del Día</h2>
            <p className="text-sm opacity-90 mb-4">No te pierdas de nuestras increíbles ofertas especiales</p>
            <div className="flex items-center space-x-8">
              <div className="text-4xl font-bold">05:00:00</div>
              <button className="bg-white text-warning font-semibold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-smooth">
                Pedir ahora
              </button>
            </div>
          </div>


          <MenuFilters
            selectedSede={selectedSede}
            selectedCategory={selectedCategory}
            onSedChange={setSelectedSede}
            onCategoryChange={setSelectedCategory}
          />


          <MenuGrid sede={selectedSede} category={selectedCategory} onSelectDish={(dish) => setReservation(dish)} />
        </div>
      </div>


      {reservation && <ReservationSummary reservation={reservation} onClose={() => setReservation(null)} />}
    </div>
  )
}
