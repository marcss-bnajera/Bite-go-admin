`use strict`

import { Schema, model } from 'mongoose';

const suppliesInventorySchema = new Schema({
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'El restaurante es obligatorio']
    },
    nombre_insumo: {
        type: String,
        required: [true, 'El nombre del insumo es obligatorio'],
        trim: true
    },
    stock_actual: {
        type: Number,
        required: true,
        default: 0
    },
    stock_minimo: {
        type: Number,
        required: true,
        default: 0
    },

    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

suppliesInventorySchema.index({ id_restaurante: 1, nombre_insumo: 1 }, { unique: true });

export default model('SuppliesInventory', suppliesInventorySchema);