"use client";

import {useEffect, useMemo, useState} from "react";
import {format} from "date-fns";
import es from "date-fns/locale/es";
import type {DisplayMenuItem} from "@/components/menu/menu-grid";
import type {PedidoResponse} from "@/lib/api";
import {crearPedido, registrarEncuesta} from "@/lib/api";

interface ReservationSummaryProps {
  reservation: DisplayMenuItem;
  onClose: () => void;
  onOrderCreated?: (pedido: PedidoResponse) => void;
}

type ExecutiveSelection = {
  entrada?: string;
  segundo?: string;
  postre?: string;
  bebida?: string;
};

export default function ReservationSummary({
  reservation,
  onClose,
  onOrderCreated,
}: ReservationSummaryProps) {
  const [executiveSelection, setExecutiveSelection] =
    useState<ExecutiveSelection>({});
  const [surveySelection, setSurveySelection] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [surveyFeedback, setSurveyFeedback] = useState<string | null>(null);

  const menu = reservation.menu;

  const formattedDate = useMemo(() => {
    try {
      return format(new Date(menu.fecha), "PPP", {locale: es});
    } catch (error) {
      return "Fecha no disponible";
    }
  }, [menu.fecha]);

  useEffect(() => {
    if (reservation.variant === "ejecutivo") {
      setExecutiveSelection({
        entrada: menu.ejecutivo.entradas?.[0]?._id,
        segundo: menu.ejecutivo.segundos?.[0]?._id,
        postre: menu.ejecutivo.postres?.[0]?._id,
        bebida: menu.ejecutivo.bebidas?.[0]?._id,
      });
    } else {
      setExecutiveSelection({});
    }
    setSurveySelection([]);
    setFeedback(null);
    setSurveyFeedback(null);
  }, [reservation]);

  const handleExecutiveSelect = (
    field: keyof ExecutiveSelection,
    value: string
  ) => {
    setExecutiveSelection((prev) => ({...prev, [field]: value}));
  };

  const handleSurveyChange = (option: string) => {
    setSurveySelection((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      }
      return [...prev, option];
    });
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const pedido = await crearPedido({
        sede: menu.sede,
        items: [
          {
            refId: menu._id,
            tipo: "menu",
            cantidad: 1,
            precioUnitario: reservation.price,
          },
        ],
      });

      setFeedback("Reserva creada correctamente");
      onOrderCreated?.(pedido);
    } catch (error) {
      console.error("Error al crear reserva:", error);
      setFeedback(
        error instanceof Error ? error.message : "No se pudo crear la reserva"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSurveySubmit = async () => {
    if (!surveySelection.length) {
      setSurveyFeedback("Selecciona al menos una opción antes de votar");
      return;
    }

    setSurveySubmitting(true);
    setSurveyFeedback(null);
    try {
      await registrarEncuesta(menu._id, surveySelection);
      setSurveyFeedback("¡Gracias por votar!");
    } catch (error) {
      console.error("Error al registrar encuesta:", error);
      setSurveyFeedback(
        error instanceof Error ? error.message : "No se pudo registrar tu voto"
      );
    } finally {
      setSurveySubmitting(false);
    }
  };

  const executiveOptions = menu.ejecutivo ?? {
    entradas: [],
    segundos: [],
    postres: [],
    bebidas: [],
  };

  return (
    <aside className="w-96 bg-white border-l border-border overflow-auto p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Resumen de reserva
        </h2>
        <button
          onClick={onClose}
          className="text-foreground-secondary hover:text-foreground transition-smooth text-2xl"
          aria-label="Cerrar resumen de reserva"
        >
          ✕
        </button>
      </div>

      {reservation.variant === "ejecutivo" && (
        <div className="space-y-4 mb-6">
          <SelectField
            label="Seleccionar entrada"
            value={executiveSelection.entrada ?? ""}
            options={executiveOptions.entradas}
            onChange={(value) => handleExecutiveSelect("entrada", value)}
          />
          <SelectField
            label="Seleccionar segundo"
            value={executiveSelection.segundo ?? ""}
            options={executiveOptions.segundos}
            onChange={(value) => handleExecutiveSelect("segundo", value)}
          />
          <SelectField
            label="Seleccionar postre"
            value={executiveSelection.postre ?? ""}
            options={executiveOptions.postres}
            onChange={(value) => handleExecutiveSelect("postre", value)}
          />
          <SelectField
            label="Seleccionar bebida"
            value={executiveSelection.bebida ?? ""}
            options={executiveOptions.bebidas}
            onChange={(value) => handleExecutiveSelect("bebida", value)}
          />
        </div>
      )}

      {reservation.variant === "normal" && (
        <div className="mb-6 space-y-2">
          {[menu.normal.entrada, menu.normal.segundo, menu.normal.bebida]
            .filter(Boolean)
            .map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between text-sm text-foreground"
              >
                <span className="text-foreground-secondary capitalize">
                  {item.tipo}
                </span>
                <span className="font-medium">{item.nombre}</span>
              </div>
            ))}
        </div>
      )}

      <div className="space-y-3 mb-6 pb-6 border-b border-border text-sm">
        <InfoRow label="Menú" value={reservation.title} />
        <InfoRow label="Comedor" value={menu.sede} />
        <InfoRow label="Fecha" value={formattedDate} />
      </div>

      <div className="flex justify-between items-center mb-6 pb-6 border-b border-border">
        <span className="text-foreground-secondary">Subtotal:</span>
        <span className="text-xl font-bold text-primary">
          S/ {reservation.price.toFixed(2)}
        </span>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-2 bg-background-secondary rounded-lg text-sm text-foreground">
          {feedback}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <button
          onClick={handleCreateOrder}
          disabled={isSubmitting}
          className="w-full bg-error hover:bg-error/90 text-white font-semibold py-3 rounded-lg transition-smooth disabled:opacity-60"
        >
          {isSubmitting ? "Generando reserva..." : "Proceder al pago"}
        </button>
        <button
          onClick={onClose}
          className="w-full bg-error/20 hover:bg-error/30 text-error font-semibold py-3 rounded-lg transition-smooth"
        >
          Seguir comprando
        </button>
      </div>

      <div className="bg-background-secondary rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Encuesta rápida</h3>
        <p className="text-sm text-foreground-secondary mb-4">
          Porque nos importa tu opinión
        </p>
        <p className="text-sm font-medium text-foreground mb-4">
          ¿Qué plato te gustaría que incluyamos la próxima semana?
        </p>

        <div className="space-y-3 mb-4">
          {buildSurveyOptions(menu).map((option) => (
            <label
              key={option}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={surveySelection.includes(option)}
                onChange={() => handleSurveyChange(option)}
                className="w-4 h-4 rounded border-border cursor-pointer"
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>

        {surveyFeedback && (
          <p className="text-xs text-foreground-secondary mb-2">
            {surveyFeedback}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setSurveySelection([])}
            className="flex-1 bg-warning hover:bg-warning/90 text-foreground font-semibold py-2 rounded-lg transition-smooth text-sm"
          >
            Limpiar
          </button>
          <button
            onClick={handleSurveySubmit}
            disabled={surveySubmitting}
            className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg transition-smooth text-sm disabled:opacity-60"
          >
            {surveySubmitting ? "Enviando..." : "Votar"}
          </button>
        </div>
      </div>
    </aside>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{_id: string; nombre: string}>;
  onChange: (value: string) => void;
}

function SelectField({label, value, options, onChange}: SelectFieldProps) {
  const hasOptions = options.length > 0;

  return (
    <label className="block text-sm font-medium text-foreground">
      <span className="mb-2 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!hasOptions}
        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer disabled:cursor-not-allowed"
      >
        {hasOptions ? (
          options.map((option) => (
            <option key={option._id} value={option._id}>
              {option.nombre}
            </option>
          ))
        ) : (
          <option value="">No disponible</option>
        )}
      </select>
    </label>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({label, value}: InfoRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-foreground-secondary">{label}:</span>
      <span className="font-medium text-foreground text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function buildSurveyOptions(menu: DisplayMenuItem["menu"]): string[] {
  const opciones = new Set<string>();

  const addNombre = (plato?: {nombre?: string}) => {
    if (plato?.nombre) {
      opciones.add(plato.nombre);
    }
  };

  addNombre(menu.normal.entrada);
  addNombre(menu.normal.segundo);
  addNombre(menu.normal.bebida);

  (menu.ejecutivo?.entradas ?? []).forEach(addNombre);
  (menu.ejecutivo?.segundos ?? []).forEach(addNombre);
  (menu.ejecutivo?.postres ?? []).forEach(addNombre);
  (menu.ejecutivo?.bebidas ?? []).forEach(addNombre);

  return Array.from(opciones);
}
