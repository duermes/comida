import mongoose from "mongoose";

// Plantilla para los items dentro del pedido
    const ItemPedidoSchema = new mongoose.Schema({
    refId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    tipo: { type: String, enum: ['menu', 'carta'], required: true }, 
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true },                                       
    });

// Esquema principal del pedido
    const PedidoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

    sede: {type: mongoose.Schema.Types.ObjectId, ref: "Sede", required: true },

// Plato o menú pedidos
    items: { type: [ItemPedidoSchema], required: true },

// Cálculo automático del total basado en los items
    total: { type: Number, required: true },

    estado: { type: mongoose.Schema.Types.ObjectId, ref: "EstadoPedido", required: true },

    metodoPago: { type: mongoose.Schema.Types.ObjectId, ref: "MetodoPago", required: true },

    creadoEn: { type: Date, default: Date.now }
    });

export default mongoose.model('Pedido', PedidoSchema);
