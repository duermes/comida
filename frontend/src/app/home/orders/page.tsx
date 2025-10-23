"use client"

import OrderCard from "@/components/orders/order-cards"

const MOCK_ORDERS = [
  {
    id: "#1255",
    status: "Confirmado",
    dish: "Pollo a la Parrilla",
    category: "Entrada",
    menu: "Menú Estudiantil",
    sede: "Torre Pacifico",
    date: "26/09/2025",
    time: "01:00 pm",
    image: "/grilled-chicken.jpg",
  },
  {
    id: "#1275",
    status: "Pendiente",
    dish: "Ensalada César Vegana",
    category: "Entrada",
    menu: "Menú Ejecutivo",
    sede: "Torre Pacifico",
    date: "26/09/2025",
    time: "01:00 pm",
    image: "/caesar-salad.png",
  },
]

const PAST_ORDERS = [
  {
    id: "#1075",
    status: "Finalizado",
    dish: "Ensalada César Vegana",
    category: "Entrada",
    menu: "Menú Ejecutivo",
    sede: "Torre Pacifico",
    date: "19/09/2025",
    time: "01:00 pm",
    image: "/caesar-salad.png",
  },
]

export default function OrdersPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Current Orders */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">Mis reservas</h1>
        <div className="space-y-4">
          {MOCK_ORDERS.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>

      {/* Past Orders */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Mis reservas pasadas</h2>
        <div className="space-y-4">
          {PAST_ORDERS.map((order) => (
            <OrderCard key={order.id} order={order} isPast />
          ))}
        </div>
      </div>
    </div>
  )
}
