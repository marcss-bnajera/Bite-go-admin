import { Router } from 'express';
import {
    getProducts,
    getProductById,
    getProductsByRestaurant,
    createProduct,
    updateProduct,
    deleteProduct
} from './products-controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/restaurant/:id_restaurante', getProductsByRestaurant);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;