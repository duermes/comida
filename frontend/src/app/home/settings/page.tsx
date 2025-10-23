"use client";

import type React from "react";

import {useState} from "react";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: "Cristhian",
    email: "cristhian@utp.edu.pe",
    phone: "+51 987 654 321",
    codigo: "CPacifico222257",
    carrera: "Ingeniería de Sistemas",
    ciclo: "VI",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos guardados:", formData);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Configuración</h1>

      <div className="bg-white rounded-lg shadow-card p-8">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Datos Personales
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Código UTP
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg bg-background-secondary text-foreground-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Carrera
              </label>
              <input
                type="text"
                name="carrera"
                value={formData.carrera}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ciclo
              </label>
              <input
                type="text"
                name="ciclo"
                value={formData.ciclo}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-smooth"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              className="flex-1 bg-background-secondary hover:bg-border text-foreground font-semibold py-3 rounded-lg transition-smooth"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
