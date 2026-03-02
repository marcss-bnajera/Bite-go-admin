`use strict`

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
    dpi: {
        type: String,
        unique: true,
    },
    rol: {
        type: String,
        required: true,
        enum: ['Admin_Plataforma', 'Admin_Restaurante', 'Mesero', 'Repartidor', 'Cocinero', 'Cliente'],
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
    }
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