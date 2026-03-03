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
        .isLength({ max: 200 })
        .withMessage('La descripción es demasiado larga (máx 200)'),

    body('fecha')
        .optional()
        .isISO8601()
        .withMessage('La fecha debe ser un formato válido (AAAA-MM-DD)'),

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