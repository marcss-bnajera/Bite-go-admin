import { Schema, model } from 'mongoose';

// Mesas
// Esta es como un subdocumento que posteriormente se inserta en la coleccion de restaurante
const mesaSchema = new Schema({
    numero: {
        type: Number,
        required: true
    },
    capacidad: {
        type: Number,
        required: true
    },
    ubicacion: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        enum: ['Disponible', 'Ocupada', 'Reservada', 'Mantenimiento'],
        default: 'Disponible'
    }
});

// Eventos
// Esta es como un subdocumento que posteriormente se inserta en la coleccion de restaurante
const eventoSchema = new Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String
    },
    fechas: {
        type: [Date],
        required: true
    },
    servicios: {
        type: [String]
    }
});

// Restaurante (Principal)
// Esta es la coleccion principal
// Contiene todos los documentos de mesas y eventos
const restaurantSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del restaurante es obligatorio'],
        trim: true
    },
    direccion: {
        texto: { type: String, required: true },
    },
    horarios_atencion: {
        type: String,
        required: true
    },
    categoria_gastronomica: {
        type: String,
        required: true
    },
    fotos_url: {
        type: [String],
        default: []
    },
    precio_promedio: {
        type: Number,
        required: true
    },
    informacion_contacto: {
        telefono: { type: String },
        email: { type: String }
    },
    // Array de mesas
    mesas: [mesaSchema],
    // Array de eventos
    eventos: [eventoSchema],
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    // Configuración para la conversión a JSON
    // Elimina el campo __v al convertir el documento a JSON
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

// Exportar el modelo
export default model('Restaurant', restaurantSchema);