import Usuario from "../models/usuario.model.js";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import {createAccessToken, createMfaToken, verifyJwt} from "../lib/jwt.js";

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

    if (userFound.mfa_enabled && userFound.mfa_secret) {
      const mfaToken = await createMfaToken({
        id: userFound._id,
        rol: userFound.rol,
        mfa: true,
      });

      return reply.send({
        id: userFound._id,
        identificador: userFound.codigoUsu || userFound.dni,
        rol: userFound.rol,
        mfaRequired: true,
        mfaToken,
      });
    }

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

export const loginMfa = async (req, reply) => {
  const {mfaToken, code} = req.body;
  try {
    if (!mfaToken || !code) {
      return reply
        .status(400)
        .send({message: "Token MFA y código son requeridos"});
    }

    const decoded = await verifyJwt(mfaToken);
    if (!decoded?.id || !decoded?.mfa) {
      return reply.status(400).send({message: "Token MFA inválido"});
    }

    const user = await Usuario.findById(decoded.id);
    if (!user) {
      return reply.status(404).send({message: "Usuario no encontrado"});
    }

    if (!user.mfa_enabled || !user.mfa_secret) {
      return reply
        .status(400)
        .send({message: "El usuario no tiene 2FA habilitado"});
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return reply.status(400).send({message: "Código inválido"});
    }

    const token = await createAccessToken({
      id: user._id,
      rol: user.rol,
    });

    reply.send({
      id: user._id,
      identificador: user.codigoUsu || user.dni,
      rol: user.rol,
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

export const initiateMfaSetup = async (req, reply) => {
  try {
    const user = await Usuario.findById(req.user.id);
    if (!user) {
      return reply.status(404).send({message: "Usuario no encontrado"});
    }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `Sistema Reserva Menu (${user.nombre})`,
      issuer: "Sistema Reserva Menu",
    });

    user.mfa_secret = secret.base32;
    user.mfa_enabled = false;
    await user.save();

    reply.send({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    reply
      .status(500)
      .send({message: "Error generando configuración 2FA", error});
  }
};

export const verifyMfaSetup = async (req, reply) => {
  const {code} = req.body;

  if (!code) {
    return reply.status(400).send({message: "El código es requerido"});
  }

  try {
    const user = await Usuario.findById(req.user.id);
    if (!user || !user.mfa_secret) {
      return reply
        .status(400)
        .send({message: "No hay configuración 2FA pendiente"});
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return reply.status(400).send({message: "Código inválido"});
    }

    user.mfa_enabled = true;
    await user.save();

    reply.send({message: "Autenticación de dos factores activada"});
  } catch (error) {
    reply.status(500).send({message: "Error validando 2FA", error});
  }
};

export const disableMfa = async (req, reply) => {
  const {code} = req.body;

  try {
    const user = await Usuario.findById(req.user.id);
    if (!user) {
      return reply.status(404).send({message: "Usuario no encontrado"});
    }

    if (!user.mfa_enabled || !user.mfa_secret) {
      return reply.status(400).send({message: "2FA no está habilitado"});
    }

    if (!code) {
      return reply.status(400).send({message: "El código es requerido"});
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return reply.status(400).send({message: "Código inválido"});
    }

    user.mfa_enabled = false;
    user.mfa_secret = undefined;
    await user.save();

    reply.send({message: "Autenticación de dos factores desactivada"});
  } catch (error) {
    reply.status(500).send({message: "Error deshabilitando 2FA", error});
  }
};
