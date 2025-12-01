"use client"

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    dish: string;
    category: string;
    menu: string;
    sede: string;
    date: string;
    time: string;
    image?: string | null;
    quantity: number;
    total: number;
    isScheduled: boolean;
    scheduleLabel?: string;
  };
  isPast?: boolean;
}

export default function OrderCard({ order, isPast = false }: OrderCardProps) {
  const statusColors = {
    Confirmado: "bg-success/20 text-success border-success/30",
    Pendiente: "bg-warning/20 text-warning border-warning/30",
    Finalizado: "bg-foreground-secondary/20 text-foreground-secondary border-foreground-secondary/30",
  }

  const statusColor = statusColors[order.status as keyof typeof statusColors] || statusColors["Pendiente"]
  const cardBorderClass = order.isScheduled ? "border border-primary/30" : "border border-transparent"
  const historyOverlayClass = isPast ? "opacity-90" : ""

  return (
    <div className={`bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-smooth ${cardBorderClass} ${historyOverlayClass}`}>
      <div className="flex gap-6 p-6">
        {/* Image */}
        <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={
              typeof order.image === "string" && order.image.trim().length > 0
                ? order.image
                : "/file.svg"
            }
            alt={order.dish}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">{order.dish}</h3>
              <p className="text-sm text-foreground-secondary">
                {order.category} • {order.menu} • {order.sede}
              </p>
              {order.scheduleLabel && (
                <span className="mt-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                  {order.scheduleLabel}
                </span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>{order.status}</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="text-sm text-foreground-secondary space-y-1">
              <p className="font-medium text-foreground">{order.id}</p>
              <p className="text-error font-medium">
                {order.time ? `${order.date} ${order.time}` : order.date}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                <p className="text-foreground-secondary text-xs uppercase tracking-wide mb-1">
                  Cantidad
                </p>
                <p className="font-semibold text-foreground">
                  {order.quantity}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                <p className="text-foreground-secondary text-xs uppercase tracking-wide mb-1">
                  Total (S/)
                </p>
                <p className="font-semibold text-foreground">
                  S/ {order.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
