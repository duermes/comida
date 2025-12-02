"use client";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {
  UtensilsCrossed,
  ClipboardList,
  Star,
  Settings,
  Package,
  Users,
  BarChart3,
  LogOut,
} from "lucide-react";
import {logout} from "@/lib/api";
import {normalizeRoleSlug} from "@/lib/utils";

interface SidebarProps {
  user: any;
}

export default function Sidebar({user}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = normalizeRoleSlug(user?.rol) === "admin";

  const userMenuItems = [
    {href: "/home/menu", label: "Menú", icon: UtensilsCrossed},
    {href: "/home/orders", label: "Mis Reservas", icon: ClipboardList},
    {href: "/home/favorites", label: "Favoritos", icon: Star},
    {href: "/home/settings", label: "Configuración", icon: Settings},
  ];

  const adminMenuItems = [
    {href: "/home/products", label: "Gestionar Productos", icon: Package},
    {href: "/home/users", label: "Gestión de Usuarios", icon: Users},
    {
      href: "/home/analytics",
      label: "Análisis de Rendimiento",
      icon: BarChart3,
    },
    {href: "/home/settings", label: "Configuración", icon: Settings},
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      router.push("/");
    }
  };

  return (
    <aside className="w-20 bg-primary-dark flex flex-col items-center py-6 space-y-8 border-r border-border">
      <Link
        href="/home/menu"
        className="text-2xl font-bold text-white hover:opacity-80 transition-smooth"
      >
        <UtensilsCrossed size={28} />
      </Link>

      <nav className="flex-1 flex flex-col space-y-4">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-12 h-12 flex items-center justify-center rounded-lg transition-smooth ${
                pathname === item.href
                  ? "bg-primary text-white"
                  : "text-white/60 hover:text-white hover:bg-primary/20"
              }`}
              title={item.label}
            >
              <IconComponent size={24} />
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="w-12 h-12 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-error/20 transition-smooth"
      >
        <LogOut size={24} />
      </button>
    </aside>
  );
}
