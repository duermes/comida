import mongoose from "mongoose";

const PlatoMenuSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, maxlength: 255 },

// Qué tipo de plato es: entrada, segundo, postre o bebida
  tipo: { 
    type: String, 
    enum: ['entrada', 'segundo', 'postre', 'bebida'], 
    required: true 
  },

// URL de la imagen del plato
  imagenUrl: { type: String },
  
// Sede a la que pertenece el plato (por defecto "general")
  sede: { type: String, default: "general" },

// Cantidad disponible para evitar sobreventa
  stock: { type: Number, default: 0, min: 0 },

// Campo para desactivar platos temporalmente
  activo: { type: Boolean, default: true }
});

export default mongoose.model('PlatoMenu', PlatoMenuSchema);
