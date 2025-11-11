"use client";

import {useEffect, useState} from "react";
import {getProfile, type UsuarioPerfil} from "@/lib/api";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UsuarioPerfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const result = await getProfile();
        setProfile(result);
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Configuración</h1>

      <div className="bg-white rounded-lg shadow-card p-8">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Datos personales
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({length: 4}).map((_, index) => (
              <div
                key={index}
                className="h-12 rounded-md bg-background-secondary animate-pulse"
              />
            ))}
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Nombre completo" value={profile.nombre} />
            <Field
              label="Código"
              value={profile.codigoUsu ?? "No disponible"}
            />
            <Field label="Documento" value={profile.dni ?? "No registrado"} />
            <Field label="Tipo" value={profile.tipo} />
            <Field label="Rol" value={profile.rol} />
            <Field label="Sede" value={profile.sede ?? "Sin sede"} />
          </div>
        ) : (
          <p className="text-foreground-secondary">
            No fue posible cargar tus datos.
          </p>
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({label, value}: FieldProps) {
  return (
    <label className="block text-sm font-medium text-foreground">
      <span className="mb-2 block">{label}</span>
      <input
        value={value}
        readOnly
        className="w-full px-4 py-3 border border-border rounded-lg bg-background-secondary text-foreground focus:outline-none"
      />
    </label>
  );
}
