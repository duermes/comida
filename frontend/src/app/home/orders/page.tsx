"use client";

import {useEffect, useMemo, useState} from "react";
import OrderCard from "@/components/orders/order-cards";
import {getPedidos, type PedidoResponse} from "@/lib/api";

interface UIOrder {
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
}

const STATUS_MAP: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Confirmado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Finalizado",
  cancelado: "Cancelado",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const response = await getPedidos();
        setOrders(response);
      } catch (error) {
        console.error("Error al obtener reservas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const {currentOrders, pastOrders} = useMemo(() => {
    const transform = (pedido: PedidoResponse): UIOrder => {
      const primerItem = pedido.items?.[0];
      const parseDate = (value?: string | null) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const fechaEntregaDate = parseDate(pedido.fechaEntrega ?? null);
      const creadoEnDate = parseDate(pedido.creadoEn);
      const referenciaDate = fechaEntregaDate ?? creadoEnDate;

      const estadoBase =
        typeof pedido.estado === "string"
          ? pedido.estado
          : pedido.estado?.nombre ?? pedido.estadoNombre ?? "pendiente";
      const estadoKey = estadoBase?.toLowerCase?.() ?? "pendiente";
      const status = STATUS_MAP[estadoKey] ?? pedido.estadoNombre ?? estadoBase;

      const isObjectId = (value: string) =>
        /^[a-f\d]{24}$/i.test(value.trim());

      const sedeFuente =
        pedido.sedeNombre ??
        (typeof pedido.sede === "string"
          ? pedido.sede
          : pedido.sede?.nombre ?? pedido.sede?._id ?? "");
      const sedeLabel =
        typeof sedeFuente === "string" && sedeFuente.trim()
          ? isObjectId(sedeFuente)
            ? "Sede no disponible"
            : sedeFuente
          : "Sin sede";

      const scheduleLabel = fechaEntregaDate
        ? `Entrega programada para ${fechaEntregaDate.toLocaleDateString()}`
        : undefined;
      const timeLabel = fechaEntregaDate
        ? ""
        : creadoEnDate
          ? creadoEnDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
      const dateLabel = referenciaDate
        ? referenciaDate.toLocaleDateString()
        : creadoEnDate
          ? creadoEnDate.toLocaleDateString()
          : "Fecha no disponible";

      return {
        id: `#${pedido._id.slice(-6)}`,
        status,
        dish: primerItem?.nombre ?? "Menú reservado",
        category: primerItem?.tipo === "menu" ? "Menú" : "Carta",
        menu: `Reserva ${pedido.items.length > 1 ? "múltiple" : "individual"}`,
        sede: sedeLabel,
        date: dateLabel,
        time: timeLabel,
        image: primerItem?.imagenUrl ?? null,
        quantity: pedido.items.reduce((acc, item) => acc + Number(item.cantidad ?? 0), 0),
        total: Number(pedido.total ?? 0),
        isScheduled: Boolean(fechaEntregaDate),
        scheduleLabel,
      };
    };

    const partitioned = orders.reduce(
      (acc, pedido) => {
        const estadoBase =
          typeof pedido.estado === "string"
            ? pedido.estado
            : pedido.estado?.nombre ?? pedido.estadoNombre ?? "";
        const estadoKey = estadoBase?.toLowerCase?.() ?? "";
        const uiOrder = transform(pedido);
        if (estadoKey === "entregado" || estadoKey === "cancelado") {
          acc.past.push(uiOrder);
        } else {
          acc.current.push(uiOrder);
        }
        return acc;
      },
      {current: [] as UIOrder[], past: [] as UIOrder[]}
    );

    return {
      currentOrders: partitioned.current,
      pastOrders: partitioned.past,
    };
  }, [orders]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Mis reservas
        </h1>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({length: 3}).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-lg bg-background-secondary animate-pulse"
              />
            ))}
          </div>
        ) : currentOrders.length ? (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <p className="text-foreground-secondary">
            Aún no tienes reservas activas.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Mis reservas pasadas
        </h2>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({length: 2}).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-lg bg-background-secondary animate-pulse"
              />
            ))}
          </div>
        ) : pastOrders.length ? (
          <div className="space-y-4">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} isPast />
            ))}
          </div>
        ) : (
          <p className="text-foreground-secondary">
            No registras reservas pasadas.
          </p>
        )}
      </div>
    </div>
  );
}
