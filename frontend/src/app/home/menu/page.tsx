"use client";

import {useEffect, useMemo, useState} from "react";
import MenuGrid, {type DisplayMenuItem} from "@/components/menu/menu-grid";
import MenuFilters from "@/components/menu/menu-filters";
import ReservationSummary from "@/components/menu/reservation-summary";
import {
  getFavoritos,
  getMenus,
  toggleFavorito,
  type FavoritoResponse,
  type PopulatedMenu,
} from "@/lib/api";

const CATEGORY_OPTIONS = [
  {value: "normal", label: "Menú universitario"},
  {value: "ejecutivo", label: "Menú ejecutivo"},
];

export default function MenuPage() {
  const [menus, setMenus] = useState<PopulatedMenu[]>([]);
  const [availableSedes, setAvailableSedes] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedSede, setSelectedSede] = useState("Todas");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORY_OPTIONS[0].value
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [reservation, setReservation] = useState<DisplayMenuItem | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMenus = async () => {
      setLoadingMenus(true);
      setError(null);
      try {
        const response = await getMenus(
          selectedSede === "Todas" ? {} : {sede: selectedSede}
        );
        setMenus(response);
        const sedes = Array.from(
          new Set(response.map((menu) => menu.sede))
        ).sort();
        setAvailableSedes(sedes);
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
  }, [selectedSede]);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoadingFavorites(true);
      try {
        const response = await getFavoritos();
        const favoriteMenus = response
          .filter(
            (fav): fav is FavoritoResponse & {tipo: "menu"} =>
              fav.tipo === "menu"
          )
          .map((fav) => fav.refId);
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
    try {
      await toggleFavorito(menuId, "menu");
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(menuId)) {
          next.delete(menuId);
        } else {
          next.add(menuId);
        }
        return next;
      });
    } catch (err) {
      console.error("Error al actualizar favoritos:", err);
    }
  };

  const items = useMemo<DisplayMenuItem[]>(() => {
    const term = searchTerm.trim().toLowerCase();

    return menus
      .filter((menu) => menu.activo)
      .flatMap<DisplayMenuItem>((menu) => {
        const formattedDate = new Date(menu.fecha).toLocaleDateString();

        const normalCard: DisplayMenuItem = {
          id: `${menu._id}-normal`,
          menuId: menu._id,
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
          sede: menu.sede,
          isFavorite: favorites.has(menu._id),
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
          id: `${menu._id}-ejecutivo`,
          menuId: menu._id,
          variant: "ejecutivo",
          title: `Menú ejecutivo - ${formattedDate}`,
          description: executiveDescription,
          price: menu.precioEjecutivo,
          image:
            menu.ejecutivo.segundos?.[0]?.imagenUrl ??
            menu.normal.segundo?.imagenUrl,
          sede: menu.sede,
          isFavorite: favorites.has(menu._id),
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

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 bg-linear-to-r from-warning to-accent-green rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">Oferta del Día</h2>
            <p className="text-sm opacity-90 mb-4">
              No te pierdas de nuestras increíbles ofertas especiales
            </p>
            <div className="flex items-center space-x-8">
              <div className="text-4xl font-bold">05:00:00</div>
              <button className="bg-white text-warning font-semibold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-smooth">
                Pedir ahora
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
              {error}
            </div>
          )}

          <MenuFilters
            sedes={["Todas", ...availableSedes]}
            categories={[...CATEGORY_OPTIONS, {value: "todos", label: "Todos"}]}
            selectedSede={selectedSede}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            onSedeChange={setSelectedSede}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchTerm}
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
        />
      )}
    </div>
  );
}
