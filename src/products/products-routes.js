import { Router } from 'express';
import {
    getProducts,
    getProductById,
    getProductsByRestaurant,
    createProduct,
    activateProduct,
    updateProduct,
    deleteProduct
} from './products-controller.js';
import { createProductValidator, updateProductValidator } from '../../middlewares/product-validators.js';
import { uploadProductImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

router.get('/', getProducts);
router.get('/all', (req, res, next) => { req.query.activo = req.query.activo ?? undefined; next(); }, getProducts);
router.get('/:id', getProductById);
router.get('/restaurant/:id_restaurante', getProductsByRestaurant);

router.post(
    '/',
    uploadProductImage.single('foto'),
    createProductValidator,
    cleanupUploadedFileOnFinish,
    createProduct
);

router.put(
    '/:id',
    uploadProductImage.single('foto'),
    updateProductValidator,
    cleanupUploadedFileOnFinish,
    updateProduct
);

router.delete('/:id', deleteProduct);
router.patch('/:id/activate', activateProduct);

export default router;