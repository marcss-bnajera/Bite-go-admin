import { Schema, model } from 'mongoose';
import { validateOrderAssignments } from '../../middlewares/order-logic-validators.js';

/**
 * ITEM PEDIDO (Subdocumento)
 */
const itemPedidoSchema = new Schema({
    id_producto: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El ID del producto es obligatorio']
    },
    nombre_historico: {
        type: String,
        required: true
    },
    cantidad: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [1, 'La cantidad mínima es 1'],
        default: 1
    },
    precio_historico: {
        type: Number,
        required: true
    },
    notas: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    _id: true
});

/**
 * PEDIDO 
 */
const orderSchema = new Schema({
    id_usuario_cliente: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El cliente es obligatorio']
    },
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'El restaurante es obligatorio']
    },
    id_mesero_asignado: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    id_repartidor_asignado: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    items: [itemPedidoSchema],

    total: {
        type: Number,
        required: true,
        default: 0
    },
    estado: {
        type: String,
        required: true,
        enum: ['Pendiente', 'Preparacion', 'Listo', 'Servido', 'Entregado', 'Cancelado'],
        default: 'Pendiente'
    },
    tipo_servicio: {
        type: String,
        required: true,
        enum: ['Comer aquí', 'Domicilio', 'Para llevar'],
        default: 'Comer aquí'
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

orderSchema.index({ id_usuario_cliente: 1, activo: 1 });
orderSchema.index({ id_restaurante: 1, estado: 1 });

orderSchema.pre('save', function (next) {
    if (typeof validateOrderAssignments === 'function') {
        return validateOrderAssignments.call(this, next);
    }
    next();
});

export default model('Order', orderSchema);