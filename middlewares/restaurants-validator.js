import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validación para obtener y añadir eventos (usan :id del restaurante)
 */
export const validateRestaurantId = [
    param('id')
        .isMongoId()
        .withMessage('ID de restaurante no válido'),
    checkValidators
];

/**
 * Validación para el BODY al añadir/actualizar evento
 */
export const validateEventoBody = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre del evento es obligatorio')
        .isLength({ min: 5, max: 50 })
        .withMessage('El nombre del evento debe tener entre 5 y 50 caracteres'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción es demasiado larga (máx 500)'),

    body('fechas')
        .isArray({ min: 1 })
        .withMessage('Debes agregar al menos una fecha'),
    body('fechas.*')
        .isISO8601()
        .withMessage('Cada fecha debe ser un formato válido (ISO8601)')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Las fechas del evento deben ser en el futuro');
            }
            return true;
        }),

    checkValidators
];

/**
 * Validación para rutas que requieren ID de restaurante e ID de evento
 * (Update y Delete)
 */
export const validateEventUpdateDelete = [
    param('restId')
        .isMongoId()
        .withMessage('ID de restaurante no válido'),
    param('eventoId')
        .isMongoId()
        .withMessage('ID de evento no válido'),
    checkValidators
];

export const validateCreateRestaurant = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio'),
    body('direccion.texto')
        .trim()
        .custom((value, { req }) => {
            if (!req.body.tiene_sucursales && !value) {
                throw new Error('La dirección es obligatoria');
            }
            return true;
        }),
    body('horarios_atencion')
        .trim()
        .notEmpty()
        .withMessage('El horario es obligatorio'),
    body('categoria_gastronomica')
        .trim()
        .notEmpty()
        .withMessage('La categoría gastronómica es obligatoria'),
    body('precio_promedio')
        .isNumeric()
        .withMessage('El precio promedio debe ser un número'),
    checkValidators
];