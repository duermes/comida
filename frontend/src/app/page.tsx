"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (codigo: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulación de autenticación
      // luego llamar al API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      localStorage.setItem(
        "user",
        JSON.stringify({
          codigo,
          role: "user", 
          name: "Cristhian",
        }),
      )

      router.push("/home/menu")
    } catch (error) {
      console.error("Error en login:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  )
}
