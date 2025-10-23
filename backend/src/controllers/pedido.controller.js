import Pedido from "../models/pedido.model.js";
import PlatoCarta from "../models/platosCarta.model.js";
import Menu from "../models/menu.model.js";
import { ROLES } from "../lib/utils.js";

class PedidoController {
  // Crear pedido
  static async crearPedido(req, reply) {
    try {
      const usuario = req.user;
      if (!usuario || usuario.rol !== ROLES.USER)
        return reply.code(403).send({ error: "Solo los usuarios pueden crear pedidos" });

      const { sede, items } = req.body;
      if (!sede || !items || !Array.isArray(items) || items.length === 0)
        return reply.code(400).send({ error: "Datos de pedido inválidos" });

      let total = 0;
      const itemsValidados = [];

      for (const item of items) {
        const { refId, tipo, cantidad, precioUnitario } = item;

        if (!refId || !tipo || !cantidad || !precioUnitario)
          return reply.code(400).send({ error: "Faltan campos en un item" });

        let producto;
        if (tipo === "carta") {
          producto = await PlatoCarta.findById(refId);
        } else if (tipo === "menu") {
          producto = await Menu.findById(refId);
        } else {
          return reply.code(400).send({ error: "Tipo de producto inválido" });
        }

        if (!producto || !producto.activo)
          return reply.code(404).send({ error: `Producto no disponible: ${refId}` });

        total += cantidad * precioUnitario;
        itemsValidados.push({ refId, tipo, cantidad, precioUnitario });
      }

      const nuevoPedido = await Pedido.create({
        usuarioId: usuario.id,
        sede,
        items: itemsValidados,
        total,
      });

      return reply.code(201).send(nuevoPedido);
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

    // Filtrado por rol
    if (usuario.rol === ROLES.USER) {
      filtros.usuarioId = usuario.id; // solo sus pedidos
    } else if (usuario.rol === ROLES.COORD) {
      filtros.sede = usuario.sede;
    } else if (usuario.rol === ROLES.ADMIN && sede) {
      filtros.sede = sede;
    }

    if (estado) filtros.estado = estado;

    if (fechaInicio || fechaFin) {
      filtros.creadoEn = {};
      if (fechaInicio) filtros.creadoEn.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.creadoEn.$lte = new Date(fechaFin);
    }

    // Buscamos los pedidos
    const pedidos = await Pedido.find(filtros)
      .populate("usuarioId", "nombre email")
      .sort({ creadoEn: -1 })
      .lean();

    // Solo añadimos imágenes si el usuario es de rol "usuario"
    if (usuario.rol === ROLES.USER) {
    // Recolectamos todos los IDs de refId para no consultar uno por uno
      const idsCarta = [];
      const idsMenu = [];

      for (const pedido of pedidos) {
        for (const item of pedido.items) {
          if (item.tipo === "carta") idsCarta.push(item.refId);
          else if (item.tipo === "menu") idsMenu.push(item.refId);
        }
      }

    // Cargamos todos los platos y menús en paralelo una sola consulta por tipo
      const [platosCarta, menus] = await Promise.all([
        PlatoCarta.find({ _id: { $in: idsCarta } }).select("nombre imagenUrl"),
        Menu.find({ _id: { $in: idsMenu } })
          .populate("normal.segundo", "nombre imagenUrl")
          .select("normal"),
      ]);

    // Creamos mapas rápidos para acceder por ID
      const mapaCarta = new Map(platosCarta.map(p => [p._id.toString(), p]));
      const mapaMenu = new Map(menus.map(m => [m._id.toString(), m]));

    // Recorremos nuevamente los pedidos y añadimos imagen y nombre
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

      if (!usuario || (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD))
        return reply.code(403).send({ error: "No tienes permisos para actualizar pedidos" });

      const pedido = await Pedido.findById(id);
      if (!pedido) return reply.code(404).send({ error: "Pedido no encontrado" });

      if (usuario.rol === ROLES.COORD && pedido.sede !== usuario.sede)
        return reply.code(403).send({ error: "No puedes modificar pedidos de otra sede" });

      const estadosValidos = ["pendiente", "pagado", "preparando", "listo", "entregado", "cancelado"];
      if (!estadosValidos.includes(estado))
        return reply.code(400).send({ error: "Estado no válido" });

      pedido.estado = estado;
      await pedido.save();

      reply.send(pedido);
    } catch (error) {
      console.error("Error al actualizar estado del pedido:", error);
      reply.code(500).send({ error: "Error al actualizar pedido" });
    }
  }

  // Eliminar pedido (solo admin)
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
