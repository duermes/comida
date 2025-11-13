"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import {getProfile, login} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (codigo: string, password: string) => {
    setIsLoading(true);
    try {
      const trimmedCodigo = codigo.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const a = await login(trimmedCodigo, trimmedPassword);


      const profile = await getProfile();
      localStorage.setItem("user", JSON.stringify(profile));
      router.push("/home/menu");
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  );
}
