import mongoose from "mongoose";

const PlatoMenuSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, maxlength: 255 },
  tipo: { 
    type: String, 
    enum: ['entrada', 'segundo', 'postre', 'bebida'], 
    required: true 
  },
  imagenUrl: { type: String },
  sede: {type: mongoose.Schema.Types.ObjectId, ref: "Sede", required: true },
  stock: { type: Number, default: 0, min: 0 },
  activo: { type: Boolean, default: true }
});

// Middleware: si el stock llega a 0, desactiva el plato automáticamente
PlatoMenuSchema.pre("save", function (next) {
  const stockModificado = this.isModified("stock") || this.isNew;
  const activoModificado = this.isModified("activo");

  if (stockModificado && this.stock <= 0) {
    this.activo = false;
  } else if (stockModificado && this.stock > 0 && !activoModificado) {
    // Solo reactivar automáticamente cuando el cambio proviene del stock
    this.activo = true;
  }

  next();
});

export default mongoose.model('PlatoMenu', PlatoMenuSchema);
