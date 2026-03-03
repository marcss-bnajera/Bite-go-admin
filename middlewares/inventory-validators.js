import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validaciones para crear un nuevo insumo
 */
export const validateCreateInsumo = [
    body('id_restaurante')
        .notEmpty().withMessage('El ID del restaurante es obligatorio')
        .isMongoId().withMessage('ID de restaurante no válido'),

    body('nombre_insumo')
        .trim()
        .notEmpty().withMessage('El nombre del insumo es obligatorio')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    body('stock_actual')
        .notEmpty().withMessage('El stock inicial es obligatorio')
        .isFloat({ min: 0 }).withMessage('El stock inicial no puede ser negativo'),

    body('stock_minimo')
        .notEmpty().withMessage('El stock mínimo es obligatorio')
        .isFloat({ min: 0 }).withMessage('El stock mínimo no puede ser negativo'),

    checkValidators
];

/**
 * Validación para ajuste manual de stock (Compras o Mermas)
 */
export const validateAdjustStock = [
    param('id').isMongoId().withMessage('ID de insumo no válido'),

    body('cantidad')
        .notEmpty().withMessage('La cantidad de ajuste es obligatoria')
        .isFloat()
        .withMessage('La cantidad debe ser un número (positivo para sumas, negativo para restas)'),

    checkValidators
];

/**
 * Validación para consultas por restaurante (Listado y Alertas)
 */
export const validateInventoryParams = [
    param('id_restaurante')
        .isMongoId()
        .withMessage('ID de restaurante no válido'),
    checkValidators
];

/**
 * Validación para eliminar/obtener por ID único
 */
export const validateInsumoId = [
    param('id').isMongoId().withMessage('ID de insumo no válido'),
    checkValidators
];