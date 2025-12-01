"use client";

import {useEffect, useMemo, useState} from "react";
import MenuGrid, {type DisplayMenuItem} from "@/components/menu/menu-grid";
import ReservationSummary from "@/components/menu/reservation-summary";
import {
  getFavoritos,
  toggleFavorito,
  type FavoritoResponse,
  type PopulatedMenu,
} from "@/lib/api";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<DisplayMenuItem | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        const response = await getFavoritos();
        // Evitar duplicados por refId/tipo
        const unique = new Map<string, FavoritoResponse>();
        response.forEach((fav) => {
          const key = `${fav.tipo}:${String(fav.refId ?? "").trim()}`;
          if (!unique.has(key)) unique.set(key, fav);
        });
        setFavorites(Array.from(unique.values()));
      } catch (error) {
        console.error("Error al obtener favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const menuFavorites = useMemo(
    () =>
      favorites.filter(
        (fav): fav is FavoritoResponse & {tipo: "menu"} => fav.tipo === "menu"
      ),
    [favorites]
  );

  const items = useMemo<DisplayMenuItem[]>(() => {
    return menuFavorites.map((fav) => {
      const menu = fav.menu as PopulatedMenu;
      const formattedDate = new Date(menu.fecha).toLocaleDateString();
      const sedeLabel = menu.sedeNombre ?? menu.sede;
      const resolveImagen = () => {
        const fromFavorite =
          typeof fav.imagenUrl === "string" && fav.imagenUrl.trim().length > 0
            ? fav.imagenUrl.trim()
            : null;

        if (fromFavorite) return fromFavorite;

        const candidates = [
          menu.normal.segundo?.imagenUrl,
          menu.normal.entrada?.imagenUrl,
          menu.ejecutivo?.segundos?.[0]?.imagenUrl,
          menu.ejecutivo?.entradas?.[0]?.imagenUrl,
        ];

        for (const candidate of candidates) {
          if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate.trim();
          }
        }

        return undefined;
      };

      const image = resolveImagen();

      return {
        id: `${menu._id}-favorite`,
        menuId: menu._id,
        variant: "normal" as const,
        title: `Menú del día - ${formattedDate}`,
        description: [
          menu.normal.entrada?.nombre,
          menu.normal.segundo?.nombre,
          menu.normal.bebida?.nombre,
        ]
          .filter(Boolean)
          .join(" • "),
        price: menu.precioNormal,
        image,
        sede: sedeLabel,
        isFavorite: true,
        menu,
      };
    });
  }, [menuFavorites]);

  const handleToggleFavorite = async (menuId: string) => {
    try {
      await toggleFavorito(menuId, "menu");
      setFavorites((prev) =>
        prev.filter((fav) => fav.tipo !== "menu" || fav.refId !== menuId)
      );
    } catch (error) {
      console.error("Error al actualizar favoritos:", error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Mis Favoritos</h1>

      <MenuGrid
        items={items}
        isLoading={loading}
        onSelectDish={(dish) => setReservation(dish)}
        onToggleFavorite={handleToggleFavorite}
      />

      {reservation && (
        <ReservationSummary
          reservation={reservation}
          onClose={() => setReservation(null)}
        />
      )}
    </div>
  );
}
