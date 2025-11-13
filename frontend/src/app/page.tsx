"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import {getProfile, isMfaChallenge, login} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (codigo: string, password: string) => {
    setIsLoading(true);
    try {
      const trimmedCodigo = codigo.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const result = await login(trimmedCodigo, trimmedPassword);

      if (isMfaChallenge(result)) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "mfaContext",
            JSON.stringify({
              mfaToken: result.mfaToken,
              identificador: result.identificador,
            })
          );
          window.localStorage.removeItem("user");
        }
        router.push("/mfa");
        return;
      }

      const profile = await getProfile();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(profile));
      }
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
