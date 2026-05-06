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
import { uploadProductImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/restaurant/:id_restaurante', getProductsByRestaurant);

router.post(
    '/',
    uploadProductImage.single('foto'),
    cleanupUploadedFileOnFinish,
    createProductValidator,
    createProduct
);

router.put(
    '/:id',
    uploadProductImage.single('foto'),
    updateProductValidator,
    updateProduct
);

router.delete('/:id', deleteProduct);

export default router;