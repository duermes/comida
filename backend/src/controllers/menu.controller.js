import mongoose from "mongoose";
import Menu from "../models/menu.model.js";
import PlatoMenu from "../models/platosMenu.model.js";
import EncuestaRapida from "../models/encuestaRapida.model.js";
import {ROLES} from "../lib/utils.js";

class MenuController {
  // Crear menú
  static async crearMenu(req, reply) {
    try {
      const usuario = req.user; // { id, rol, sede }
      const {fecha, sede, precioNormal, precioEjecutivo, normal, ejecutivo} =
        req.body;

      if (
        !usuario ||
        (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD)
      ) {
        return reply
          .code(403)
          .send({error: "No tienes permisos para crear menús"});
      }

      // Forzar sede del coordinador
      const sedeAsignada = usuario.rol === ROLES.COORD ? usuario.sede : sede;

      // ---  Validación de platos ---
      const validarPlato = async (idPlato, tipo) => {
        const plato = await PlatoMenu.findById(idPlato);
        if (!plato) throw new Error(`El ${tipo} con ID ${idPlato} no existe`);
        if (!plato.activo)
          throw new Error(`El ${tipo} '${plato.nombre}' está inactivo`);
        if (plato.stock <= 0)
          throw new Error(
            `No hay stock suficiente para el ${tipo}: '${plato.nombre}'`
          );
      };

      // Menú normal
      await validarPlato(normal.entrada, "entrada del menú normal");
      await validarPlato(normal.segundo, "segundo del menú normal");
      await validarPlato(normal.bebida, "bebida del menú normal");

      // Menú ejecutivo
      const grupos = [
        {tipo: "entradas ejecutivas", arr: ejecutivo.entradas},
        {tipo: "segundos ejecutivos", arr: ejecutivo.segundos},
        {tipo: "postres ejecutivos", arr: ejecutivo.postres},
        {tipo: "bebidas ejecutivas", arr: ejecutivo.bebidas},
      ];

      for (const grupo of grupos) {
        for (const idPlato of grupo.arr) {
          await validarPlato(idPlato, grupo.tipo);
        }
      }

      const nuevoMenu = await Menu.create({
        fecha,
        sede: sedeAsignada,
        precioNormal,
        precioEjecutivo,
        normal,
        ejecutivo,
        activo: true,
      });

      reply.code(201).send(nuevoMenu);
    } catch (error) {
      console.error("Error al crear menú:", error);
      reply.code(400).send({error: error.message || "Error al crear menú"});
    }
  }

  // Listar menús
  static async listarMenus(req, reply) {
    try {
      const usuario = req.user;
      const {sede, fecha} = req.query;
      const filtros = {};

      // Usuarios: solo activos
      if (!usuario || usuario.rol === ROLES.USER) {
        filtros.activo = true;
        if (sede) filtros.sede = sede;
      }

      // Coordinador: su sede
      else if (usuario.rol === ROLES.COORD) {
        filtros.sede = usuario.sede;
      }

      // Admin: puede filtrar por sede
      else if (usuario.rol === ROLES.ADMIN && sede) {
        filtros.sede = sede;
      }

      if (fecha) filtros.fecha = new Date(fecha);

      const menus = await Menu.find(filtros)
        .populate({
          path: "normal.entrada normal.segundo normal.bebida ejecutivo.entradas ejecutivo.segundos ejecutivo.postres ejecutivo.bebidas",
          select: "nombre tipo stock activo descripcion imagenUrl",
        })
        .sort({fecha: -1});

      reply.send(menus);
    } catch (error) {
      console.error("Error al listar menús:", error);
      reply.code(500).send({error: "Error al listar menús"});
    }
  }

  // Actualizar menú
  static async actualizarMenu(req, reply) {
    try {
      const usuario = req.user;
      const {id} = req.params;
      const datos = req.body;

      if (
        !usuario ||
        (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD)
      ) {
        return reply
          .code(403)
          .send({error: "No tienes permisos para actualizar menús"});
      }

      const menu = await Menu.findById(id);
      if (!menu) return reply.code(404).send({error: "Menú no encontrado"});

      if (usuario.rol === ROLES.COORD && menu.sede !== usuario.sede) {
        return reply
          .code(403)
          .send({error: "Solo puedes modificar menús de tu sede"});
      }

      Object.assign(menu, datos);
      await menu.save();

      reply.send(menu);
    } catch (error) {
      console.error("Error al actualizar menú:", error);
      reply.code(500).send({error: "Error al actualizar menú"});
    }
  }

  // Activar o desactivar menú
  static async cambiarEstado(req, reply) {
    try {
      const usuario = req.user;
      const {id} = req.params;
      const {activo} = req.body;

      if (
        !usuario ||
        (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD)
      ) {
        return reply
          .code(403)
          .send({error: "No tienes permisos para cambiar el estado del menú"});
      }

      const menu = await Menu.findById(id);
      if (!menu) return reply.code(404).send({error: "Menú no encontrado"});

      if (usuario.rol === ROLES.COORD && menu.sede !== usuario.sede) {
        return reply
          .code(403)
          .send({error: "Solo puedes cambiar menús de tu sede"});
      }

      menu.activo = activo;
      await menu.save();

      reply.send({
        message: `Menú ${activo ? "activado" : "desactivado"} correctamente`,
        menu,
      });
    } catch (error) {
      console.error("Error al cambiar estado del menú:", error);
      reply.code(500).send({error: "Error al cambiar estado del menú"});
    }
  }

