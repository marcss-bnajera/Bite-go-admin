import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validaciones para crear un pedido
 */
export const validateCreateOrder = [
    body('id_usuario_cliente')
        .notEmpty().withMessage('El ID del cliente es obligatorio')
        .isMongoId().withMessage('ID de cliente no válido'),

    body('id_restaurante')
        .notEmpty().withMessage('El ID del restaurante es obligatorio')
        .isMongoId().withMessage('ID de restaurante no válido'),

    body('tipo_servicio')
        .notEmpty().withMessage('El tipo de servicio es obligatorio')
        .isIn(['Comer aquí', 'Domicilio', 'Para llevar'])
        .withMessage('Tipo de servicio no válido'),

    body('items')
        .isArray({ min: 1 })
        .withMessage('El pedido debe contener al menos un producto'),

    body('items.*.id_producto')
        .notEmpty().withMessage('El ID del producto es requerido')
        .isMongoId().withMessage('ID de producto no válido'),

    body('items.*.cantidad')
        .isInt({ min: 1 })
        .withMessage('La cantidad mínima por producto es 1'),

    body('items.*.nombre_historico')
        .notEmpty().withMessage('El nombre histórico es obligatorio para auditoría'),

    body('items.*.precio_historico')
        .isFloat({ min: 0 })
        .withMessage('El precio histórico debe ser un número positivo'),

    body('total')
        .isFloat({ min: 0 })
        .withMessage('El total debe ser un número positivo'),

    checkValidators
];

/**
 * Validaciones para actualizar un pedido (incluye cambio de estado)
 */
export const validateUpdateOrder = [
    param('id')
        .isMongoId()
        .withMessage('ID de pedido no válido'),

    body('estado')
        .optional()
        .isIn(['Pendiente', 'Preparacion', 'Listo', 'Servido', 'Entregado', 'Cancelado'])
        .withMessage('Estado de pedido no válido'),

    body('id_mesero_asignado')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('ID de mesero no válido'),

    body('id_repartidor_asignado')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('ID de repartidor no válido'),

    checkValidators
];

/**
 * Validaciones para consultas por ID (Usuario o Restaurante)
 */
export const validateOrderParams = [
    param('id').optional().isMongoId().withMessage('ID de pedido no válido'),
    param('id_user').optional().isMongoId().withMessage('ID de usuario no válido'),
    param('id_restaurante').optional().isMongoId().withMessage('ID de restaurante no válido'),
    checkValidators
];