"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {useRouter} from "next/navigation";
import {
  crearUsuario,
  getRoles,
  getUsuarios,
  type CrearUsuarioPayload,
  type RolItem,
  type UsuarioItem,
} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {normalizeRoleSlug} from "@/lib/utils";

const DEFAULT_ROLE_LABELS: Record<string, string> = {
  admin: "admin",
  coordinador: "coordinador",
  profesor: "profesor",
  usuario: "usuario",
};

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function normalizeRoleLabel(raw?: string | null) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || objectIdRegex.test(trimmed)) return null;

  const lower = trimmed.toLowerCase();
  return DEFAULT_ROLE_LABELS[lower] ?? trimmed;
}

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
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<CrearUsuarioPayload>(
    createEmptyUserForm()
  );

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
      if (normalizeRoleSlug(parsed?.rol) !== "admin") {
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

  const loadUsuarios = useCallback(async () => {
    if (!authorized) return;
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
  }, [authorized]);

  const loadRoles = useCallback(async () => {
    if (!authorized) return;
    setRolesError(null);
    try {
      const response = await getRoles();
      setRoles(response);
    } catch (err) {
      console.error("Error al obtener roles:", err);
      setRolesError("No se pudieron cargar los roles disponibles");
    }
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    loadUsuarios();
    loadRoles();
  }, [authorized, loadUsuarios, loadRoles]);

  useEffect(() => {
    if (roles.length === 0) return;
    setFormState((prev) => {
      if (prev.rol) return prev;
      return {...prev, rol: roles[0]._id};
    });
  }, [roles]);

  const usuarioRoleNamesById = useMemo(() => {
    const map = new Map<string, string>();
    usuarios.forEach((usuario) => {
      const rolValue = usuario.rol;
      if (!rolValue) return;

      if (typeof rolValue === "string") {
        map.set(rolValue, rolValue);
        return;
      }

      const key = rolValue._id ?? rolValue.nombre;
      if (!key) return;
      const candidate = rolValue.nombre ?? key;
      map.set(key, candidate);
    });
    return map;
  }, [usuarios]);

  const resolvedRoleLabels = useMemo(() => {
    const remainingSlugs = new Set(Object.keys(DEFAULT_ROLE_LABELS));
    const labelMap = new Map<string, string>();
    const roleLookup = new Map(roles.map((role) => [role._id, role]));

    const orderedIds: string[] = [];
    const seenIds = new Set<string>();
    const enqueueId = (id?: string | null) => {
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);
      orderedIds.push(id);
    };

    roles.forEach((role) => enqueueId(role._id));
    usuarioRoleNamesById.forEach((_, id) => enqueueId(id));

    const registerSlug = (value?: string | null) => {
      const normalized = normalizeRoleLabel(value);
      if (normalized) {
        remainingSlugs.delete(normalized.toLowerCase());
      }
      return normalized;
    };

    orderedIds.forEach((id) => {
      const role = roleLookup.get(id);
      const candidates = [
        role?.nombre,
        role?.descripcion,
        usuarioRoleNamesById.get(id),
      ];

      for (const candidate of candidates) {
        const normalized = registerSlug(candidate);
        if (normalized) {
          labelMap.set(id, normalized);
          break;
        }
      }

      if (!labelMap.has(id)) {
        labelMap.set(id, "");
      }
    });

    labelMap.forEach((label, id) => {
      if (label) return;
      const iterator = remainingSlugs.values().next();
      const slug = iterator.value as string | undefined;
      if (slug) {
        remainingSlugs.delete(slug);
        labelMap.set(id, DEFAULT_ROLE_LABELS[slug]);
      } else {
        labelMap.set(id, usuarioRoleNamesById.get(id) ?? id);
      }
    });

    return labelMap;
  }, [roles, usuarioRoleNamesById]);

  const formatRoleDisplay = useCallback((value?: string | null) => {
    return normalizeRoleLabel(value) ?? value ?? "";
  }, []);

  const getRolNombre = useCallback(
    (usuario: UsuarioItem) => {
      if (!usuario.rol) return "";
      if (typeof usuario.rol === "string") {
        return (
          resolvedRoleLabels.get(usuario.rol) ??
          formatRoleDisplay(usuario.rol)
        );
      }
      const populatedId = usuario.rol._id;
      if (populatedId) {
        return (
          resolvedRoleLabels.get(populatedId) ??
          formatRoleDisplay(usuario.rol.nombre)
        );
      }
      return formatRoleDisplay(usuario.rol.nombre);
    },
    [resolvedRoleLabels, formatRoleDisplay]
  );

  const getDniNumero = useCallback((usuario: UsuarioItem) => {
    if (!usuario.dni) return "";
    if (typeof usuario.dni === "string") return usuario.dni;
    return usuario.dni?.numero ?? "";
  }, []);

  const filteredUsuarios = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return usuarios;

    return usuarios.filter((usuario) => {
      const dniNumero = getDniNumero(usuario);
      const rolNombre = getRolNombre(usuario);
      const values = [
        usuario.nombre,
        rolNombre,
        usuario.tipo,
        usuario.codigoUsu,
        dniNumero,
      ];

      return values.some((value) =>
        value ? value.toLowerCase().includes(term) : false
      );
    });
  }, [usuarios, searchTerm, getDniNumero, getRolNombre]);

  const roleOptions = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();
    const pushId = (id?: string | null) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      ids.push(id);
    };

    if (roles.length > 0) {
      roles.forEach((role) => pushId(role._id));
    } else {
      resolvedRoleLabels.forEach((_, id) => pushId(id));
    }

    return ids
      .map((id) => ({
        value: id,
        label: resolvedRoleLabels.get(id) ?? id,
      }))
      .filter((option) => Boolean(option.label))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [roles, resolvedRoleLabels]);

  const typeOptions = useMemo(() => {
    // Backend expects 'interno' or 'externo'
    const tipos = ["interno", "externo"];
    return Array.from(tipos).sort((a, b) => a.localeCompare(b));
  }, []);
  const handleFormInput = (field: keyof CrearUsuarioPayload, value: string) => {
    setFormState((prev) => ({...prev, [field]: value}));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const {name, value} = event.target;
    handleFormInput(name as keyof CrearUsuarioPayload, value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    
    const nombres = formState.nombres?.trim() ?? "";
    const apellidos = formState.apellidos?.trim() ?? "";
    const codigo = formState.codigoUsu?.trim().toLowerCase() ?? "";
    const numero = formState.numero?.trim().toLowerCase() ?? "";
    const password = formState.password?.trim() ?? "";
    const rol = formState.rol?.trim() ?? "";
    const tipo = formState.tipo?.trim() ?? "";
    const sede = formState.sede?.trim() ?? "";

    if (!nombres || !apellidos || !password) {
      setFormError("Completa los nombres, apellidos y contraseña obligatorios.");
      return;
    }

    if (!rol || !tipo) {
      setFormError("Selecciona el rol y el tipo de usuario");
      return;
    }

    if (!codigo && !numero) {
      setFormError("Ingresa al menos un identificador (código o DNI)");
      return;
    }

    setIsCreating(true);
    try {
      const created = await crearUsuario({
        nombres,
        apellidos,
        password,
        tipo,
        rol,
        numero,
        codigoUsu: codigo,
        sede: sede || undefined,
      });
      setShowAddModal(false);
      setFormState(createEmptyUserForm());
      const nombreCompleto = [created.nombres, created.apellidos]
        .filter(Boolean)
        .join(" ")
        .trim();
      setSuccessMessage(`Usuario ${nombreCompleto || created.dni} agregado correctamente.`);
      await loadUsuarios();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      setFormError(
        err instanceof Error ? err.message : "No se pudo crear el usuario"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openAddModal = () => {
    setFormError(null);
    setShowAddModal(true);
    const emptyForm = createEmptyUserForm();
    if (!emptyForm.rol && roles.length > 0) {
      emptyForm.rol = roles[0]._id;
    }
    setFormState(emptyForm);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormError(null);
  };

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
            Gestión de usuarios
          </h1>
          <p className="text-sm text-foreground-secondary">
            Listado de usuarios con acceso vigente al sistema.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-64 max-w-md">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, rol, correo o identificador"
            />
          </div>
          <Button
            onClick={openAddModal}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Agregar usuario
          </Button>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {rolesError && (
          <div className="rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-warning">
            {rolesError}
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : usuarios.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron usuarios activos.
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            {"No se encontraron coincidencias para "}
            <span className="font-medium">{`"${searchTerm}"`}</span>
            {"."}
          </div>
        ) : (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsuarios.map((usuario) => {
                  const rolNombre = getRolNombre(usuario) || "-";
                  const dniNumero = getDniNumero(usuario);
                  const identificadorPreferido =
                    usuario.codigoUsu?.trim() || dniNumero || "Sin identificador";
                  const identificadorFila =
                    usuario.codigoUsu?.trim() || dniNumero || "-";

                  return (
                    <tr key={usuario._id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {usuario.nombre}
                        </div>
                        <p className="text-xs text-foreground-secondary">
                          {identificadorPreferido}
                        </p>
                      </td>
                      <td className="px-4 py-3 capitalize text-foreground-secondary">
                        {rolNombre}
                      </td>
                      <td className="px-4 py-3 capitalize text-foreground-secondary">
                        {usuario.tipo}
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        {identificadorFila}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Agregar usuario
              </h2>
              <button
                onClick={closeAddModal}
                className="text-foreground-secondary hover:text-foreground transition-smooth text-2xl"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nombres
                  </label>
                  <Input
                    name="nombres"
                    value={formState.nombres}
                    onChange={handleInputChange}
                    placeholder="Ej. Ana María"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Apellidos
                  </label>
                  <Input
                    name="apellidos"
                    value={formState.apellidos}
                    onChange={handleInputChange}
                    placeholder="Ej. Salazar Quiroz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Código
                  </label>
                  <Input
                    name="codigoUsu"
                    value={formState.codigoUsu}
                    onChange={handleInputChange}
                    placeholder="usuario@dominio.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Rol
                  </label>
                  <Select
                    disabled={roleOptions.length === 0}
                    value={formState.rol}
                    onValueChange={(value) => handleFormInput("rol", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rolesError && (
                    <p className="text-xs text-warning">No se pudo actualizar el listado de roles. Intenta recargar.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Tipo
                  </label>
                  <Select
                    value={formState.tipo}
                    onValueChange={(value) => handleFormInput("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Número de documento (DNI u otro)
                  </label>
                  <Input
                    name="numero"
                    value={formState.numero}
                    onChange={handleInputChange}
                    placeholder="DNI del usuario"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Contraseña temporal*
                  </label>
                  <Input
                    name="password"
                    type="password"
                    value={formState.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAddModal}
                  className="border-border text-foreground"
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function createEmptyUserForm(): CrearUsuarioPayload {
  return {
    nombres: "",
    apellidos: "",
    password: "",
    tipo: "",
    codigoUsu: "",
    numero: "",
    rol: "",
    sede: "",
  };
}
