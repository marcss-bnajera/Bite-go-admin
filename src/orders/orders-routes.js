import { Router } from 'express';
import {
    getOrders,
    getOrderById,
    getOrdersByUser,
    getOrdersByRestaurant,
    createOrder,
    updateOrder,
    deleteOrder,
    activateOrder
} from './orders-controller.js';
import {
    validateCreateOrder,
    validateUpdateOrder,
} from "../../middlewares/order-validator.js";
import { hasRole } from "../../middlewares/validate-roles.js";
import { param } from 'express-validator';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();

const adminRoles = hasRole('SuperAdmin', 'Admin_Restaurante');
const staffRoles = hasRole('SuperAdmin', 'Admin_Restaurante', 'Mesero');

router.get('/', staffRoles, getOrders);
router.get('/:id', staffRoles, getOrderById);
router.get('/user/:id_user', staffRoles, getOrdersByUser);
router.get('/restaurant/:id_restaurante', staffRoles, getOrdersByRestaurant);
router.post('/', adminRoles, validateCreateOrder, createOrder);
router.put('/:id', adminRoles, validateUpdateOrder, updateOrder);
router.delete('/:id', adminRoles, [
    param('id').isMongoId().withMessage('ID de pedido no válido'),
    checkValidators
], deleteOrder);
router.patch('/:id/activate', adminRoles, [
    param('id').isMongoId().withMessage('ID de pedido no válido'),
    checkValidators
], activateOrder);

export default router;