'use strict'

import { Schema, model } from 'mongoose';

const ajusteSchema = new Schema({
    cantidad: { type: Number, required: true },
    motivo: { type: String, trim: true, default: '' },
    fecha: { type: Date, default: Date.now }
}, { _id: false });

const suppliesInventorySchema = new Schema({
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'El restaurante es obligatorio']
    },
    id_sucursal: {
        type: String,
        default: ''
    },
    nombre_insumo: {
        type: String,
        required: [true, 'El nombre del insumo es obligatorio'],
        trim: true
    },
    stock_actual: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'El stock actual no puede ser negativo']
    },
    stock_minimo: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'El stock mínimo no puede ser negativo']
    },
    historial_ajustes: {
        type: [ajusteSchema],
        default: []
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

suppliesInventorySchema.index({ id_restaurante: 1, id_sucursal: 1, nombre_insumo: 1 }, { unique: true });

export default model('SuppliesInventory', suppliesInventorySchema);