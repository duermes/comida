import Pedido from "../models/pedido.model.js";
import PlatoCarta from "../models/platosCarta.model.js";
import Menu from "../models/menu.model.js";
import Sede from "../models/Sede.model.js";
import EstadoPedido from "../models/estadoPedido.model.js";
import MetodoPago from "../models/metodoPago.model.js";
import Usuario from "../models/usuario.model.js";
import { ROLES } from "../lib/utils.js";

class PedidoController {
  // Crear pedido
  static async crearPedido(req, reply) {
    try {
      const usuario = req.user;
      if (!usuario || usuario.rol !== ROLES.USER)
        return reply.code(403).send({ error: "Solo los usuarios pueden crear pedidos" });

      const { sede, items, metodoPago, estado } = req.body;
      if (!sede || !items?.length || !metodoPago || !estado)
        return reply.code(400).send({ error: "Datos de pedido incompletos" });

      // Validar referencias
      const sedeDoc = await Sede.findById(sede);
      if (!sedeDoc) return reply.code(400).send({ error: "Sede no existe" });

      const estadoDoc = await EstadoPedido.findById(estado);
      if (!estadoDoc) return reply.code(400).send({ error: "Estado de pedido inválido" });

      const metodoPagoDoc = await MetodoPago.findById(metodoPago);
      if (!metodoPagoDoc) return reply.code(400).send({ error: "Método de pago inválido" });

      let total = 0;
      const itemsValidados = [];

      for (const item of items) {
        const { refId, tipo, cantidad, precioUnitario } = item;
        if (!refId || !tipo || !cantidad || !precioUnitario)
          return reply.code(400).send({ error: "Faltan campos en un item" });

        let producto;
        if (tipo === "carta") producto = await PlatoCarta.findById(refId);
        else if (tipo === "menu") producto = await Menu.findById(refId);
        else return reply.code(400).send({ error: "Tipo de producto inválido" });

        if (!producto || !producto.activo)
          return reply.code(404).send({ error: `Producto no disponible: ${refId}` });

        total += cantidad * precioUnitario;
        itemsValidados.push({ refId, tipo, cantidad, precioUnitario });
      }

      const nuevoPedido = await Pedido.create({
        usuarioId: usuario.id,
        sede: sedeDoc._id,
        estado: estadoDoc._id,
        metodoPago: metodoPagoDoc._id,
        items: itemsValidados,
        total,
      });

      const pedidoPoblado = await Pedido.findById(nuevoPedido._id)
        .populate("usuarioId", "nombre email")
        .populate("sede", "nombre direccion")
        .populate("estado", "nombre")
        .populate("metodoPago", "nombre")
        .lean();

      reply.code(201).send(pedidoPoblado);
    } catch (error) {
      console.error("Error al crear pedido:", error);
      reply.code(500).send({ error: "Error al crear pedido" });
    }
  }

  // Listar pedidos
  static async listarPedidos(req, reply) {
    try {
      const usuario = req.user;
      const { sede, estado, fechaInicio, fechaFin } = req.query;
      const filtros = {};

      if (usuario.rol === ROLES.USER) filtros.usuarioId = usuario.id;
      else if (usuario.rol === ROLES.COORD) filtros.sede = usuario.sede;
      else if (usuario.rol === ROLES.ADMIN && sede) filtros.sede = sede;

      if (estado) filtros.estado = estado;
      if (fechaInicio || fechaFin) {
        filtros.creadoEn = {};
        if (fechaInicio) filtros.creadoEn.$gte = new Date(fechaInicio);
        if (fechaFin) filtros.creadoEn.$lte = new Date(fechaFin);
      }

      const pedidos = await Pedido.find(filtros)
        .populate("usuarioId", "nombre email")
        .populate("sede", "nombre direccion")
        .populate("estado", "nombre")
        .populate("metodoPago", "nombre")
        .sort({ creadoEn: -1 })
        .lean();

      // Poblado de items
      const idsCarta = [];
      const idsMenu = [];
      for (const pedido of pedidos) {
        for (const item of pedido.items) {
          if (item.tipo === "carta") idsCarta.push(item.refId);
          else if (item.tipo === "menu") idsMenu.push(item.refId);
        }
      }

      const [platosCarta, menus] = await Promise.all([
        PlatoCarta.find({ _id: { $in: idsCarta } }).select("nombre imagenUrl").lean(),
        Menu.find({ _id: { $in: idsMenu } })
          .populate("normal.segundo", "nombre imagenUrl")
          .select("normal")
          .lean(),
      ]);

      const mapaCarta = new Map(platosCarta.map(p => [p._id.toString(), p]));
      const mapaMenu = new Map(menus.map(m => [m._id.toString(), m]));

      for (const pedido of pedidos) {
        for (const item of pedido.items) {
          if (item.tipo === "carta") {
            const plato = mapaCarta.get(item.refId.toString());
            item.nombre = plato?.nombre || "Plato de carta";
            item.imagenUrl = plato?.imagenUrl || null;
          } else if (item.tipo === "menu") {
            const menu = mapaMenu.get(item.refId.toString());
            const segundo = menu?.normal?.segundo;
            item.nombre = segundo?.nombre || "Menú del día";
            item.imagenUrl = segundo?.imagenUrl || null;
          }
        }
      }

      reply.send(pedidos);
    } catch (error) {
      console.error("Error al listar pedidos:", error);
      reply.code(500).send({ error: "Error al listar pedidos" });
    }
  }

  // Actualizar estado
  static async actualizarEstado(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;
      const { estado } = req.body;

      if (!usuario || ![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol))
        return reply.code(403).send({ error: "No tienes permisos para actualizar pedidos" });

      const pedido = await Pedido.findById(id);
      if (!pedido) return reply.code(404).send({ error: "Pedido no encontrado" });

      if (usuario.rol === ROLES.COORD && pedido.sede.toString() !== usuario.sede)
        return reply.code(403).send({ error: "No puedes modificar pedidos de otra sede" });

      const estadoDoc = await EstadoPedido.findById(estado);
      if (!estadoDoc) return reply.code(400).send({ error: "Estado no válido" });

      pedido.estado = estadoDoc._id;
      await pedido.save();

      const pedidoPoblado = await Pedido.findById(pedido._id)
        .populate("usuarioId", "nombre email")
        .populate("sede", "nombre direccion")
        .populate("estado", "nombre")
        .populate("metodoPago", "nombre")
        .lean();

      reply.send(pedidoPoblado);
    } catch (error) {
      console.error("Error al actualizar estado del pedido:", error);
      reply.code(500).send({ error: "Error al actualizar pedido" });
    }
  }

  // Eliminar pedido
  static async eliminarPedido(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;
      if (usuario.rol !== ROLES.ADMIN)
        return reply.code(403).send({ error: "Solo el admin puede eliminar pedidos" });

      const pedido = await Pedido.findByIdAndDelete(id);
      if (!pedido) return reply.code(404).send({ error: "Pedido no encontrado" });

      reply.send({ message: "Pedido eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      reply.code(500).send({ error: "Error al eliminar pedido" });
    }
  }
}

export default PedidoController;
