`use strict`

import { Schema, model } from 'mongoose';

const mesaSchema = new Schema({
    numero: { type: Number, required: true },
    capacidad: { type: Number, required: true },
    ubicacion: { type: String, required: true },
    estado: {
        type: String,
        enum: ['Disponible', 'Ocupada', 'Reservada', 'Mantenimiento'],
        default: 'Disponible'
    }
});

const eventoSchema = new Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String },
    fechas: { type: [Date], required: true },
    servicios: { type: [String] }
});

const restaurantSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del restaurante es obligatorio'],
        unique: true, // Evita duplicados
        trim: true
    },
    direccion: {
        texto: { type: String, required: true },
    },
    horarios_atencion: { type: String, required: true },
    categoria_gastronomica: { type: String, required: true },
    fotos_url: { type: [String], default: [] },
    precio_promedio: { type: Number, required: true },
    informacion_contacto: {
        telefono: { type: String },
        email: { type: String }
    },
    mesas: [mesaSchema],
    eventos: [eventoSchema],
    activo: { type: Boolean, default: true }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

export default model('Restaurant', restaurantSchema);