import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// Permitir cookies y solicitudes desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "", // tu URL del front
  credentials: true,
}));

// Para parsear JSON y cookies
app.use(express.json());
app.use(cookieParser());

export default app;
