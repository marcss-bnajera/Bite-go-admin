'use strict'

import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
    },
    telefono: {
        type: String,
        trim: true
    },
    direccion: {
        type: String,
        trim: true
    },
    rol: {
        type: String,
        required: true,
        enum: ['SuperAdmin', 'Admin_Restaurante', 'Mesero', 'Repartidor', 'Cocinero', 'Cliente'],
        default: 'Cliente'
    },
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        default: null
    },
    activo: {
        type: Boolean,
        default: true
    },
    auth_id: {
        type: String,
        unique: true,
        sparse: true,  // permite null sin romper el unique
        default: null
    },
    direcciones: [{
        etiqueta: { type: String, trim: true },
        direccion: { type: String, trim: true },
        predeterminada: { type: Boolean, default: false }
    }]
}, {
    timestamps: true,
    // Esto asegura que al convertir a JSON no se envíe la contraseña por accidente
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});

export default model('User', userSchema);