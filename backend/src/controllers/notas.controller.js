import {Nota} from "../models/notas.model.js";
import PlatoCarta from "../models/platosCarta.model.js";
import PlatoMenu from "../models/platosMenu.model.js";
import { ROLES } from "../lib/utils.js";


class NotasController {

  // Crear nota
  static async crearNota(req, reply) {
    try {
      const usuario = req.user; // { id, rol, sede }
      const { productoId, descripcion, sede } = req.body;
    // sede es opcional, solo para admin
      if (!usuario || (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD)) {
        return reply.code(403).send({ error: "No tienes permisos para crear notas" });
      }

      // Validar sede el coordinador solo puede usar la suya
      let sedeAsignada = sede;
      if (usuario.rol === ROLES.COORD) {
        sedeAsignada = usuario.sede;
      }

      // Verificar que el producto exista en PlatoCarta o PlatoMenu
      const existeEnCarta = await PlatoCarta.findById(productoId);
      const existeEnMenu = await PlatoMenu.findById(productoId);

      if (!existeEnCarta && !existeEnMenu) {
        return reply.code(400).send({ error: "El productoId no existe en PlatoCarta ni en PlatoMenu" });
      }

    // Crear la nota
      const nuevaNota = await Nota.create({
        usuarioId: usuario.id,
        productoId,
        descripcion,
        sede: sedeAsignada
      });
    // Enviar respuesta
      return reply.code(201).send(nuevaNota);

    } catch (error) {
      console.error("Error al crear nota:", error);
      reply.code(500).send({ error: "Error al crear nota" });
    }
  }

  // Listar notas
  static async listarNotas(req, reply) {
    try {
    // Validar rol
      const usuario = req.user;
      if (!usuario || (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD)) {
        return reply.code(403).send({ error: "No tienes permisos para ver notas" });
      }
    // Filtros opcionales
      const { sede, fechaInicio, fechaFin } = req.query;
      const filtros = {};

    // Filtros por rol
      if (usuario.rol === ROLES.COORD) {
        filtros.sede = usuario.sede;
      } else if (usuario.rol === ROLES.ADMIN && sede) {
        filtros.sede = sede;
      }

    // Filtros por rango de fechas
      if (fechaInicio || fechaFin) {
        filtros.creadoEn = {};
        if (fechaInicio) filtros.creadoEn.$gte = new Date(fechaInicio);
        if (fechaFin) filtros.creadoEn.$lte = new Date(fechaFin);
      }
    // Consultar notas con filtros y popular usuarioId
      const notas = await Nota.find(filtros)
        .populate('usuarioId', 'nombre correo rol')
        .sort({ creadoEn: -1 });

      reply.send(notas);

    } catch (error) {
      console.error("Error al listar notas:", error);
      reply.code(500).send({ error: "Error al listar notas" });
    }
  }

  // Eliminar nota
  static async eliminarNota(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;
    // Validar rol
      if (!usuario || (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD)) {
        return reply.code(403).send({ error: "No tienes permisos para eliminar notas" });
      }
    // Verificar que la nota exista
      const nota = await Nota.findById(id);
      if (!nota) return reply.code(404).send({ error: "Nota no encontrada" });

    // Restricciones de rol
      if (usuario.rol === ROLES.COORD && nota.sede !== usuario.sede) {
        return reply.code(403).send({ error: "Solo puedes eliminar notas de tu sede" });
      }

      await Nota.findByIdAndDelete(id);
      reply.send({ message: "Nota eliminada correctamente" });

    } catch (error) {
      console.error("Error al eliminar nota:", error);
      reply.code(500).send({ error: "Error al eliminar nota" });
    }
  }
}

export default NotasController;
