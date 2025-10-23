import Usuario from "../models/usuario.model.js";
import { ROLES } from "../lib/utils.js";

class UsuarioController {

// Crear usuario
  static async crearUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user; // { id, rol } desde JWT
      const rolSolicitado = req.body.rol || ROLES.USER; 

      if (!usuarioLogueado) 
        return reply.code(401).send({ error: "No autenticado" });

      // Reglas de creación
      if (usuarioLogueado.rol === ROLES.ADMIN) {
        // Puede crear cualquier rol
      } else if (usuarioLogueado.rol === ROLES.COORD) {
        if (rolSolicitado !== ROLES.USER)
          return reply.code(403).send({ error: "Solo puedes crear usuarios con rol 'usuario'" });
      } else {
        return reply.code(403).send({ error: "No tienes permisos para crear usuarios" });
      }

      const nuevoUsuario = await Usuario.create(req.body);
      return reply.code(201).send(nuevoUsuario);

    } catch (error) {
      console.error("Error al crear usuario:", error);
      reply.code(500).send({ error: "Error al crear usuario" });
    }
  }

  // Listar usuarios
  static async listarUsuarios(req, reply) {
    try {
      const usuarioLogueado = req.user;

      if (!usuarioLogueado) 
        return reply.code(401).send({ error: "No autenticado" });

      if (usuarioLogueado.rol === ROLES.ADMIN || usuarioLogueado.rol === ROLES.COORD) {
        const usuarios = await Usuario.find();
        return reply.send(usuarios);
      }

      const yo = await Usuario.findById(usuarioLogueado.id);
      return reply.send([yo]);

    } catch (error) {
      reply.code(500).send({ error: "Error al listar usuarios" });
    }
  }

  // Activar / Desactivar usuario
  static async activarDesactivarUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const { userId } = req.params;
      const { activo } = req.body;

      const target = await Usuario.findById(userId);
      if (!target) return reply.code(404).send({ error: "Usuario no encontrado" });

      if (usuarioLogueado.rol === ROLES.ADMIN ||
         (usuarioLogueado.rol === ROLES.COORD && target.rol !== ROLES.ADMIN)) {

        target.activo = activo;
        await target.save();
        return reply.send(target);
      }

      reply.code(403).send({ error: "No puedes modificar este usuario" });

    } catch (error) {
      reply.code(500).send({ error: "Error al actualizar estado" });
    }
  }

  // Eliminar usuario
  static async eliminarUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const { userId } = req.params;

      if (usuarioLogueado.rol !== ROLES.ADMIN)
        return reply.code(403).send({ error: "Solo un admin puede eliminar usuarios" });

      await Usuario.findByIdAndDelete(userId);
      reply.send({ message: "Usuario eliminado" });

    } catch (error) {
      reply.code(500).send({ error: "Error al eliminar usuario" });
    }
  }
}

export default UsuarioController;
