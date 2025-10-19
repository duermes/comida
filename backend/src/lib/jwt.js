import jwt from "jsonwebtoken";

// Funcion para crear un token JWT por 1 dia
export function createAccessToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    );
  });
}
