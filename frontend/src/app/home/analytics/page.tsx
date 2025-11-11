"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {getResultadosEncuestas, type EncuestaMenuResultado} from "@/lib/api";

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

export default function AnalyticsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<EncuestaMenuResultado[]>([]);

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

    const loadResultados = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getResultadosEncuestas();
        setResultados(response);
      } catch (err) {
        console.error("Error al cargar analíticas:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar las encuestas"
        );
      } finally {
        setLoading(false);
      }
    };

    loadResultados();
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
          <h1 className="text-3xl font-bold text-foreground">
            Analíticas de encuestas
          </h1>
          <p className="text-sm text-foreground-secondary">
            Resultados agregados de las encuestas rápidas por menú.
          </p>
        </header>

        <section className="grid gap-4 rounded-xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="space-y-6">
            {resultados.map((resultado) => (
              <section
                key={resultado.menuId}
                className="rounded-xl border border-border bg-white p-6 shadow-sm"
              >
                <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {resultado.sede}
                    </h2>
                    <p className="text-sm text-foreground-secondary">
                      {formatDate(resultado.fecha)} · {resultado.totalEncuestas}{" "}
                      respuesta
                      {resultado.totalEncuestas === 1 ? "" : "s"}
                    </p>
                  </div>
                </header>
                <div className="space-y-2">
                  {resultado.opciones.length === 0 ? (
                    <p className="text-sm text-foreground-secondary">
                      Este menú aún no tiene votos registrados.
                    </p>
                  ) : (
                    resultado.opciones.map((opcion) => {
                      const porcentaje = resultado.totalEncuestas
                        ? Math.round(
                            (opcion.votos / resultado.totalEncuestas) * 100
                          )
                        : 0;
                      return (
                        <div
                          key={opcion.opcionId}
                          className="rounded-lg border border-border/60 bg-muted/30 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {opcion.nombre}
                              </p>
                              {opcion.tipo && (
                                <p className="text-xs uppercase text-foreground-secondary">
                                  {opcion.tipo}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-foreground-secondary">
                              <p className="font-semibold text-foreground">
                                {opcion.votos} voto
                                {opcion.votos === 1 ? "" : "s"}
                              </p>
                              <p>{porcentaje}%</p>
                            </div>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{width: `${Math.min(porcentaje, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
