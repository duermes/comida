import jwt from "jsonwebtoken";

export async function verifyToken(request, reply) {
  try {
    // Buscar token desde cookies o encabezado Authorization
    const token = request.cookies?.token || request.headers?.authorization?.split(" ")[1];

    if (!token) {
      return reply.code(401).send({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Agregamos los datos del usuario al request
    request.user = decoded;

  } catch (err) {
    return reply.code(401).send({ error: "Token inválido o expirado" });
  }
}
