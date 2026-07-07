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
import { hasRole } from '../../middlewares/validate-roles.js';
import { param } from 'express-validator';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();
const adminRoles = hasRole('SuperAdmin', 'Admin_Restaurante');

const handleUpload = (req, res, next) => {
    uploadProductImage.single('foto')(req, res, (err) => {
        if (!err) return next();
        if (err.message && err.message.startsWith('Solo se permiten imágenes')) {
            return res.status(400).json({
                success: false,
                message: `Formato de imagen no permitido. Solo se aceptan: JPEG, JPG, PNG, WEBP o AVIF.`
            });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `La imagen excede el tamaño máximo permitido de 10MB.`
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message || 'Error al procesar la imagen.'
        });
    });
};

router.get('/', getProducts);
router.get('/all', (req, res, next) => { req.query.activo = req.query.activo ?? undefined; next(); }, getProducts);
router.get('/:id', getProductById);
router.get('/restaurant/:id_restaurante', getProductsByRestaurant);

router.post(
    '/',
    handleUpload,
    createProductValidator,
    cleanupUploadedFileOnFinish,
    createProduct
);

router.put(
    '/:id',
    handleUpload,
    updateProductValidator,
    cleanupUploadedFileOnFinish,
    updateProduct
);

router.delete('/:id', adminRoles, [
    param('id').isMongoId().withMessage('ID de producto no válido'),
    checkValidators
], deleteProduct);
router.patch('/:id/activate', adminRoles, [
    param('id').isMongoId().withMessage('ID de producto no válido'),
    checkValidators
], activateProduct);

export default router;