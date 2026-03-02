
import { Router } from 'express';
import {
    getOrders,
    getOrderById,
    getOrdersByUser,
    getOrdersByRestaurant,
    createOrder,
    updateOrder,
    deleteOrder
} from './orders-controller.js';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/user/:id_user', getOrdersByUser);
router.get('/restaurant/:id_restaurante', getOrdersByRestaurant);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
