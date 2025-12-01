"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {
  getPedidos,
  getResultadosEncuestas,
  getSedes,
  type EncuestaMenuResultado,
  type PedidoResponse,
  type SedeItem,
} from "@/lib/api";

function LoadingView() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-foreground-secondary">Cargando...</p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PEN_FORMATTER = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return PEN_FORMATTER.format(0);
  }
  return PEN_FORMATTER.format(value);
}

type DailyMetrics = {
  hasOrders: boolean;
  topSede: {sede: string; total: number} | null;
  topDish: {nombre: string; cantidad: number; revenue: number} | null;
  topUser: {id: string; displayName: string; total: number} | null;
  ranking: Array<{
    sede: string;
    total: number;
    categories: Array<{category: string; total: number}>;
  }>;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<EncuestaMenuResultado[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [sedeLookup, setSedeLookup] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!stored) {
      router.replace("/");
      setCheckingAuth(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (parsed?.rol !== "admin") {
        router.replace("/home/menu");
        return;
      }
      setAuthorized(true);
    } catch (err) {
      console.error("Error parsing stored user:", err);
      router.replace("/");
      return;
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [encuestas, pedidosResponse, sedesResponse] =
          await Promise.all([
            getResultadosEncuestas(),
            getPedidos(),
            getSedes(),
          ]);
        setResultados(encuestas);
        setPedidos(pedidosResponse);
        const lookup: Record<string, string> = {};
        sedesResponse.forEach((sede: SedeItem) => {
          const key = sede?._id?.toString().trim();
          if (key) {
            lookup[key] = sede.nombre?.trim() || sede._id;
          }
        });
        setSedeLookup(lookup);
      } catch (err) {
        console.error("Error al cargar analíticas:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar la información analítica"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authorized]);

  const resumenGlobal = useMemo(() => {
    if (resultados.length === 0) {
      return {totalMenus: 0, totalEncuestas: 0};
    }
    const totalMenus = resultados.length;
    const totalEncuestas = resultados.reduce(
      (acc, item) => acc + (item.totalEncuestas ?? 0),
      0
    );
    return {totalMenus, totalEncuestas};
  }, [resultados]);

  const todayKey = useMemo(() => new Date().toDateString(), []);

  const pedidosHoy = useMemo(() => {
    if (!pedidos.length) {
      return [] as PedidoResponse[];
    }

    return pedidos.filter((pedido) => {
      if (!pedido.creadoEn) {
        return false;
      }
      const createdAt = new Date(pedido.creadoEn);
      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }
      return createdAt.toDateString() === todayKey;
    });
  }, [pedidos, todayKey]);

  const dailyMetrics = useMemo<DailyMetrics>(() => {
    if (!pedidosHoy.length) {
      return {
        hasOrders: false,
        topSede: null,
        topDish: null,
        topUser: null,
        ranking: [],
      };
    }

    const sedeTotals = new Map<string, number>();
    const dishTotals = new Map<
      string,
      {nombre: string; cantidad: number; revenue: number}
    >();
    const userTotals = new Map<string, {displayName: string; total: number}>();
    const categoryRevenue = new Map<string, Map<string, number>>();

    pedidosHoy.forEach((pedido) => {
      const sedeLabel =
        pedido.sedeNombre ??
        (typeof pedido.sede === "object"
          ? pedido.sede?.nombre ?? pedido.sede?._id ?? null
          : pedido.sede ?? null);
      const sedeKey =
        typeof sedeLabel === "string" && sedeLabel.trim()
          ? sedeLabel.trim()
          : "Sin sede";
      const pedidoTotal = Number(pedido.total) || 0;
      sedeTotals.set(sedeKey, (sedeTotals.get(sedeKey) ?? 0) + pedidoTotal);

      const baseDisplayName =
        pedido.usuarioNombre?.trim() ||
        pedido.usuarioCodigo?.trim() ||
        pedido.usuarioDocumento?.trim() ||
        pedido.usuarioCorreo?.trim() ||
        (typeof pedido.usuarioId === "string"
          ? pedido.usuarioId.trim()
          : "");
      const displayName =
        baseDisplayName && baseDisplayName.length
          ? baseDisplayName
          : "Usuario no identificado";
      const userKey =
        (typeof pedido.usuarioId === "string" && pedido.usuarioId.trim()) || displayName;
      const existingUser = userTotals.get(userKey);
      if (existingUser) {
        existingUser.total += pedidoTotal;
      } else {
        userTotals.set(userKey, {displayName, total: pedidoTotal});
      }

      pedido.items?.forEach((item) => {
        const quantity = Math.max(0, Number(item.cantidad) || 0);
        const unitPrice = Number(item.precioUnitario) || 0;
        const revenue = quantity * unitPrice;
        const dishKey = String(item.refId ?? item.nombre ?? "sin-referencia");
        const dishName =
          (typeof item.nombre === "string" && item.nombre.trim()) ||
          (typeof item.refId === "string"
            ? `Plato ${item.refId.slice(-6)}`
            : "Plato sin nombre");

        const existingDish = dishTotals.get(dishKey);
        if (existingDish) {
          existingDish.cantidad += quantity;
          existingDish.revenue += revenue;
          if (!existingDish.nombre && dishName) {
            existingDish.nombre = dishName;
          }
        } else {
          dishTotals.set(dishKey, {
            nombre: dishName,
            cantidad: quantity,
            revenue,
          });
        }

        const categoryBase =
          (typeof item.categoria === "string" && item.categoria.trim()) ||
          (typeof item.tipo === "string" && item.tipo.trim()) ||
          "Sin categoría";
        const categoryKey = categoryBase;
        let sedeCategories = categoryRevenue.get(sedeKey);
        if (!sedeCategories) {
          sedeCategories = new Map<string, number>();
          categoryRevenue.set(sedeKey, sedeCategories);
        }
        sedeCategories.set(
          categoryKey,
          (sedeCategories.get(categoryKey) ?? 0) + revenue
        );
      });
    });

    const topSedeEntry = [...sedeTotals.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topDishEntry = [...dishTotals.entries()].sort((a, b) => {
      if (b[1].cantidad !== a[1].cantidad) {
        return b[1].cantidad - a[1].cantidad;
      }
      return b[1].revenue - a[1].revenue;
    })[0];
    const topUserEntry = [...userTotals.entries()].sort(
      (a, b) => b[1].total - a[1].total
    )[0];

    const ranking = [...categoryRevenue.entries()]
      .map(([sede, categories]) => {
        const categoryList = [...categories.entries()]
          .map(([category, total]) => ({category, total}))
          .sort((a, b) => b.total - a.total);
        const total = categoryList.reduce((acc, item) => acc + item.total, 0);
        return {sede, total, categories: categoryList};
      })
      .sort((a, b) => b.total - a.total);

    return {
      hasOrders: true,
      topSede: topSedeEntry
        ? {sede: topSedeEntry[0], total: topSedeEntry[1]}
        : null,
      topDish: topDishEntry
        ? {
            nombre: topDishEntry[1].nombre,
            cantidad: topDishEntry[1].cantidad,
            revenue: topDishEntry[1].revenue,
          }
        : null,
      topUser: topUserEntry
        ? {
            id: topUserEntry[0],
            displayName: topUserEntry[1].displayName,
            total: topUserEntry[1].total,
          }
        : null,
      ranking,
    };
  }, [pedidosHoy]);

  const resolveSedeName = useCallback(
    (sede: EncuestaMenuResultado["sede"]) => {
      if (!sede) return "Sede sin nombre";
      if (typeof sede === "string") {
        const trimmed = sede.trim();
        if (trimmed && sedeLookup[trimmed]) {
          return sedeLookup[trimmed];
        }
        return trimmed || "Sede sin nombre";
      }

      const id = sede._id ? sede._id.toString().trim() : "";
      if (id && sedeLookup[id]) {
        return sedeLookup[id];
      }

      const nombre = sede.nombre ? sede.nombre.toString().trim() : "";
      if (nombre) {
        return nombre;
      }

      return id || "Sede sin nombre";
    },
    [sedeLookup]
  );

  if (checkingAuth) {
    return <LoadingView />;
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Analíticas</h1>
          <p className="text-sm text-foreground-secondary">
            Análisis de métricas
          </p>
        </header>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Métricas del día
          </h2>
          {loading ? (
            <div className="rounded-xl border border-border bg-white p-6 text-sm text-foreground-secondary">
              Procesando ventas del día...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <p className="text-xs uppercase text-foreground-secondary">
                  Sede más popular
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {dailyMetrics.topSede
                    ? dailyMetrics.topSede.sede
                    : "Sin datos"}
                </p>
                <p className="mt-1 text-xs text-foreground-secondary">
                  {dailyMetrics.topSede
                    ? `Ingresos: ${formatCurrency(dailyMetrics.topSede.total)}`
                    : "No hay pedidos registrados hoy."}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <p className="text-xs uppercase text-foreground-secondary">
                  Plato más pedido
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {dailyMetrics.topDish
                    ? dailyMetrics.topDish.nombre
                    : "Sin datos"}
                </p>
                <p className="mt-1 text-xs text-foreground-secondary">
                  {dailyMetrics.topDish
                    ? `${dailyMetrics.topDish.cantidad} unidad${
                        dailyMetrics.topDish.cantidad === 1 ? "" : "es"
                      } · ${formatCurrency(dailyMetrics.topDish.revenue)}`
                    : "No hay pedidos registrados hoy."}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <p className="text-xs uppercase text-foreground-secondary">
                  Usuario más activo
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {dailyMetrics.topUser
                    ? dailyMetrics.topUser.displayName
                    : "Sin datos"}
                </p>
                <p className="mt-1 text-xs text-foreground-secondary">
                  {dailyMetrics.topUser
                    ? `Consumo: ${formatCurrency(dailyMetrics.topUser.total)}`
                    : "No hay pedidos registrados hoy."}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Ranking de ventas por categoría en cada sede
          </h2>
          {loading ? (
            <div className="rounded-xl border border-border bg-white p-6 text-sm text-foreground-secondary">
              Preparando ranking de categorías...
            </div>
          ) : dailyMetrics.ranking.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/40 p-6 text-sm text-foreground-secondary">
              No hay ventas registradas hoy.
            </div>
          ) : (
            <div className="space-y-4">
              {dailyMetrics.ranking.map(({sede, total, categories}) => (
                <div
                  key={sede}
                  className="rounded-xl border border-border bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {sede}
                      </h3>
                      <p className="text-sm text-foreground-secondary">
                        Ingresos totales: {formatCurrency(total)}
                      </p>
                    </div>
                  </div>
                  {categories.length === 0 ? (
                    <p className="text-sm text-foreground-secondary">
                      Sin ventas registradas para esta sede hoy.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {categories.map(({category, total: categoryTotal}) => (
                        <li
                          key={category}
                          className="flex items-center justify-between text-sm text-foreground"
                        >
                          <span className="capitalize text-foreground-secondary">
                            {category}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(categoryTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Encuestas</h2>
          <div className="grid gap-4 rounded-xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-foreground-secondary">
                Menús evaluados
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {resumenGlobal.totalMenus}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-foreground-secondary">
                Respuestas totales
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {resumenGlobal.totalEncuestas}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : resultados.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            Aún no hay encuestas registradas.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {resultados.map((resultado) => {
              const sedeNombre = resolveSedeName(resultado.sede);
              const totalRespuestas = Math.max(
                0,
                resultado.totalEncuestas ?? 0
              );
              const totalVotos = Math.max(
                0,
                resultado.totalVotos ??
                  resultado.opciones.reduce(
                    (acc, opcion) => acc + (opcion.votos ?? 0),
                    0
                  )
              );
              const sortedOpciones = [...resultado.opciones].sort(
                (a, b) => b.votos - a.votos
              );

              return (
                <article
                  key={resultado.menuId}
                  className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
                >
                  <header className="mb-4 flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-foreground-secondary">
                      {formatDate(resultado.fecha)}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      {sedeNombre}
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      {totalRespuestas} respuesta
                      {totalRespuestas === 1 ? "" : "s"}
                      {totalVotos > 0 && totalVotos !== totalRespuestas && (
                        <span className="ml-1 text-xs text-foreground-secondary/80">
                          · {totalVotos} voto{totalVotos === 1 ? "" : "s"}
                        </span>
                      )}
                    </p>
                  </header>

                  {sortedOpciones.length === 0 ? (
                    <div className="mt-auto rounded-lg border border-dashed border-border/50 bg-muted/30 p-4 text-sm text-foreground-secondary">
                      Este menú aún no tiene votos registrados.
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-4">
                      <div className="space-y-3">
                        {sortedOpciones.map((opcion, index) => {
                          const divisor = totalVotos || totalRespuestas || 1;
                          const porcentaje = divisor
                            ? Math.round(
                                (opcion.votos / divisor) * 100
                              )
                            : 0;

                          return (
                            <div
                              key={opcion.opcionId}
                              className="rounded-xl border border-border/40 bg-muted/20 p-3"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-foreground-secondary shadow-sm">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-foreground">
                                        {opcion.nombre}
                                      </p>
                                      {index === 0 && (
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                          Favorito
                                        </span>
                                      )}
                                    </div>
                                    {opcion.tipo && (
                                      <p className="text-xs uppercase tracking-wide text-foreground-secondary">
                                        {opcion.tipo}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right text-xs text-foreground-secondary">
                                  <p className="font-semibold text-foreground">
                                    {porcentaje}%
                                  </p>
                                  <p>
                                    {opcion.votos} voto
                                    {opcion.votos === 1 ? "" : "s"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/40">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{width: `${Math.min(porcentaje, 100)}%`}}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