  // Eliminar menú definitivamente
  static async eliminarMenu(req, reply) {
    try {
      const usuario = req.user;
      const {id} = req.params;

      if (
        !usuario ||
        (usuario.rol !== ROLES.ADMIN && usuario.rol !== ROLES.COORD)
      ) {
        return reply
          .code(403)
          .send({error: "No tienes permisos para eliminar menús"});
      }

      const menu = await Menu.findById(id);
      if (!menu) return reply.code(404).send({error: "Menú no encontrado"});

      if (usuario.rol === ROLES.COORD && menu.sede !== usuario.sede) {
        return reply
          .code(403)
          .send({error: "Solo puedes eliminar menús de tu sede"});
      }

      await Menu.findByIdAndDelete(id);
      reply.send({message: "Menú eliminado correctamente"});
    } catch (error) {
      console.error("Error al eliminar menú:", error);
      reply.code(500).send({error: "Error al eliminar menú"});
    }
  }

  // Registrar voto de encuesta rápida
  static async registrarEncuestaRapida(req, reply) {
    try {
      const usuario = req.user;
      const {id: menuId} = req.params;
      const {opciones} = req.body;

      if (!usuario) {
        return reply.code(401).send({error: "No autenticado"});
      }

      if (!Array.isArray(opciones) || opciones.length === 0) {
        return reply
          .code(400)
          .send({error: "Debe seleccionar al menos una opción"});
      }

      const menu = await Menu.findById(menuId).select("_id");
      if (!menu) {
        return reply.code(404).send({error: "Menú no encontrado"});
      }

      const encuesta = await EncuestaRapida.findOneAndUpdate(
        {menuId, usuarioId: usuario.id},
        {menuId, usuarioId: usuario.id, opciones},
        {upsert: true, new: true, setDefaultsOnInsert: true}
      );

      reply.send({message: "Voto registrado correctamente", encuesta});
    } catch (error) {
      console.error("Error al registrar voto de encuesta:", error);
      if (error.code === 11000) {
        return reply.send({message: "Voto actualizado"});
      }
      reply.code(500).send({error: "Error al registrar voto"});
    }
  }

  static async obtenerResultadosEncuestas(req, reply) {
    try {
      const usuario = req.user;
      const {sede} = req.query;

      if (!usuario || usuario.rol !== ROLES.ADMIN) {
        return reply
          .code(403)
          .send({error: "Solo los administradores pueden ver las analíticas"});
      }

      const encuestas = await EncuestaRapida.find().lean();
      if (encuestas.length === 0) {
        return reply.send([]);
      }

      const menuIds = [
        ...new Set(encuestas.map((enc) => enc.menuId.toString())),
      ];

      const menuObjectIds = menuIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (!menuObjectIds.length) {
        return reply.send([]);
      }

      let menus = await Menu.find({_id: {$in: menuObjectIds}})
        .sort({fecha: -1})
        .select("fecha sede")
        .lean();

      if (sede) {
        menus = menus.filter((menu) => menu.sede === sede);
      }

      const menuIdSet = new Set(menus.map((menu) => menu._id.toString()));
      const filteredEncuestas = encuestas.filter((enc) =>
        menuIdSet.has(enc.menuId.toString())
      );

      if (filteredEncuestas.length === 0) {
        return reply.send([]);
      }

      const platoIds = new Set();
      for (const encuesta of filteredEncuestas) {
        for (const opcion of encuesta.opciones) {
          if (mongoose.Types.ObjectId.isValid(opcion)) {
            platoIds.add(opcion);
          }
        }
      }

      const platoObjectIds = [...platoIds].map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      const platos = platoObjectIds.length
        ? await PlatoMenu.find({_id: {$in: platoObjectIds}})
            .select("nombre tipo sede")
            .lean()
        : [];

      const platoMap = new Map(
        platos.map((plato) => [plato._id.toString(), plato])
      );

      const resultados = menus
        .map((menu) => {
          const encuestasMenu = filteredEncuestas.filter(
            (encuesta) => encuesta.menuId.toString() === menu._id.toString()
          );

          if (encuestasMenu.length === 0) return null;

          const contador = new Map();
          for (const encuesta of encuestasMenu) {
            for (const opcion of encuesta.opciones) {
              const key = opcion.toString();
              contador.set(key, (contador.get(key) || 0) + 1);
            }
          }

          const opciones = [...contador.entries()]
            .map(([opcionId, votos]) => {
              const plato = platoMap.get(opcionId);
              return {
                opcionId,
                nombre: plato?.nombre ?? opcionId,
                tipo: plato?.tipo ?? null,
                votos,
              };
            })
            .sort((a, b) => b.votos - a.votos);

          return {
            menuId: menu._id,
            fecha: menu.fecha,
            sede: menu.sede,
            totalEncuestas: encuestasMenu.length,
            opciones,
          };
        })
        .filter(Boolean);

      reply.send(resultados);
    } catch (error) {
      console.error("Error al obtener resultados de encuestas:", error);
      reply
        .code(500)
        .send({error: "Error al obtener resultados de las encuestas"});
    }
  }
}

export default MenuController;
