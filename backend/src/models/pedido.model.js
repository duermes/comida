import mongoose from "mongoose";

// Plantilla para los items dentro del pedido
    const ItemPedidoSchema = new mongoose.Schema({
    refId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    tipo: { type: String, enum: ['menu', 'carta'], required: true }, 
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true },                
    notas: { type: String, maxlength: 255 }                          
    });

// Esquema principal del pedido
    const PedidoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

    sede: { type: String, required: true }, // Para saber dónde se recoge o entrega

// Plato o menú pedidos
    items: { type: [ItemPedidoSchema], required: true },

// Cálculo automático del total basado en los items
    total: { type: Number, required: true },

    estado: { 
        type: String, 
        enum: ['pendiente', 'pagado', 'preparando', 'listo', 'entregado', 'cancelado'], 
        default: 'pendiente' 
    },

    metodoPago: { 
        type: String, 
        enum: ['efectivo', 'tarjeta', 'yape', 'plin', 'otro', 'no_definido'], 
        default: 'no_definido'
    },

    creadoEn: { type: Date, default: Date.now }
    });

export default mongoose.model('Pedido', PedidoSchema);
