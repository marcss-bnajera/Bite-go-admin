// Importacion de Mongoose
import { Schema, model } from 'mongoose';

// Esquema para las Reservaciones
const reservationSchema = new Schema({
    id_usuario: {
        type: String,
        required: [true, 'El usuario es obligatorio']
    },
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'El restaurante es obligatorio']
    },
    id_sucursal: {
        type: String,
        default: ''
    },
    id_mesa: {
        type: Schema.Types.ObjectId,
        required: [true, 'La mesa es obligatoria']
    },
    fecha_reserva: {
        type: Date,
        required: [true, 'La fecha y hora son obligatorias']
    },
    cantidad_personas: {
        type: Number,
        required: [true, 'La cantidad de personas es obligatoria']
    },
    estado: {
        type: String,
        enum: ['Confirmada', 'Atendida', 'Cancelada'],
        default: 'Confirmada'
    },
    asistio: {
        type: Boolean,
        default: false
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

export default model('Reservation', reservationSchema);