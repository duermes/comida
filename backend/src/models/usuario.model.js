import mongoose from "mongoose";

const UsuarioSchema = new mongoose.Schema({
// Nombre y contraseña de usuario
  nombre: { type: String, required: true },
  contraseña: { type: String, required: true },

// Tipo de usuario: 'interno' o 'externo'
  tipo: { type: String, enum: ['interno', 'externo'], required: true },

// Código único del usuario (requerido para usuarios internos)
  codigoUsu: { 
    type: String, 
    required: function() { return this.tipo === 'interno'; }
  },

// DNI del usuario (requerido para usuarios externos e internos)
  dni: { 
    type: String, 
    required: function() { return this.tipo === 'externo' || this.tipo === 'interno'; }
  },

// Rol del usuario
  rol: { type: String, enum: ['usuario', 'admin', 'coordinador'], default: 'usuario' },

  // Sede a la que pertenece el usuario (solo para usuarios internos)
  sede: { type: String },

// Lista de platos favoritos del usuario
  favoritos: [{
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tipo: { type: String, enum: ['menu', 'carta'], required: true }
  }],
// Estado del usuario
  activo: { type: Boolean, default: true }
});

export default mongoose.model('Usuario', UsuarioSchema);