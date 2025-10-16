import Usuario from "../models/usuario.model.js";
import bcrypt from "bcrypt";
import { createAccessToken } from "../libs/jwt.js";

// Registro
export const register = async (req, reply) => {
  const { nombre, contraseña, tipo, codigoUsu, dni, rol } = req.body;

  try {
    // Verificar si ya existe un usuario con el mismo codigoUsu o dni
    const userFound = await Usuario.findOne({
      $or: [
        codigoUsu ? { codigoUsu } : null,
        dni ? { dni } : null
      ].filter(Boolean) // Evita nulls en la consulta
    });

    if (userFound) return reply.status(400).send({ message: "El usuario ya existe (DNI o Código duplicado)" });

    // Control de permisos para crear admin o coordinador
    let roleToAssign = "usuario";
    if (rol && ["admin", "coordinador"].includes(rol)) {
      if (!req.user || req.user.rol !== "admin") {
        return reply.status(403).send({ message: "Solo un admin puede crear otros admin o coordinadores" });
      }
      roleToAssign = rol;
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Crear el nuevo usuario
    const newUser = new Usuario({
      nombre,
      contraseña: hashedPassword,
      tipo,
      codigoUsu,
      dni,
      rol: roleToAssign
    });

    const savedUser = await newUser.save();

    // Crear token y enviarlo en cookie
    const token = await createAccessToken({ id: savedUser._id, rol: savedUser.rol });
    reply.setCookie("token", token, { httpOnly: true, sameSite: "strict", secure: false });

    reply.send({
      id: savedUser._id,
      identificador: savedUser.codigoUsu || savedUser.dni,
      rol: savedUser.rol
    });

  } catch (error) {
    reply.status(500).send({ message: "Error en el servidor", error });
  }
};

// Login
export const login = async (req, reply) => {
  const { identificador, contraseña } = req.body;

  try {
    const userFound = await Usuario.findOne({
      $or: [
        { codigoUsu: identificador },
        { dni: identificador }
      ]
    });

    if (!userFound) return reply.status(400).send({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(contraseña, userFound.contraseña);
    if (!isMatch) return reply.status(400).send({ message: "Contraseña incorrecta" });

    if (!userFound.activo) return reply.status(403).send({ message: "Usuario inactivo. Contacta con el administrador." });

    const token = await createAccessToken({ id: userFound._id, rol: userFound.rol });
    reply.setCookie("token", token, { httpOnly: true, sameSite: "strict", secure: false });

    reply.send({
      id: userFound._id,
      identificador: userFound.codigoUsu || userFound.dni,
      rol: userFound.rol
    });

  } catch (error) {
    reply.status(500).send({ message: "Error en el servidor", error });
  }
};

// Logout
export const logout = async (req, reply) => {
  reply.clearCookie("token");
  reply.send({ message: "Sesión cerrada" });
};
