import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validación para obtener y añadir ingredientes
 */
export const validateRecipeIdParam = [
    param('id')
        .isMongoId()
        .withMessage('El ID del producto no es un formato válido de MongoDB'),
    checkValidators
];

/**
 * Validación para el cuerpo (BODY) de un ingrediente
 */
export const validateRecipeItemBody = [
    body('nombre_insumo')
        .notEmpty().withMessage('El nombre del insumo es obligatorio')
        .isString().withMessage('El nombre del insumo debe ser texto')
        .trim(),

    body('cantidad_requerida')
        .notEmpty().withMessage('La cantidad requerida es obligatoria')
        .isFloat({ min: 0.01 }).withMessage('La cantidad debe ser un número mayor a 0'),

    checkValidators
];

/**
 * Validación para actualizar un ítem específico de la receta
 */
export const validateRecipeUpdateDelete = [
    param('productId')
        .isMongoId().withMessage('ID de producto no válido'),
    param('recipeId')
        .isMongoId().withMessage('ID de ingrediente (receta) no válido'),
    checkValidators
];
