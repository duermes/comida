"use client";

import {useEffect, useMemo, useState} from "react";
import MenuGrid, {type DisplayMenuItem} from "@/components/menu/menu-grid";
import MenuFilters from "@/components/menu/menu-filters";
import ReservationSummary from "@/components/menu/reservation-summary";
import {
  getFavoritos,
  getMenus,
  getProfile,
  toggleFavorito,
  type FavoritoResponse,
  type PopulatedMenu,
  type UsuarioPerfil,
} from "@/lib/api";
import {normalizeRoleSlug} from "@/lib/utils";

const CATEGORY_OPTIONS = [
  {value: "normal", label: "Menú universitario"},
  {value: "ejecutivo", label: "Menú ejecutivo"},
];

export default function MenuPage() {
  const [menus, setMenus] = useState<PopulatedMenu[]>([]);
  const [availableSedes, setAvailableSedes] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedSede, setSelectedSede] = useState("Todas");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORY_OPTIONS[0].value
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [reservation, setReservation] = useState<DisplayMenuItem | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UsuarioPerfil | null>(null);
  const userRole = normalizeRoleSlug(currentUser?.rol);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("user");
    if (!stored) return;
    try {
      const parsed: UsuarioPerfil = JSON.parse(stored);
      setCurrentUser(parsed);
    } catch (err) {
      console.error(
        "Error al cargar el usuario desde almacenamiento local:",
        err
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const syncProfile = async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;
        setCurrentUser(profile);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("user", JSON.stringify(profile));
        }
      } catch (err) {
        console.error("Error actualizando perfil:", err);
      }
    };

    syncProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadMenus = async () => {
      setLoadingMenus(true);
      setError(null);
      try {
        const getSedeLabel = (menu: PopulatedMenu) => {
          if (menu.sede && typeof menu.sede === "object" && "nombre" in menu.sede) {
            return (menu.sede as any).nombre as string;
          }
          return typeof menu.sede === "string" ? menu.sede : "";
        };

        const query: {sede?: string; fecha?: string} = {};
        if (selectedSede !== "Todas") {
          query.sede = selectedSede;
        }
        if (selectedDate) {
          query.fecha = selectedDate;
        }

        const response = await getMenus(query);
        setMenus(response);
        setAvailableSedes((prev) => {
          const next = new Set(prev);
          response.forEach((menu) => {
            const label = getSedeLabel(menu);
            if (label) next.add(label);
          });
          return Array.from(next).sort((a, b) => a.localeCompare(b));
        });
      } catch (err) {
        console.error("Error al obtener menús:", err);
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los menús"
        );
      } finally {
        setLoadingMenus(false);
      }
    };

    loadMenus();
  }, [selectedSede, selectedDate]);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoadingFavorites(true);
      try {
        // Evitar error de token cuando no hay sesión
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("authToken")
            : null;
        if (!token) {
          setFavorites(new Set());
          return;
        }
        const response = await getFavoritos();
        const favoriteMenus = response
          .filter(
            (fav): fav is FavoritoResponse & {tipo: "menu"} =>
              fav.tipo === "menu"
          )
          .map((fav) => String(fav.refId ?? "").trim())
          .filter((value) => value.length > 0);
        setFavorites(new Set(favoriteMenus));
      } catch (err) {
        console.error("Error al obtener favoritos:", err);
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    setReservation((current) => {
      if (!current) return current;
      const isFavorite = favorites.has(current.menuId);
      if (current.isFavorite === isFavorite) return current;
      return {...current, isFavorite};
    });
  }, [favorites]);

  const handleToggleFavorite = async (menuId: string) => {
    const normalizedId = String(menuId ?? "").trim();
    if (!normalizedId) {
      console.warn(
        "Se intentó actualizar un favorito sin identificador de menú"
      );
      return;
    }

    try {
      await toggleFavorito(normalizedId, "menu");
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(normalizedId)) {
          next.delete(normalizedId);
        } else {
          next.add(normalizedId);
        }
        return next;
      });
    } catch (err) {
      console.error("Error al actualizar favoritos:", err);
    }
  };

  const items = useMemo<DisplayMenuItem[]>(() => {
    const term = searchTerm.trim().toLowerCase();

    const getSedeLabel = (menu: PopulatedMenu) => {
      if (menu.sede && typeof menu.sede === "object" && "nombre" in menu.sede) {
        return (menu.sede as any).nombre as string;
      }
      return typeof menu.sede === "string" ? menu.sede : "";
    };

    return menus
      .filter((menu) => menu.activo)
      .flatMap<DisplayMenuItem>((menu) => {
        const rawMenuId = menu._id ?? menu.id;
        const menuId = rawMenuId ? String(rawMenuId).trim() : "";
        if (!menuId) {
          return [];
        }
        const formattedDate = new Date(menu.fecha).toLocaleDateString();
        const sedeLabel = getSedeLabel(menu);

        const normalCard: DisplayMenuItem = {
          id: `${menuId}-normal`,
          menuId,
          variant: "normal",
          title: `Menú universitario - ${formattedDate}`,
          description: [
            menu.normal.entrada?.nombre,
            menu.normal.segundo?.nombre,
            menu.normal.bebida?.nombre,
          ]
            .filter(Boolean)
            .join(" • "),
          price: menu.precioNormal,
          image:
            menu.normal.segundo?.imagenUrl ?? menu.normal.entrada?.imagenUrl,
          sede: sedeLabel,
          isFavorite: favorites.has(menuId),
          menu,
        };

        const executiveDescription = [
          menu.ejecutivo.entradas.length
            ? `${menu.ejecutivo.entradas.length} entradas`
            : null,
          menu.ejecutivo.segundos.length
            ? `${menu.ejecutivo.segundos.length} segundos`
            : null,
          menu.ejecutivo.postres.length
            ? `${menu.ejecutivo.postres.length} postres`
            : null,
          menu.ejecutivo.bebidas.length
            ? `${menu.ejecutivo.bebidas.length} bebidas`
            : null,
        ]
          .filter(Boolean)
          .join(" • ");

        const executiveCard: DisplayMenuItem = {
          id: `${menuId}-ejecutivo`,
          menuId,
          variant: "ejecutivo",
          title: `Menú ejecutivo - ${formattedDate}`,
          description: executiveDescription,
          price: menu.precioEjecutivo,
          image:
            menu.ejecutivo.segundos?.[0]?.imagenUrl ??
            menu.normal.segundo?.imagenUrl,
          sede: sedeLabel,
          isFavorite: favorites.has(menuId),
          menu,
        };

        const cards: DisplayMenuItem[] = [];
        if (selectedCategory === "normal" || selectedCategory === "todos") {
          cards.push(normalCard);
        }
        if (selectedCategory === "ejecutivo" || selectedCategory === "todos") {
          cards.push(executiveCard);
        }
        return cards;
      })
      .filter((card) => {
        if (selectedSede !== "Todas" && card.sede !== selectedSede) {
          return false;
        }
        if (!term) return true;
        const haystack = `${card.title} ${card.description}`.toLowerCase();
        return haystack.includes(term);
      });
  }, [menus, favorites, selectedCategory, selectedSede, searchTerm]);

  const totalMenusActivos = useMemo(
    () => menus.filter((menu) => menu.activo).length,
    [menus]
  );

  const filterChips = useMemo(() => {
    const chips: Array<{label: string; value: string}> = [];

    if (selectedSede !== "Todas") {
      chips.push({label: "Sede", value: selectedSede});
    }

    if (selectedDate) {
      const parsed = new Date(selectedDate);
      const formatted = Number.isNaN(parsed.getTime())
        ? selectedDate
        : parsed.toLocaleDateString();
      chips.push({label: "Fecha", value: formatted});
    }

    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch.length) {
      chips.push({label: "Búsqueda", value: `"${trimmedSearch}"`});
    }

    if (selectedCategory === "todos") {
      chips.push({label: "Tipo", value: "Todos"});
    } else if (selectedCategory !== CATEGORY_OPTIONS[0].value) {
      const selectedOption =
        CATEGORY_OPTIONS.find((option) => option.value === selectedCategory)?.label ??
        selectedCategory;
      chips.push({label: "Tipo", value: selectedOption});
    }

    return chips;
  }, [selectedSede, selectedDate, searchTerm, selectedCategory]);

  const displayedMenus = items.length;
  const favoritosGuardados = favorites.size;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-white to-transparent px-8 py-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-3xl font-semibold text-foreground">
                  Explora el menú del día
                </h2>
                <p className="text-sm text-foreground-secondary">
                  Personaliza la vista por sede, fecha y tipo de menú para encontrar tu mejor opción.
                </p>
              </div>
              <div className="grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white/60 px-5 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-foreground-secondary">
                    Menús publicados
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-primary">{totalMenusActivos}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/60 px-5 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-foreground-secondary">
                    Resultados actuales
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-primary">{displayedMenus}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/60 px-5 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-foreground-secondary">
                    Favoritos guardados
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-primary">{favoritosGuardados}</p>
                </div>
              </div>
            </div>
            {filterChips.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {filterChips.map((chip) => (
                  <span
                    key={`${chip.label}-${chip.value}`}
                    className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary"
                  >
                    <span className="font-medium">{chip.label}:</span>
                    <span>{chip.value}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-foreground-secondary">
                Usa los filtros para refinar tu búsqueda o descubre todas las opciones disponibles.
              </p>
            )}
          </section>

          {error && (
            <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
              {error}
            </div>
          )}

          <MenuFilters
            sedes={["Todas", ...availableSedes]}
            categories={[...CATEGORY_OPTIONS, {value: "todos", label: "Todos"}]}
            selectedSede={selectedSede}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            selectedDate={selectedDate}
            onSedeChange={setSelectedSede}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchTerm}
            onDateChange={setSelectedDate}
            showDatePicker={userRole === "coordinador"}
          />

          <MenuGrid
            items={items}
            isLoading={loadingMenus || loadingFavorites}
            onSelectDish={(dish) => setReservation(dish)}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </div>

      {reservation && (
        <ReservationSummary
          reservation={reservation}
          onClose={() => setReservation(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
