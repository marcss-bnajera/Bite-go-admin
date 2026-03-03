`use strict`

import { Schema, model } from 'mongoose';

const categorySchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'El ID del restaurante es obligatorio']
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

export default model('Category', categorySchema);