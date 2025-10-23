"use client"

import DishCard from "@/components/menu/dish-card"

interface MenuGridProps {
  sede: string
  category: string
  onSelectDish: (dish: any) => void
}

const MOCK_DISHES = [
  {
    id: 1,
    name: "Pollo a la Parrilla",
    description: "Jugoso pollo cocinado a la perfección con un toque de hierbas frescas.",
    price: 11.0,
    image: "/grilled-chicken-plate.jpeg",
    category: "Menú universitario",
    sede: "Pacifico",
    isFavorite: false,
  },
  {
    id: 2,
    name: "Ensalada César Vegana",
    description: "Una versión vegana y deliciosa de la clásica ensalada César con aderezo cremoso.",
    price: 10.0,
    image: "/vegan-caesar-salad.jpeg",
    category: "Menú universitario",
    sede: "Pacifico",
    isFavorite: true,
  },
  {
    id: 3,
    name: "Lomo saltado Clásico",
    description: "Plato a la carta con trozos de carne jugosos, salteados al wok con verduras y sabor criollo.",
    price: 11.0,
    image: "/lomo-saltado-peruvian-beef.jpg",
    category: "Platos a la carta",
    sede: "Pacifico",
    isFavorite: false,
  },
  {
    id: 4,
    name: "Hamburguesa de pollo a la Parrilla",
    description: "Jugoso pollo cocinado a la perfección con un toque de limón y hierbas frescas.",
    price: 14.0,
    image: "/grilled-chicken-burger.jpg",
    category: "Hamburguesas",
    sede: "Arequipa",
    isFavorite: false,
  },
  {
    id: 5,
    name: "Postres Especiales",
    description: "Deliciosos postres caseros preparados diariamente.",
    price: 8.0,
    image: "/dessert-plate.jpg",
    category: "Postres",
    sede: "Herna Velarde",
    isFavorite: false,
  },
  {
    id: 6,
    name: "Bebida Refrescante",
    description: "Bebida natural y refrescante para acompañar tu comida.",
    price: 5.0,
    image: "/refreshing-drink.jpg",
    category: "Bebidas",
    sede: "Pacifico",
    isFavorite: false,
  },
]

export default function MenuGrid({ sede, category, onSelectDish }: MenuGridProps) {
  const filteredDishes = MOCK_DISHES.filter((dish) => dish.sede === sede && dish.category === category)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDishes.length > 0 ? (
        filteredDishes.map((dish) => <DishCard key={dish.id} dish={dish} onSelect={() => onSelectDish(dish)} />)
      ) : (
        <div className="col-span-full text-center py-12">
          <p className="text-foreground-secondary">No hay platos disponibles en esta categoría</p>
        </div>
      )}
    </div>
  )
}
