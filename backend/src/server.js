//Llamada hacia el servidor Web
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import {connectDB} from "./db.js";

//Llamada hacia la base de datos
const PORT = process.env.PORT || 3000;

try {
//Conexión a la base de datos
  await connectDB();

//Iniciar el servidor web si es que la base de datos funciona
  app.listen(PORT, () => {
    console.log(`Web server running on port: ${PORT}`);
  });
} catch (err) {
  console.error("No se pudo iniciar el servidor por fallo en la base de datos");
  process.exit(1);
}