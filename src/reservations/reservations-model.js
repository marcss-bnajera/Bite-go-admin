// Importacion de Mongoose
import { Schema, model } from 'mongoose';

// Esquema para las Reservaciones
const reservationSchema = new Schema({
    // Referencia al usuario que realiza la reserva
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio']
    },
    // Referencia al restaurante donde se reserva
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'El restaurante es obligatorio']
    },
    // ID de la mesa (referencia a la subcoleccion dentro de restaurante)
    tableId: {
        type: Schema.Types.ObjectId,
        required: [true, 'La mesa es obligatoria']
    },
    // Fecha y hora programada para la reserva
    reservationDate: {
        type: Date,
        required: [true, 'La fecha y hora son obligatorias']
    },
    // Cantidad de personas que asistiran
    peopleCount: {
        type: Number,
        required: [true, 'La cantidad de personas es obligatoria']
    },
    // Estado actual de la reserva
    status: {
        type: String,
        enum: ['Confirmed', 'Attended', 'Cancelled'],
        default: 'Confirmed'
    },
    // Estado logico para control de eliminacion
    active: {
        type: Boolean,
        default: true
    }
}, {
    // Registro automatico de creacion y actualizacion
    timestamps: true,
    // Formateo de respuesta JSON
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

// Exportar el modelo
export default model('Reservation', reservationSchema);