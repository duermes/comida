import PlatoMenu from "../models/platosMenu.model.js";
import { ROLES } from "../lib/utils.js";

class PlatoMenuController {
  // Crear un nuevo plato (solo admin o coordinador de su sede)
  static async crearPlato(req, reply) {
    try {
      const usuario = req.user;
      if (!usuario) return reply.code(401).send({ error: "No autenticado" });

      if (![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol)) {
        return reply.code(403).send({ error: "No tienes permisos para crear platos" });
      }

      // Si es coordinador, asignar automáticamente su sede
      if (usuario.rol === ROLES.COORD) {
        req.body.sede = usuario.sede;
      }

      const nuevoPlato = await PlatoMenu.create(req.body);
      reply.code(201).send(nuevoPlato);

    } catch (error) {
      console.error("Error al crear plato de menú:", error);
      reply.code(500).send({ error: "Error en el servidor" });
    }
  }

  // Listar platos (admin ve todo, coordinador solo su sede, usuario error)
  static async listarPlatos(req, reply) {
    try {
      const usuario = req.user;
      if (!usuario) return reply.code(401).send({ error: "No autenticado" });

      if (usuario.rol === ROLES.ADMIN) {
        const platos = await PlatoMenu.find();
        return reply.send(platos);
      }

      if (usuario.rol === ROLES.COORD) {
        const platos = await PlatoMenu.find({ sede: usuario.sede });
        return reply.send(platos);
      }

      return reply.code(403).send({ error: "Solo personal autorizado" });

    } catch (error) {
      reply.code(500).send({ error: "Error al listar platos" });
    }
  }

  // Actualizar plato (solo admin o coordinador de su sede)
  static async actualizarPlato(req, reply) {
    try {
      const usuario = req.user;
      const { platoId } = req.params;

      if (![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol)) {
        return reply.code(403).send({ error: "No autorizado" });
      }

      const plato = await PlatoMenu.findById(platoId);
      if (!plato) return reply.code(404).send({ error: "Plato no encontrado" });

      if (usuario.rol === ROLES.COORD && plato.sede !== usuario.sede) {
        return reply.code(403).send({ error: "No puedes modificar platos de otra sede" });
      }

      Object.assign(plato, req.body);
      await plato.save();

      reply.send(plato);

    } catch (error) {
      reply.code(500).send({ error: "Error al actualizar plato" });
    }
  }

  // Eliminar plato (solo admin)
  static async eliminarPlato(req, reply) {
    try {
      const usuario = req.user;
      const { platoId } = req.params;

      if (usuario.rol !== ROLES.ADMIN) {
        return reply.code(403).send({ error: "Solo un admin puede eliminar platos" });
      }

      await PlatoMenu.findByIdAndDelete(platoId);
      reply.send({ message: "Plato eliminado" });

    } catch (error) {
      reply.code(500).send({ error: "Error al eliminar plato" });
    }
  }
}

export default PlatoMenuController;
