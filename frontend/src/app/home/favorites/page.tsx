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
        setFavorites(response);
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
    return menuFavorites.flatMap((fav) => {
      const menu = fav.menu as PopulatedMenu;
      const formattedDate = new Date(menu.fecha).toLocaleDateString();

      return [
        {
          id: `${menu._id}-normal-favorite`,
          menuId: menu._id,
          variant: "normal" as const,
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
          isFavorite: true,
          menu,
        },
        {
          id: `${menu._id}-ejecutivo-favorite`,
          menuId: menu._id,
          variant: "ejecutivo" as const,
          title: `Menú ejecutivo - ${formattedDate}`,
          description: `${menu.ejecutivo.segundos.length} opciones de fondo`,
          price: menu.precioEjecutivo,
          image:
            menu.ejecutivo.segundos?.[0]?.imagenUrl ??
            menu.normal.segundo?.imagenUrl,
          sede: menu.sede,
          isFavorite: true,
          menu,
        },
      ];
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
