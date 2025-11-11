"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {getUsuarios, type UsuarioItem} from "@/lib/api";

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

export default function UsersPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);

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

    const loadUsuarios = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getUsuarios({activo: true});
        setUsuarios(response.filter((usuario) => usuario.activo));
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar los usuarios"
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsuarios();
  }, [authorized]);

  if (checkingAuth) {
    return <LoadingView />;
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">
            Usuarios activos
          </h1>
          <p className="text-sm text-foreground-secondary">
            Listado de usuarios con acceso vigente al sistema.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : usuarios.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Identificador
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Sede
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {usuarios.map((usuario) => (
                  <tr key={usuario._id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {usuario.nombre}
                      </div>
                      <p className="text-xs text-foreground-secondary">
                        {usuario.dni ??
                          usuario.codigoUsu ??
                          "Sin identificador"}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground-secondary">
                      {usuario.rol}
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground-secondary">
                      {usuario.tipo}
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {usuario.codigoUsu ?? usuario.dni ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {usuario.sede ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron usuarios activos.
          </div>
        )}
      </div>
    </div>
  );
}
