"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {getPlatosMenu, type PlatoMenuItem} from "@/lib/api";

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

export default function ProductsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platos, setPlatos] = useState<PlatoMenuItem[]>([]);

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

    const loadPlatos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPlatosMenu();
        setPlatos(response);
      } catch (err) {
        console.error("Error al cargar platos:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar los platos"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPlatos();
  }, [authorized]);

  const groupedPlatos = useMemo(() => {
    const map = new Map<string, PlatoMenuItem[]>();
    for (const plato of platos) {
      const key = plato.sede ?? "General";
      const list = map.get(key) ?? [];
      list.push(plato);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([sede, items]) => ({
      sede,
      items: items.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    }));
  }, [platos]);

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
            Gestión de productos
          </h1>
          <p className="text-sm text-foreground-secondary">
            Lista de platos disponibles en cada sede.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : (
          <div className="space-y-8">
            {groupedPlatos.map(({sede, items}) => (
              <section key={sede} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {sede}
                  </h2>
                  <p className="text-xs text-foreground-secondary">
                    {items.length} plato{items.length === 1 ? "" : "s"}{" "}
                    registrados
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-white">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {items.map((plato) => (
                        <tr key={plato._id} className="hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {plato.nombre}
                            </div>
                            {plato.descripcion && (
                              <p className="text-xs text-foreground-secondary">
                                {plato.descripcion}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 capitalize text-foreground-secondary">
                            {plato.tipo}
                          </td>
                          <td className="px-4 py-3 text-foreground-secondary">
                            {plato.stock}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                plato.activo
                                  ? "bg-success/10 text-success"
                                  : "bg-error/10 text-error"
                              }`}
                            >
                              {plato.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

            {groupedPlatos.length === 0 && (
              <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
                No se encontraron platos registrados.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
