"use client"

import { useRouter } from "next/navigation"
import { Bell, LogOut, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  user: any
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-primary">UTP+FOOD</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary" size={18} />
          <Input type="text" placeholder="Buscar platos o comedores" className="pl-10 w-96" />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-foreground-secondary hover:text-foreground transition-smooth">
          <Bell size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Hola, {user?.name}</p>
            <p className="text-xs text-foreground-secondary">Estudiante</p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0)}
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="ml-4 text-error hover:bg-error/10">
            <LogOut size={18} className="mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}
