import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validación para CREAR Categoría
 */
export const validateCreateCategory = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre de la categoría es obligatorio')
        .isLength({ min: 3, max: 30 })
        .withMessage('El nombre debe tener entre 3 y 30 caracteres'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La descripción no puede exceder los 100 caracteres'),

    body('id_restaurante')
        .notEmpty()
        .withMessage('El ID del restaurante es requerido')
        .isMongoId()
        .withMessage('ID de restaurante no es válido (debe ser un ObjectId)'),

    checkValidators
];

/**
 * Validación para ACTUALIZAR Categoría
 */
export const validateUpdateCategory = [
    param('id')
        .isMongoId()
        .withMessage('El ID de la categoría no es un formato válido'),

    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El nombre debe tener entre 3 y 30 caracteres'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La descripción no puede exceder los 100 caracteres'),

    // Generalmente el id_restaurante no se cambia, pero si se permite:
    body('id_restaurante')
        .optional()
        .isMongoId()
        .withMessage('ID de restaurante no es válido'),

    checkValidators
];

/**
 * Validación para Obtener por ID o Eliminar
 */
export const validateCategoryId = [
    param('id')
        .isMongoId()
        .withMessage('El ID proporcionado no es un formato válido de MongoDB'),
    checkValidators
];