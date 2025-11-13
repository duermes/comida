import mongoose from "mongoose";
import Usuario from "../models/usuario.model.js";
import Menu from "../models/menu.model.js";
import PlatoCarta from "../models/platosCarta.model.js";
import {ROLES} from "../lib/utils.js";

class UsuarioController {
  // Crear usuario
  static async crearUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user; // { id, rol } desde JWT
      const rolSolicitado = req.body.rol || ROLES.USER;

      if (!usuarioLogueado)
        return reply.code(401).send({error: "No autenticado"});

      // Reglas de creación
      if (usuarioLogueado.rol === ROLES.ADMIN) {
        // Puede crear cualquier rol
      } else if (usuarioLogueado.rol === ROLES.COORD) {
        if (rolSolicitado !== ROLES.USER)
          return reply
            .code(403)
            .send({error: "Solo puedes crear usuarios con rol 'usuario'"});
      } else {
        return reply
          .code(403)
          .send({error: "No tienes permisos para crear usuarios"});
      }

      const nuevoUsuario = await Usuario.create(req.body);
      return reply.code(201).send(nuevoUsuario);
    } catch (error) {
      console.error("Error al crear usuario:", error);
      reply.code(500).send({error: "Error al crear usuario"});
    }
  }

  // Listar usuarios
  static async listarUsuarios(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const {activo} = req.query;

      if (!usuarioLogueado)
        return reply.code(401).send({error: "No autenticado"});

      const filtros = {};
      if (typeof activo !== "undefined") {
        filtros.activo = activo === "true" || activo === true;
      }

      if (
        usuarioLogueado.rol === ROLES.ADMIN ||
        usuarioLogueado.rol === ROLES.COORD
      ) {
        if (
          usuarioLogueado.rol === ROLES.COORD &&
          typeof filtros.activo === "undefined"
        ) {
          filtros.activo = true;
        }

        const usuarios = await Usuario.find(filtros);
        return reply.send(usuarios);
      }

      const yo = await Usuario.findById(usuarioLogueado.id);
      return reply.send([yo]);
    } catch (error) {
      reply.code(500).send({error: "Error al listar usuarios"});
    }
  }

  // Activar / Desactivar usuario
  static async activarDesactivarUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const {userId} = req.params;
      const {activo} = req.body;

      const target = await Usuario.findById(userId);
      if (!target)
        return reply.code(404).send({error: "Usuario no encontrado"});

      if (
        usuarioLogueado.rol === ROLES.ADMIN ||
        (usuarioLogueado.rol === ROLES.COORD && target.rol !== ROLES.ADMIN)
      ) {
        target.activo = activo;
        await target.save();
        return reply.send(target);
      }

      reply.code(403).send({error: "No puedes modificar este usuario"});
    } catch (error) {
      reply.code(500).send({error: "Error al actualizar estado"});
    }
  }

  // Eliminar usuario
  static async eliminarUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const {userId} = req.params;

      if (usuarioLogueado.rol !== ROLES.ADMIN)
        return reply
          .code(403)
          .send({error: "Solo un admin puede eliminar usuarios"});

      await Usuario.findByIdAndDelete(userId);
      reply.send({message: "Usuario eliminado"});
    } catch (error) {
      reply.code(500).send({error: "Error al eliminar usuario"});
    }
  }

  static async obtenerFavoritos(req, reply) {
    try {
      const usuario = await Usuario.findById(req.user.id).lean();
      if (!usuario) {
        return reply.code(404).send({error: "Usuario no encontrado"});
      }

      const favoritos = Array.isArray(usuario.favoritos)
        ? usuario.favoritos
        : [];
      if (favoritos.length === 0) {
        return reply.send([]);
      }

      const menuIds = favoritos
        .filter((fav) => fav.tipo === "menu")
        .map((fav) => fav.refId);
      const cartaIds = favoritos
        .filter((fav) => fav.tipo === "carta")
        .map((fav) => fav.refId);

      const [menus, platosCarta] = await Promise.all([
        menuIds.length
          ? Menu.find({_id: {$in: menuIds}})
              .populate({
                path: "normal.entrada normal.segundo normal.bebida ejecutivo.entradas ejecutivo.segundos ejecutivo.postres ejecutivo.bebidas",
                select: "nombre tipo descripcion imagenUrl activo",
              })
              .lean()
          : [],
        cartaIds.length ? PlatoCarta.find({_id: {$in: cartaIds}}).lean() : [],
      ]);

      const menuMap = new Map(menus.map((menu) => [menu._id.toString(), menu]));
      const cartaMap = new Map(
        platosCarta.map((plato) => [plato._id.toString(), plato])
      );

      const favoritosDetallados = favoritos
        .filter((fav) => fav && fav.refId)
        .map((fav) => {
          const key = fav.refId.toString();
          if (fav.tipo === "menu") {
            const menu = menuMap.get(key);
            if (!menu) return null;
            return {tipo: "menu", refId: key, menu};
          }

          const plato = cartaMap.get(key);
          if (!plato) return null;
          return {tipo: "carta", refId: key, plato};
        })
        .filter(Boolean);

      reply.send(favoritosDetallados);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      reply.code(500).send({error: "Error al obtener favoritos"});
    }
  }

  static async toggleFavorito(req, reply) {
    try {
      const {refId, tipo} = req.body;
      if (!refId || !tipo) {
        return reply.code(400).send({error: "refId y tipo son requeridos"});
      }

      if (!["menu", "carta"].includes(tipo)) {
        return reply.code(400).send({error: "Tipo no válido"});
      }

      const usuario = await Usuario.findById(req.user.id);
      if (!usuario) {
        return reply.code(404).send({error: "Usuario no encontrado"});
      }

      if (!Array.isArray(usuario.favoritos)) {
        usuario.favoritos = [];
      }

      // Validar existencia del recurso
      if (tipo === "menu") {
        const menu = await Menu.findById(refId).select("_id");
        if (!menu) {
          return reply.code(404).send({error: "Menú no encontrado"});
        }
      } else {
        const plato = await PlatoCarta.findById(refId).select("_id");
        if (!plato) {
          return reply.code(404).send({error: "Plato no encontrado"});
        }
      }

      const index = usuario.favoritos.findIndex((fav) => {
        const favId =
          fav.refId instanceof mongoose.Types.ObjectId
            ? fav.refId.toString()
            : String(fav.refId);
        return favId === String(refId) && fav.tipo === tipo;
      });

      let action = "added";
      if (index >= 0) {
        usuario.favoritos.splice(index, 1);
        action = "removed";
      } else {
        usuario.favoritos.push({refId, tipo});
      }

      await usuario.save();

      reply.send({action, favoritos: usuario.favoritos});
    } catch (error) {
      console.error("Error al actualizar favoritos:", error);
      reply.code(500).send({error: "Error al actualizar favoritos"});
    }
  }
}

export default UsuarioController;
