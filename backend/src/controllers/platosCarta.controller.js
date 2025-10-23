import PlatoCarta from "../models/platosCarta.model.js";
import { ROLES } from "../lib/utils.js";

class PlatoCartaController {

  // Crear plato
  static async crearPlato(req, reply) {
    try {
      const usuario = req.user; // { id, rol, sede }

      if (!usuario || (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD))
        return reply.code(403).send({ error: "No tienes permisos para crear platos" });

      // Si es coordinador, fuerza que el plato pertenezca a SU sede
      if (usuario.rol === ROLES.COORD) {
        req.body.sede = usuario.sede;
      }

      const nuevoPlato = await PlatoCarta.create(req.body);
      return reply.code(201).send(nuevoPlato);

    } catch (error) {
      console.error("Error al crear plato:", error);
      reply.code(500).send({ error: "Error al crear plato" });
    }
  }

  // Listar platos (usuarios pueden ver todo lo activo)
  static async listarPlatos(req, reply) {
    try {
      const usuario = req.user;

      const filtros = { activo: true };

      // Si es coordinador, solo puede ver platos de su sede
      if (usuario?.rol === ROLES.COORD) {
        filtros.sede = usuario.sede;
      }

      const platos = await PlatoCarta.find(filtros);
      return reply.send(platos);

    } catch (error) {
      reply.code(500).send({ error: "Error al listar platos" });
    }
  }

  // Actualizar plato
  static async actualizarPlato(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;

      if (!usuario || (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD))
        return reply.code(403).send({ error: "No tienes permisos para actualizar platos" });

      const plato = await PlatoCarta.findById(id);
      if (!plato) return reply.code(404).send({ error: "Plato no encontrado" });

      if (usuario.rol === ROLES.COORD && plato.sede !== usuario.sede)
        return reply.code(403).send({ error: "Solo puedes modificar platos de tu sede" });

      Object.assign(plato, req.body);
      await plato.save();

      reply.send(plato);

    } catch (error) {
      reply.code(500).send({ error: "Error al actualizar plato" });
    }
  }

  // Eliminar plato
  static async eliminarPlato(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;

      if (!usuario) return reply.code(401).send({ error: "No autenticado" });

      const plato = await PlatoCarta.findById(id);
      if (!plato) return reply.code(404).send({ error: "Plato no encontrado" });

      if (usuario.rol === ROLES.ADMIN || 
         (usuario.rol === ROLES.COORD && plato.sede === usuario.sede)) {
        await PlatoCarta.findByIdAndDelete(id);
        return reply.send({ message: "Plato eliminado" });
      }

      reply.code(403).send({ error: "No tienes permisos para eliminar este plato" });

    } catch (error) {
      reply.code(500).send({ error: "Error al eliminar plato" });
    }
  }
}

export default PlatoCartaController;
