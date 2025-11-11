"use client";

import {useRouter} from "next/navigation";
import {Bell, LogOut, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {logout} from "@/lib/api";

interface HeaderProps {
  user: any;
}

export default function Header({user}: HeaderProps) {
  const router = useRouter();

  const roleLabels: Record<string, string> = {
    usuario: "Estudiante",
    profesor: "Profesor",
    coordinador: "Coordinador",
    admin: "Administrador",
  };

  const displayRole = roleLabels[user?.rol] ?? "Usuario";
  const displayName = user?.nombre ?? "Usuario";

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
    <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-primary">UTP+FOOD</h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary"
            size={18}
          />
          <Input
            type="text"
            placeholder="Buscar platos o comedores"
            className="pl-10 w-96"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-foreground-secondary hover:text-foreground transition-smooth">
          <Bell size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              Hola, {displayName}
            </p>
            <p className="text-xs text-foreground-secondary">{displayRole}</p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
            {displayName?.charAt(0)?.toUpperCase()}
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="ml-4 text-error hover:bg-error/10"
          >
            <LogOut size={18} className="mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
