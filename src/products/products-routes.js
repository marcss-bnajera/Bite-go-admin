import { Router } from 'express';
import {
    getProducts,
    getProductById,
    getProductsByRestaurant,
    createProduct,
    updateProduct,
    deleteProduct
} from './products-controller.js';
import { createProductValidator, updateProductValidator } from '../../middlewares/product-validators.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/restaurant/:id_restaurante', getProductsByRestaurant);

router.post('/', createProductValidator, createProduct);
router.put('/:id', updateProductValidator, updateProduct);

router.delete('/:id', deleteProduct);

export default router;