import MenuController from "../controllers/menu.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

export default async function menuRoutes(fastify) {

  fastify.post("/", { preHandler: [verifyToken] }, MenuController.crearMenu);
  fastify.get("/", { preHandler: [verifyToken] }, MenuController.listarMenus);
  fastify.put("/:id", { preHandler: [verifyToken] }, MenuController.actualizarMenu);
  fastify.patch("/:id/estado", { preHandler: [verifyToken] }, MenuController.cambiarEstado);
  fastify.delete("/:id", { preHandler: [verifyToken] }, MenuController.eliminarMenu);
}
