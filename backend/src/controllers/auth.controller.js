import Usuario from "../models/usuario.model.js";
import bcrypt from "bcrypt";
import {createAccessToken} from "../lib/jwt.js";

// Registro
export const register = async (req, reply) => {
  const {nombre, password, tipo, codigoUsu, dni, rol} = req.body;

  try {
    // Verificar duplicados
    const userFound = await Usuario.findOne({
      $or: [codigoUsu ? {codigoUsu} : null, dni ? {dni} : null].filter(Boolean),
    });

    if (userFound) {
      return reply
        .status(400)
        .send({message: "El usuario ya existe (DNI o Código duplicado)"});
    }

    // Definir el rol a asignar
    let roleToAssign = "usuario";

    // Si NO hay token (usuario no autenticado), solo puede crearse como "usuario"
    if (!req.user) {
      // Ignorar cualquier intento de enviar rol manualmente
      roleToAssign = "usuario";
    } else {
      // Si HAY token, aplicar control de permisos
      if (rol) {
        if (["admin", "coordinador"].includes(rol)) {
          if (req.user.rol !== "admin") {
            return reply.status(403).send({
              message: "Solo un admin puede crear otros admin o coordinadores",
            });
          }
        } else if (rol === "profesor") {
          if (!["admin", "coordinador"].includes(req.user.rol)) {
            return reply.status(403).send({
              message: "Solo un admin o coordinador puede crear profesores",
            });
          }
        }
        roleToAssign = rol;
      }
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear y guardar el nuevo usuario
    const newUser = new Usuario({
      nombre,
      password: hashedPassword,
      tipo,
      codigoUsu,
      dni,
      rol: roleToAssign,
    });

    const savedUser = await newUser.save();

    let token = null;
    if (!req.user) {
      token = await createAccessToken({
        id: savedUser._id,
        rol: savedUser.rol,
      });
    }

    const payload = {
      id: savedUser._id,
      identificador: savedUser.codigoUsu || savedUser.dni,
      rol: savedUser.rol,
    };

    if (token) {
      payload.token = token;
    }

    reply.send(payload);
  } catch (error) {
    console.error("Error en register:", error);
    reply.status(500).send({message: "Error en el servidor", error});
  }
};

// Login
export const login = async (req, reply) => {
  const {identificador, password} = req.body;

  try {
    const userFound = await Usuario.findOne({
      $or: [{codigoUsu: identificador}, {dni: identificador}],
    });

    if (!userFound)
      return reply.status(400).send({message: "Usuario no encontrado"});

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch)
      return reply.status(400).send({message: "Contraseña incorrecta"});

    if (!userFound.activo)
      return reply
        .status(403)
        .send({message: "Usuario inactivo. Contacta con el administrador."});

    const token = await createAccessToken({
      id: userFound._id,
      rol: userFound.rol,
    });

    reply.send({
      id: userFound._id,
      identificador: userFound.codigoUsu || userFound.dni,
      rol: userFound.rol,
      token,
    });
  } catch (error) {
    reply.status(500).send({message: "Error en el servidor", error});
  }
};

// Logout
export const logout = async (req, reply) => {
  reply.clearCookie("token");
  reply.send({message: "Sesión cerrada"});
};

export const getPerfil = async (req, reply) => {
  try {
    const user = await Usuario.findById(req.user.id).select("-password");
    if (!user)
      return reply.status(404).send({message: "Usuario no encontrado"});

    reply.send({
      id: user._id,
      nombre: user.nombre,
      rol: user.rol,
      codigoUsu: user.codigoUsu,
      dni: user.dni,
      tipo: user.tipo,
    });
  } catch (error) {
    reply.status(500).send({message: "Error obteniendo perfil", error});
  }
};
