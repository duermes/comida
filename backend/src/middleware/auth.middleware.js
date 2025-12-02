// middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.model.js";
import { resolveRoleName } from "../lib/utils.js";

// Middleware para verificar el token JWT
export async function verificarToken(req, reply) {
  try {
    // Obtener el token desde la cookie
    const token = req.cookies.token;

    if (!token) {
      return reply.code(401).send({ message: "No autenticado" });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id).populate("rol");
    if (!usuario) {
      return reply.code(401).send({ message: "Usuario no encontrado" });
    }

    if (!usuario.activo) {
      return reply.code(403).send({ message: "Usuario inactivo" });
    }

    // Guardar la información del usuario en req.user
    const rolNombre = resolveRoleName(usuario.rol) ?? usuario.rol;

    req.user = {
      id: usuario._id,
      rol: rolNombre,
      sede: usuario.sede,
      nombre: usuario.nombre,
    };

  } catch (error) {
    console.error("Error en verificarToken:", error);
    return reply.code(401).send({ message: "Token inválido o expirado" });
  }
}

// Middleware para verificar roles
export const verificarRol = (rolesPermitidos = []) => {
  return async (req, reply) => {
    if (!req.user) return reply.code(401).send({ message: "No autenticado" });
    if (!rolesPermitidos.includes(req.user.rol)) {
      return reply.code(403).send({ message: "No tienes permisos para acceder a esta ruta" });
    }
  };
};
