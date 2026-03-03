import { body, param, query } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validaciones para CREAR una reservación
 */
export const validateCreateReservation = [
    body('userId')
        .notEmpty().withMessage('El ID del usuario es obligatorio')
        .isMongoId().withMessage('ID de usuario no válido'),

    body('restaurantId')
        .notEmpty().withMessage('El ID del restaurante es obligatorio')
        .isMongoId().withMessage('ID de restaurante no válido'),

    body('tableId')
        .notEmpty().withMessage('El ID de la mesa es obligatorio')
        .isMongoId().withMessage('ID de mesa no válido'),

    body('reservationDate')
        .notEmpty().withMessage('La fecha y hora son obligatorias')
        .isISO8601().withMessage('Formato de fecha no válido (debe ser ISO8601)')
        .custom((value) => {
            const date = new Date(value);
            if (date < new Date()) {
                throw new Error('La fecha de reserva no puede ser en el pasado');
            }
            return true;
        }),

    body('peopleCount')
        .notEmpty().withMessage('La cantidad de personas es obligatoria')
        .isInt({ min: 1, max: 20 })
        .withMessage('La cantidad de personas debe ser entre 1 y 20'),

    checkValidators
];

/**
 * Validaciones para ACTUALIZAR una reservación
 */
export const validateUpdateReservation = [
    param('id')
        .isMongoId()
        .withMessage('ID de reservación no válido'),

    body('reservationDate')
        .optional()
        .isISO8601()
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('No puedes reprogramar una reserva para una fecha pasada');
            }
            return true;
        }),

    body('peopleCount')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La cantidad de personas debe ser al menos 1'),

    body('status')
        .optional()
        .isIn(['Confirmed', 'Attended', 'Cancelled'])
        .withMessage('Estado de reserva no válido'),

    checkValidators
];

/**
 * Validación de parámetros de URL (ID y Paginación)
 */
export const validateReservationParams = [
    param('id').optional().isMongoId().withMessage('ID no válido'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1 }),
    checkValidators
];