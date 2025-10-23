"use client"

import { Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MenuFiltersProps {
  selectedSede: string
  selectedCategory: string
  onSedChange: (sede: string) => void
  onCategoryChange: (category: string) => void
}

export default function MenuFilters({
  selectedSede,
  selectedCategory,
  onSedChange,
  onCategoryChange,
}: MenuFiltersProps) {
  const sedes = ["Pacifico", "Arequipa", "Herna Velarde"]
  const categories = [
    "Menú universitario",
    "Menú ejecutivo",
    "Platos a la carta",
    "Hamburguesas",
    "Postres",
    "Bebidas",
    "Especiales del día",
  ]

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Explora nuestros productos variados con la calidad perfecta
      </h3>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary" size={18} />
          <Input type="text" placeholder="Buscar" className="pl-10" />
        </div>

        <Select value={selectedSede} onValueChange={onSedChange}>
          <SelectTrigger className="w-48">
            <MapPin size={18} className="mr-2" />
            <SelectValue placeholder="Seleccionar sede" />
          </SelectTrigger>
          <SelectContent>
            {sedes.map((sede) => (
              <SelectItem key={sede} value={sede}>
                {sede}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
