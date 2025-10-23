"use client"

import DishCard from "@/components/menu/dish-card"

const FAVORITE_DISHES = [
  {
    id: 1,
    name: "Ensalada César Vegana",
    description: "Una versión vegana y deliciosa de la clásica ensalada César con aderezo cremoso.",
    price: 10.0,
    image: "/vegan-caesar-salad.jpg",
    category: "Menú universitario",
    sede: "Pacifico",
    isFavorite: true,
  },
  {
    id: 2,
    name: "Pollo a la Parrilla",
    description: "Jugoso pollo cocinado a la perfección con un toque de hierbas frescas.",
    price: 11.0,
    image: "/grilled-chicken-plate.jpg",
    category: "Menú universitario",
    sede: "Pacifico",
    isFavorite: true,
  },
]

export default function FavoritesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Mis Favoritos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FAVORITE_DISHES.map((dish) => (
          <DishCard key={dish.id} dish={dish} onSelect={() => {}} />
        ))}
      </div>
    </div>
  )
}
