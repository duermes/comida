"use client";

import {useMemo, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {PlatoMenuItem} from "@/lib/api";
import {crearMenu} from "@/lib/api";

interface Props {
  platos: PlatoMenuItem[];
  sedeOptions: string[];
  onCancel: () => void;
  onCreated?: () => void;
}

export default function CreateMenuForm({platos, sedeOptions, onCancel, onCreated}: Props) {
  const [fecha, setFecha] = useState("");
  const [precioNormal, setPrecioNormal] = useState<number>(0);
  const [precioEjecutivo, setPrecioEjecutivo] = useState<number>(0);
  const [selectedSedes, setSelectedSedes] = useState<string[]>([]);
  const [normalEntrada, setNormalEntrada] = useState("");
  const [normalSegundo, setNormalSegundo] = useState("");
  const [normalBebida, setNormalBebida] = useState("");

  const [ejEntradas, setEjEntradas] = useState<string[]>([]);
  const [ejSegundos, setEjSegundos] = useState<string[]>([]);
  const [ejPostres, setEjPostres] = useState<string[]>([]);
  const [ejBebidas, setEjBebidas] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entradas = useMemo(() => platos.filter((p) => p.tipo === "entrada"), [platos]);
  const segundos = useMemo(() => platos.filter((p) => p.tipo === "segundo"), [platos]);
  const postres = useMemo(() => platos.filter((p) => p.tipo === "postre"), [platos]);
  const bebidas = useMemo(() => platos.filter((p) => p.tipo === "bebida"), [platos]);

  const toggleArray = (arr: string[], setArr: (v: string[]) => void, id: string) => {
    if (arr.includes(id)) setArr(arr.filter((x) => x !== id));
    else setArr([...arr, id]);
  };

  const toggleSede = (sede: string) => {
    if (selectedSedes.includes(sede)) setSelectedSedes(selectedSedes.filter((s) => s !== sede));
    else setSelectedSedes([...selectedSedes, sede]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fecha || selectedSedes.length === 0) {
      setError("Fecha y al menos una sede son requeridos");
      return;
    }

    if (!normalEntrada || !normalSegundo || !normalBebida) {
      setError("Selecciona entrada, segundo y bebida para el menú normal");
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend soporta una sola sede por menú; crear uno por cada sede seleccionada
      for (const sede of selectedSedes) {
        await crearMenu({
          fecha,
          sede,
          precioNormal,
          precioEjecutivo,
          normal: {entrada: normalEntrada, segundo: normalSegundo, bebida: normalBebida},
          ejecutivo: {entradas: ejEntradas, segundos: ejSegundos, postres: ejPostres, bebidas: ejBebidas},
        });
      }

      onCreated?.();
    } catch (err) {
      console.error("Error creando menú:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-foreground">Fecha*</label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Sedes*</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {sedeOptions.map((sede) => (
              <label key={sede} className="inline-flex items-center gap-2">
                <input type="checkbox" checked={selectedSedes.includes(sede)} onChange={() => toggleSede(sede)} />
                <span className="text-sm">{sede}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Precio Normal (S/)</label>
          <Input type="number" step="0.01" value={precioNormal} onChange={(e) => setPrecioNormal(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Precio Ejecutivo (S/)</label>
          <Input type="number" step="0.01" value={precioEjecutivo} onChange={(e) => setPrecioEjecutivo(Number(e.target.value))} />
        </div>
      </div>

      <section>
        <h3 className="font-semibold">Menú Normal</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2">
          <div>
            <label className="text-sm">Entrada</label>
            <select value={normalEntrada} onChange={(e) => setNormalEntrada(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="">Seleccionar</option>
              {entradas.map((p) => (<option key={p._id} value={p._id}>{p.nombre} — {p.sede}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm">Segundo</label>
            <select value={normalSegundo} onChange={(e) => setNormalSegundo(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="">Seleccionar</option>
              {segundos.map((p) => (<option key={p._id} value={p._id}>{p.nombre} — {p.sede}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm">Bebida</label>
            <select value={normalBebida} onChange={(e) => setNormalBebida(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="">Seleccionar</option>
              {bebidas.map((p) => (<option key={p._id} value={p._id}>{p.nombre} — {p.sede}</option>))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mt-4">Menú Ejecutivo (opciones)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
          <div>
            <label className="text-sm font-medium">Entradas (elige varias)</label>
            <div className="max-h-32 overflow-auto border rounded-md p-2 mt-2">
              {entradas.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejEntradas.includes(p._id)} onChange={() => toggleArray(ejEntradas, setEjEntradas, p._id)} />
                  <span>{p.nombre} — {p.sede}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Segundos (elige varias)</label>
            <div className="max-h-32 overflow-auto border rounded-md p-2 mt-2">
              {segundos.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejSegundos.includes(p._id)} onChange={() => toggleArray(ejSegundos, setEjSegundos, p._id)} />
                  <span>{p.nombre} — {p.sede}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Postres (elige varias)</label>
            <div className="max-h-32 overflow-auto border rounded-md p-2 mt-2">
              {postres.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejPostres.includes(p._id)} onChange={() => toggleArray(ejPostres, setEjPostres, p._id)} />
                  <span>{p.nombre} — {p.sede}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Bebidas (elige varias)</label>
            <div className="max-h-32 overflow-auto border rounded-md p-2 mt-2">
              {bebidas.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejBebidas.includes(p._id)} onChange={() => toggleArray(ejBebidas, setEjBebidas, p._id)} />
                  <span>{p.nombre} — {p.sede}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <div className="text-sm text-error">{error}</div>}

      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear menú'}</Button>
      </div>
    </form>
  );
}
